// supabase/functions/customer-checkout/index.ts
// Validates session, snapshots the cart into an order, and initiates PayFast.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import md5 from "https://esm.sh/blueimp-md5@2.19.0"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function validateSession(token: string, site_id: string) {
  const { data } = await supabase
    .from("customer_sessions")
    .select("customer_id, expires_at")
    .eq("token", token)
    .eq("site_id", site_id)
    .single()

  if (!data) return null
  if (new Date(data.expires_at) < new Date()) return null
  return data.customer_id
}

serve(async (req) => {
  let createdOrderId: string | null = null

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const { site_id, session_token, shipping_address, cell_number } = await req.json()

    // Validate customer session
    const customer_id = await validateSession(session_token, site_id)
    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: "Session expired, please log in again" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      )
    }

    // Fetch cart items with product details
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("quantity, products(id, name, price)")
      .eq("customer_id", customer_id)
      .eq("site_id", site_id)

    if (!cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      )
    }

    // Check stock and build order snapshot
    const items = cartItems.map((item: any) => ({
      product_id: item.products.id,
      product_name: item.products.name,
      price: item.products.price,
      quantity: item.quantity,
      subtotal: item.products.price * item.quantity,
    }))

    const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0)

    // Resolve the site owner and customer before creating the order.
    const { data: site, error: siteError } = await supabase
      .from("user_sites")
      .select("user_id, live_url")
      .eq("id", site_id)
      .single()
    if (siteError || !site) throw siteError ?? new Error("Site not found")

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("email")
      .eq("id", customer_id)
      .eq("site_id", site_id)
      .single()
    if (customerError || !customer) {
      throw customerError ?? new Error("Customer not found")
    }

    let ownerProfile: { payfast_merchant_id: string | null } | null = null
    if (total > 0) {
      const { data, error: ownerProfileError } = await supabase
        .from("profiles")
        .select("payfast_merchant_id")
        .eq("user_id", site.user_id)
        .single()
      if (ownerProfileError || !data) {
        throw ownerProfileError ?? new Error("Site owner profile not found")
      }
      ownerProfile = data
      if (!ownerProfile.payfast_merchant_id) {
        return new Response(
          JSON.stringify({ error: "This store has not configured PayFast payments" }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        )
      }
    }

    // Create pending order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        site_id,
        customer_id,
        status: "pending",
        total,
        items,
        shipping_address,
        cell_number,
      })
      .select("id")
      .single()
    if (orderError || !order) throw orderError ?? new Error("Failed to create order")
    createdOrderId = order.id

    // Insert order items
    const { error: orderItemsError } = await supabase.from("order_items").insert(
      items.map((item: any) => ({
        order_id: order!.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      }))
    )
    if (orderItemsError) {
      await supabase.from("orders").delete().eq("id", order.id)
      throw orderItemsError
    }

    // Build PayFast payment URL
    // Platform takes a small commission via split payment
    const PLATFORM_COMMISSION = 0.05 // 5%
    const commission = Number((total * PLATFORM_COMMISSION).toFixed(2))
    const storefrontUrl = (site.live_url || `https://${site_id}.netlify.app`).replace(/\/$/, "")

    const productIds = items.map((item: any) => item.product_id)
    if (total <= 0) {
      const { error: paidError } = await supabase
        .from("orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", order.id)

      if (paidError) throw paidError

      const { error: cartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("site_id", site_id)
        .eq("customer_id", customer_id)
        .in("product_id", productIds)

      if (cartError) throw cartError

      return new Response(
        JSON.stringify({
          paymentUrl: `${storefrontUrl}/order-success?order=${order.id}`,
          orderId: order.id,
          paid: true,
        }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      )
    }

    const paymentData: Record<string, string> = {
      merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID")!,
      merchant_key: Deno.env.get("PAYFAST_MERCHANT_KEY")!,
      return_url: `${storefrontUrl}/order-success?order=${order.id}`,
      cancel_url: `${storefrontUrl}/order-cancelled/?order=${order.id}`,
      notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/ecommerce-itn`,
      email_address: customer.email,
      m_payment_id: order.id,
      amount: total.toFixed(2),
      item_name: `Order from your store`,
      // Split payment to site owner
      ...(ownerProfile?.payfast_merchant_id && {
        setup: JSON.stringify({
          merchant: { merchant_id: ownerProfile.payfast_merchant_id },
          splits: [{ merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID"), amount: commission }],
        }),
      }),
    }

    // Generate signature
    const paramString = Object.entries(paymentData)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`)
      .join("&")

    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE")!
    const stringToHash = `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    const signature = md5(stringToHash)

    const queryString = Object.entries(paymentData)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`)
      .join("&")

    const paymentUrl = `https://www.payfast.co.za/eng/process?${queryString}&signature=${signature}`

    return new Response(
      JSON.stringify({ paymentUrl, orderId: order!.id }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    )
  } catch (error) {
    if (createdOrderId) {
      await supabase
        .from("orders")
        .delete()
        .eq("id", createdOrderId)
        .eq("status", "pending")
    }
    console.error("customer-checkout error:", error)

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }
})
