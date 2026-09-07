export type ProfileSummary = {
  user_id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  avatar_url?: string | null
  avatar?: string | null
}

export type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  deleted_at?: string | null
  profiles?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export type ConversationSummary = {
  id: string
  updatedAt: string
  user: ProfileSummary
  lastMessage: ChatMessage | null
}