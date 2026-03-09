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
    .map(
      (key) =>
        `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`
    )
    .join("&")

  const stringToHash = passphrase
    ? `${sorted}&passphrase=${encodeURIComponent(passphrase)}`
    : sorted

  return md5(stringToHash)
}

async function verifyPayfast(body: string) {
  const res = await fetch(
    "https://www.payfast.co.za/eng/query/validate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )

  const text = await res.text()

  return text === "VALID"
}

serve(async (req: Request) => {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)

    const data: Record<string, string> = {}
    params.forEach((value, key) => {
      data[key] = value
    })

    const receivedSignature = data.signature

    const calculatedSignature = generateSignature(
      data,
      Deno.env.get("PAYFAST_PASSPHRASE") || ""
    )

    if (receivedSignature !== calculatedSignature) {
      console.error("Invalid signature")
      return new Response("Invalid signature", { status: 400 })
    }

    const isValid = await verifyPayfast(body)

    if (!isValid) {
      console.error("PayFast validation failed")
      return new Response("Invalid payment", { status: 400 })
    }

    const paymentStatus = data.payment_status
    const userId = data.m_payment_id
    const paymentId = data.pf_payment_id
    const token = data.token
    const amount = parseFloat(data.amount_gross || "0")
    const itemName = data.item_name

    if (!userId) {
      return new Response("Missing user ID", { status: 400 })
    }

    const { data: existing } = await supabase
      .from("billing_history")
      .select("id")
      .eq("payfast_payment_id", paymentId)
      .maybeSingle()

    if (existing) {
      console.log("Duplicate ITN ignored")
      return new Response("Already processed", { status: 200 })
    }

    let plan = "basic"

    if (itemName?.toLowerCase().includes("pro")) {
      plan = "pro"
    }

    if (paymentStatus === "COMPLETE") {

      const now = new Date()

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_ends_at")
        .eq("user_id", userId)
        .maybeSingle()

      let startDate = now
      let endDate = new Date()

      if (profile?.subscription_ends_at) {
        const currentEnd = new Date(profile.subscription_ends_at)

        if (currentEnd > now) {
          startDate = currentEnd
        }
      }

      endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      await supabase
        .from("profiles")
        .update({
          membership_tier: plan,
          payfast_token: token || null,
          subscription_started_at: now,
          subscription_ends_at: endDate,
        })
        .eq("user_id", userId)

      await supabase.from("billing_history").insert({
        user_id: userId,
        payfast_payment_id: paymentId,
        payfast_token: token,
        amount,
        plan,
        status: paymentStatus,
        paid_at: new Date(),
      })

      console.log("Subscription updated for", userId)
    }

    if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      await supabase.from("billing_history").insert({
        user_id: userId,
        payfast_payment_id: paymentId,
        payfast_token: token,
        amount,
        plan,
        status: paymentStatus,
        paid_at: new Date(),
      })
    }

    return new Response("OK", { status: 200 })
  } catch (err) {
    console.error("ITN error:", err)
    return new Response("Server error", { status: 500 })
  }
})