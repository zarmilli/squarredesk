import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import md5 from "https://esm.sh/blueimp-md5@2.19.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const PLANS = {
  basic: {
    name: "Squarre Basic Plan",
    amount: "49.00",
  },
  pro: {
    name: "Squarre Pro Plan",
    amount: "199.00",
  },
}

function generateSignature(
  data: Record<string, string>,
  passphrase: string
) {
  const sorted = Object.keys(data)
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

serve(async (req: Request) => {

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { plan, userId, email, firstName } = await req.json()

    if (!PLANS[plan as keyof typeof PLANS]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS]

    const now = new Date()

    const billingDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    )
      .toISOString()
      .split("T")[0]

    const paymentData: Record<string, string> = {
      merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID")!,
      merchant_key: Deno.env.get("PAYFAST_MERCHANT_KEY")!,

      return_url: "https://squarre.vercel.app/dashboard",
      cancel_url: "https://squarre.vercel.app/subscriptions",

      notify_url:
        "https://suwiamrsjmbvhceqxchp.supabase.co/functions/v1/payfast-itn",

      name_first: firstName,
      email_address: email,
      m_payment_id: userId,

      amount: selectedPlan.amount,
      item_name: selectedPlan.name,

      subscription_type: "1",
      billing_date: billingDate,
      recurring_amount: selectedPlan.amount,
      frequency: "3",
    }

    const signature = await generateSignature(
      paymentData,
      Deno.env.get("PAYFAST_PASSPHRASE") || ""
    )

    const paymentUrl =
      "https://www.payfast.co.za/eng/process?" +
      new URLSearchParams({
        ...paymentData,
        signature,
      }).toString()

    return new Response(JSON.stringify({ paymentUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error(err)

    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})