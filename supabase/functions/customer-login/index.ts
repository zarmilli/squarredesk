// supabase/functions/customer-login/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { site_id, email, password } = await req.json()

  const { data: customer } = await supabase
    .from("customers")
    .select("id, email, first_name, last_name, password_hash")
    .eq("site_id", site_id)
    .eq("email", email)
    .maybeSingle()

  if (!customer) {
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }

  const valid = await bcrypt.compare(password, customer.password_hash)

  if (!valid) {
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }

  // Invalidate old sessions for this customer
  await supabase
    .from("customer_sessions")
    .delete()
    .eq("customer_id", customer.id)

  const token = crypto.randomUUID()
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await supabase.from("customer_sessions").insert({
    customer_id: customer.id,
    site_id,
    token,
    expires_at: expires_at.toISOString(),
  })

  const { password_hash, ...safeCustomer } = customer

  return new Response(
    JSON.stringify({ customer: safeCustomer, token, expires_at }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  )
})