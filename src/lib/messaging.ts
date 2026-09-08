// lib/messaging.ts — get a fresh client reference inside each function
// instead of importing at module level

import { createClient } from "@supabase/supabase-js"

function getClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  const supabase = getClient()

  const { data: myParticipations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId)

  const myConversationIds = (myParticipations ?? []).map(p => p.conversation_id)

  if (myConversationIds.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConversationIds)

    if (shared && shared.length > 0) {
      return shared[0].conversation_id
    }
  }

  const { data, error } = await supabase.functions.invoke("create-conversation", {
    body: { currentUserId, otherUserId },
  })

  if (error || !data?.conversationId) {
    console.error("Failed to create conversation:", error)
    throw new Error("Could not start conversation")
  }

  return data.conversationId
}



export async function getMessages(conversationId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from("messages")
    .select("id, content, created_at, deleted_at, sender_id, conversation_id")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("getMessages error:", error)
    return []
  }

  return data ?? []
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markAsRead(
  conversationId: string,
  userId: string
) {
  const supabase = getClient()

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
}

export async function deleteMessage(messageId: string) {
  const supabase = getClient()

  await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
}

export async function getUnreadCount(
  conversationId: string,
  userId: string
): Promise<number> {
  const supabase = getClient()

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single()

  if (!participant?.last_read_at) return 0

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .gt("created_at", participant.last_read_at)

  return count ?? 0
}