import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import md5 from "https://esm.sh/blueimp-md5@2.19.0"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

function generateSignature(data: Record<string, string>, passphrase: string) {
  const sorted = Object.keys(data)
    .filter((key) => key !== "signature")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&")

  return md5(
    passphrase
      ? `${sorted}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
      : sorted
  )
}

async function verifyPayfast(body: string) {
  const response = await fetch("https://www.payfast.co.za/eng/query/validate", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  return (await response.text()) === "VALID"
}

function getProductIds(items: unknown) {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => item && typeof item === "object" ? (item as { product_id?: unknown }).product_id : null)
    .filter((productId): productId is string => typeof productId === "string" && productId.length > 0)
}

serve(async (req: Request) => {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}
    params.forEach((value, key) => { data[key] = value })

    const receivedSignature = data.signature
    const calculatedSignature = generateSignature(
      data,
      Deno.env.get("PAYFAST_PASSPHRASE") || ""
    )

    if (!receivedSignature || receivedSignature !== calculatedSignature) {
      return new Response("Invalid signature", { status: 400 })
    }

    if (!(await verifyPayfast(body))) {
      return new Response("Invalid payment", { status: 400 })
    }

    const orderId = data.m_payment_id
    const paymentStatus = data.payment_status
    const paymentId = data.pf_payment_id
    if (!orderId || !paymentStatus) {
      return new Response("Missing payment fields", { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, site_id, customer_id, total, items, status")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order) return new Response("Order not found", { status: 404 })

    if (paymentStatus === "COMPLETE") {
      const receivedAmount = Number(data.amount_gross || data.amount || 0)
      if (!Number.isFinite(receivedAmount) || Math.abs(receivedAmount - Number(order.total)) > 0.01) {
        return new Response("Payment amount mismatch", { status: 400 })
      }

      if (order.status !== "paid") {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            payfast_payment_id: paymentId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        if (updateError) throw updateError
      }

      const productIds = getProductIds(order.items)
      let cartDelete = supabase
        .from("cart_items")
        .delete()
        .eq("site_id", order.site_id)
        .eq("customer_id", order.customer_id)

      if (productIds.length > 0) {
        cartDelete = cartDelete.in("product_id", productIds)
      }

      const { error: cartError } = await cartDelete
      if (cartError) throw cartError
    } else if (paymentStatus === "CANCELLED" || paymentStatus === "FAILED") {
      // order_items is deleted by the orders.order_id cascade.
      if (order.status === "pending") {
        const { error: deleteError } = await supabase
          .from("orders")
          .delete()
          .eq("id", order.id)
          .eq("status", "pending")

        if (deleteError) throw deleteError
      }
    }

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("ecommerce-itn error:", error)
    return new Response("Server error", { status: 500 })
  }
})
