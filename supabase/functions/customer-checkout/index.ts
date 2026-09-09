// supabase/functions/customer-checkout/index.ts
// Validates session, creates order, clears cart, initiates PayFast
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
      .select("quantity, products(id, name, price, stock)")
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

    // Fetch site owner details for PayFast split payment
    const { data: site } = await supabase
      .from("user_sites")
      .select("user_id")
      .eq("id", site_id)
      .single()

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, first_name, payfast_token")
      .eq("user_id", site!.user_id)
      .single()

    // Create pending order
    const { data: order } = await supabase
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

    // Insert order items
    await supabase.from("order_items").insert(
      items.map((item: any) => ({
        order_id: order!.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      }))
    )

    // Build PayFast payment URL
    // Platform takes a small commission via split payment
    const PLATFORM_COMMISSION = 0.05 // 5%
    const commission = Number((total * PLATFORM_COMMISSION).toFixed(2))

    const paymentData: Record<string, string> = {
      merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID")!,
      merchant_key: Deno.env.get("PAYFAST_MERCHANT_KEY")!,
      return_url: `https://${site_id}.netlify.app/order-success?order=${order!.id}`,
      cancel_url: `https://${site_id}.netlify.app/cart`,
      notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/ecommerce-itn`,
      email_address: ownerProfile!.email,
      m_payment_id: order!.id,
      amount: total.toFixed(2),
      item_name: `Order from your store`,
      // Split payment to site owner
      ...(ownerProfile?.payfast_token && {
        setup: JSON.stringify({
          merchant: { merchant_id: ownerProfile.payfast_token },
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
    console.error("customer-checkout error:", error)

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }
})