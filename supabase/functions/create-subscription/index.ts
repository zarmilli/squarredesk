import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import md5 from "https://esm.sh/blueimp-md5@2.19.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type PlanKey = "basic" | "pro"

const PLANS: Record<PlanKey, { name: string; amount: string }> = {
  basic: {
    name: "Squarre Basic Plan",
    amount: "49.00",
  },
  pro: {
    name: "Squarre Pro Plan",
    amount: "199.00",
  },
}

const PAYFAST_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "amount",
  "item_name",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
]

function generateSignature(
  data: Record<string, string>,
  passphrase: string
) {
  const paramString = PAYFAST_FIELD_ORDER
    .filter((key) => data[key] !== undefined && data[key] !== null && data[key] !== "")
    .map((key) => `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}`)
    .join("&")

  const stringToHash = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : paramString

  console.log("=== PAYFAST DEBUG ===")
  console.log("paramString:", paramString)
  console.log("stringToHash:", stringToHash)
  console.log("====================")

  return md5(stringToHash)
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const plan: PlanKey = body.plan
    const userId: string = body.userId
    const email: string = body.email
    const firstName: string = body.firstName

    if (!PLANS[plan]) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const selectedPlan = PLANS[plan]

    const now = new Date()

    const billingDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toISOString()
      .split("T")[0]

    const paymentData: Record<string, string> = {
      merchant_id:       Deno.env.get("PAYFAST_MERCHANT_ID") ?? "",
      merchant_key:      Deno.env.get("PAYFAST_MERCHANT_KEY") ?? "",
      return_url:        "https://squarredesk.vercel.app/dashboard",
      cancel_url:        "https://squarredesk.vercel.app/subscriptions",
      notify_url:        "https://suwiamrsjmbvhceqxchp.supabase.co/functions/v1/payfast-itn",
      name_first:        firstName,
      email_address:     email,
      m_payment_id:      userId,
      amount:            selectedPlan.amount,
      item_name:         selectedPlan.name,
      subscription_type: "1",
      billing_date:      billingDate,
      recurring_amount:  selectedPlan.amount,
      frequency:         "3",
      cycles:            "0",
    }

    // ─── TEMPORARY: hardcoded passphrase for debugging ───────────────
    // Replace "your_actual_passphrase" with your real PayFast passphrase
    // exactly as it appears in your PayFast dashboard → Settings → Passphrase
    const passphrase = "M1llion2daM00n"
    // ─────────────────────────────────────────────────────────────────

    const signature = generateSignature(paymentData, passphrase)

    const queryString = PAYFAST_FIELD_ORDER
      .filter((key) => paymentData[key] !== undefined && paymentData[key] !== null && paymentData[key] !== "")
      .map((key) => `${key}=${encodeURIComponent(paymentData[key].trim()).replace(/%20/g, "+")}`)
      .join("&")

    const paymentUrl = `https://www.payfast.co.za/eng/process?${queryString}&signature=${signature}`

    console.log("signature:", signature)
    console.log("paymentUrl:", paymentUrl)

    return new Response(
      JSON.stringify({ paymentUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    console.error("Subscription error:", err)

    return new Response(
      JSON.stringify({ error: "Server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})