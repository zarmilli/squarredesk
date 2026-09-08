// supabase/functions/customer-register/index.ts
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

  const { site_id, email, password, first_name, last_name } = await req.json()

  if (!site_id || !email || !password) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }

  // Check if email already registered for this site
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("site_id", site_id)
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    return new Response(
      JSON.stringify({ error: "Email already registered" }),
      { status: 409, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }

  const password_hash = await bcrypt.hash(password)

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({ site_id, email, password_hash, first_name, last_name })
    .select("id, email, first_name, last_name")
    .single()

  if (error) throw error

  // Create session token
  const token = crypto.randomUUID()
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await supabase.from("customer_sessions").insert({
    customer_id: customer.id,
    site_id,
    token,
    expires_at: expires_at.toISOString(),
  })

  return new Response(
    JSON.stringify({ customer, token, expires_at }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  )
})