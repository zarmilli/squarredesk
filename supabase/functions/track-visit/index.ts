// supabase/functions/track-visit/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  try {
    const body = await req.json()
    const { action, ...payload } = body

    // ── INSERT new visit ─────────────────────────────────────────
    if (action === "visit") {
      const {
        site_id, visitor_hash, device,
        city, province, country,
      } = payload

      // Check if this visitor already has a row for today
      const today = new Date().toISOString().split("T")[0]

      const { data: existing } = await supabase
        .from("site_visits")
        .select("id, visit_count")
        .eq("site_id", site_id)
        .eq("visitor_hash", visitor_hash)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lte("created_at", `${today}T23:59:59.999Z`)
        .maybeSingle()

      // If already visited today, increment count and return existing id
      if (existing) {
        await supabase
          .from("site_visits")
          .update({ visit_count: (existing.visit_count ?? 1) + 1 })
          .eq("id", existing.id)

        return new Response(
          JSON.stringify({ id: existing.id }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        )
      }

      // First visit today — insert new row
      const { data: inserted, error } = await supabase
        .from("site_visits")
        .insert({
          site_id,
          visitor_hash,
          device,
          city,
          province,
          country,
          visit_count: 1,
        })
        .select("id")
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ id: inserted.id }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      )
    }

    // ── UPDATE duration + engagement ─────────────────────────────
    if (action === "update") {
      const { visit_id, duration_seconds, engaged } = payload

      if (!visit_id) {
        return new Response("Missing visit_id", { status: 400, headers: cors })
      }

      const updates: Record<string, any> = {}
      if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds
      if (engaged !== undefined) updates.engaged = engaged

      await supabase
        .from("site_visits")
        .update(updates)
        .eq("id", visit_id)

      return new Response("ok", { headers: cors })
    }

    return new Response("Unknown action", { status: 400, headers: cors })

  } catch (err) {
    console.error(err)
    return new Response("Error", { status: 500, headers: cors })
  }
})