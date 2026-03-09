import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const now = new Date()

    const graceDate = new Date()
    graceDate.setDate(graceDate.getDate() - 3)

    const { data: expiredUsers, error } = await supabase
      .from("profiles")
      .select("user_id, subscription_ends_at, payfast_token")
      .not("payfast_token", "is", null)
      .lt("subscription_ends_at", graceDate.toISOString())

    if (error) {
      console.error("Query error:", error)
      return new Response("Error", { status: 500 })
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response("No expired subscriptions", { status: 200 })
    }

    for (const user of expiredUsers) {
      console.log("Downgrading:", user.user_id)

      await supabase
        .from("profiles")
        .update({
          membership_tier: "free",
          payfast_token: null,
          subscription_started_at: null,
          subscription_ends_at: null,
        })
        .eq("user_id", user.user_id)

      await supabase.from("billing_history").insert({
        user_id: user.user_id,
        status: "FAILED_RECURRING",
        plan: "expired",
        paid_at: new Date(),
      })
    }

    return new Response(
      JSON.stringify({
        downgraded: expiredUsers.length,
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error(err)
    return new Response("Server error", { status: 500 })
  }
})