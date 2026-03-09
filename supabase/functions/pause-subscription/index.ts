import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { userId } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("payfast_token")
    .eq("user_id", userId)
    .single();

  if (!profile?.payfast_token) {
    return new Response(JSON.stringify({ error: "No subscription" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await fetch(
    `https://api.payfast.co.za/subscriptions/${profile.payfast_token}/cancel`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYFAST_API_KEY")}`,
      },
    }
  );

  await supabase
    .from("profiles")
    .update({
      membership_tier: "free",
      payfast_token: null,
      subscription_started_at: null,
      subscription_ends_at: null,
    })
    .eq("user_id", userId);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});