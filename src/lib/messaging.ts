// lib/messaging.ts

import { supabase } from "@/lib/supabase"

// ── Get or create a conversation between two users ──────────────
// Prevents duplicate conversations between the same two people
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {

  // Check if a conversation already exists between these two users
  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId)

  if (existing && existing.length > 0) {
    const conversationIds = existing.map(p => p.conversation_id)

    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", conversationIds)

    if (shared && shared.length > 0) {
      return shared[0].conversation_id
    }
  }

  // No existing conversation — create one
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single()

  // Add both participants
  await supabase.from("conversation_participants").insert([
    { conversation_id: conversation!.id, user_id: currentUserId },
    { conversation_id: conversation!.id, user_id: otherUserId },
  ])

  return conversation!.id
}

// ── Fetch all conversations for the current user ────────────────
export async function getConversations(userId: string) {
  const { data } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      last_read_at,
      conversations (
        id,
        updated_at
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return data ?? []
}

// ── Fetch messages for a conversation ──────────────────────────
export async function getMessages(conversationId: string) {
  const { data } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      content,
      created_at,
      deleted_at,
      sender_id,
      profiles (
        first_name,
        last_name
      )
    `)
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  return data ?? []
}

// ── Send a message ──────────────────────────────────────────────
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
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

// ── Mark conversation as read ───────────────────────────────────
export async function markAsRead(
  conversationId: string,
  userId: string
) {
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
}

// ── Soft delete a message ───────────────────────────────────────
export async function deleteMessage(messageId: string) {
  await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
}

// ── Get unread count for a conversation ────────────────────────
export async function getUnreadCount(
  conversationId: string,
  userId: string
): Promise<number> {
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