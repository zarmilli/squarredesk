import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const { currentUserId, otherUserId } = await req.json()

    if (!currentUserId || !otherUserId) {
      return new Response(
        JSON.stringify({ error: "Missing user IDs" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      )
    }

    // Create the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({})
      .select("id")
      .single()

    if (convError || !conversation) throw convError

    // Add both participants atomically
    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversation.id, user_id: currentUserId },
        { conversation_id: conversation.id, user_id: otherUserId },
      ])

    if (partError) throw partError

    return new Response(
      JSON.stringify({ conversationId: conversation.id }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error("create-conversation error:", err)
    return new Response(
      JSON.stringify({ error: "Failed to create conversation" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    )
  }
})