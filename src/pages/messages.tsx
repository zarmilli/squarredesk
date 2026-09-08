import { Fragment, FormEvent, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { format, isSameDay } from "date-fns"
import {
  ArrowLeft,
  Edit,
  ImagePlus,
  MessagesSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Video,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import {
  getMessages,
  getOrCreateConversation,
  markAsRead,
  sendMessage,
} from "@/lib/messaging"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

import { NewChat } from "./chats/components/new-chat"
import type { ChatMessage, ConversationSummary, ProfileSummary } from "./chats/data/chat-types"

const getName = (user: ProfileSummary) =>
  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed user"
const getAvatarUrl = (user: ProfileSummary) =>
  user.avatar_url || user.avatar || undefined
const getInitials = (name: string) =>
  name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()

export default function Messages() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<ProfileSummary[]>([])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConversation = conversations.find(({ id }) => id === selectedConversationId)

  // ── Load inbox — all conversations + participants + last messages ──
  const loadInbox = async () => {
  if (!currentUser) return
  setLoading(true)

  try {
    const [{ data: profileData }, { data: participationRows, error: participationError }] =
      await Promise.all([
        supabase.from("profiles").select("*").neq("user_id", currentUser.id),
        supabase
          .from("conversation_participants")
          .select("conversation_id, last_read_at")
          .eq("user_id", currentUser.id),
        // Removed .order("created_at") — was causing 500
        // ordering handled below by latest message time
      ])

    if (participationError) {
      console.error("participationError:", participationError)
      setLoading(false)
      return
    }

    setUsers((profileData ?? []) as ProfileSummary[])

    const conversationIds = (participationRows ?? []).map((r) => r.conversation_id)

    if (conversationIds.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const [
      { data: participantRows, error: participantError },
      { data: latestMessages, error: messagesError },
    ] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds)
        .neq("user_id", currentUser.id),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at, deleted_at")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ])

    if (participantError) console.error("participantError:", participantError)
    if (messagesError) console.error("messagesError:", messagesError)

    const participantIds = (participantRows ?? []).map((r) => r.user_id)
    const { data: participantProfiles } = participantIds.length
      ? await supabase.from("profiles").select("*").in("user_id", participantIds)
      : { data: [] }

    const profilesById = new Map(
      ((participantProfiles ?? []) as ProfileSummary[]).map((p) => [p.user_id, p])
    )

    const latestByConversation = new Map<string, ChatMessage>()
    for (const message of (latestMessages ?? []) as ChatMessage[]) {
      if (!latestByConversation.has(message.conversation_id)) {
        latestByConversation.set(message.conversation_id, message)
      }
    }

    const built = (participationRows ?? []).flatMap((row) => {
      const participant = (participantRows ?? []).find(
        (p) => p.conversation_id === row.conversation_id
      )
      const profile = participant ? profilesById.get(participant.user_id) : undefined
      if (!profile) return []

      return [{
        id: row.conversation_id,
        updatedAt: latestByConversation.get(row.conversation_id)?.created_at ?? "",
        user: profile,
        lastMessage: latestByConversation.get(row.conversation_id) ?? null,
      }]
    })

    // Sort by most recent message
    built.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    setConversations(built)
  } catch (err) {
    console.error("loadInbox error:", err)
    toast({
      title: "Unable to load messages",
      description: "Please try again.",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    loadInbox().catch(() => {
      toast({
        title: "Unable to load messages",
        description: "Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    })
  }, [currentUser?.id])

  // Auto-select conversation from URL param
  useEffect(() => {
    const conversationId = searchParams.get("conversation")
    if (!conversationId || loading || !conversations.some(({ id }) => id === conversationId)) return
    setSelectedConversationId(conversationId)
    setMobileOpen(true)
  }, [conversations, loading, searchParams])

  // Load messages + realtime subscription for selected conversation
  useEffect(() => {
    if (!selectedConversationId || !currentUser) return
    let active = true

    getMessages(selectedConversationId).then((data) => {
      if (active) setMessages(data as unknown as ChatMessage[])
    })
    markAsRead(selectedConversationId, currentUser.id)

    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [selectedConversationId, currentUser?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const openConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setMobileOpen(true)
  }

  const handleChat = async (otherUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const conversationId = await getOrCreateConversation(user.id, otherUserId)
      await loadInbox()
      navigate(`/messages?conversation=${conversationId}`)
    } catch (err) {
      toast({
        title: "Could not start conversation",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedConversationId || !currentUser || !draft.trim()) return
    try {
      await sendMessage(selectedConversationId, currentUser.id, draft)
      setDraft("")
    } catch {
      toast({ title: "Message could not be sent", variant: "destructive" })
    }
  }

  const filteredConversations = conversations.filter(({ user }) =>
    getName(user).toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="flex h-[600px] min-h-0 flex-none overflow-hidden p-4 lg:p-6">
      <section className="flex h-full min-h-0 w-full gap-6">

        {/* SIDEBAR — conversation list */}
        <div className={cn(
          "flex h-full min-h-0 w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80",
          mobileOpen && "hidden sm:flex"
        )}>
          <div className="sticky top-0 z-10 bg-card pb-3 sm:static sm:p-0">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Inbox</h1>
                <MessagesSquare size={20} />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setNewChatOpen(true)}
                aria-label="New message"
              >
                <Edit size={20} />
              </Button>
            </div>
            <label className="flex h-10 w-full items-center rounded-md border border-border px-2 focus-within:ring-1 focus-within:ring-ring">
              <Search size={15} className="mr-2 text-muted-foreground" />
              <span className="sr-only">Search chat</span>
              <input
                className="w-full bg-inherit text-sm outline-none"
                placeholder="Search chat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <ScrollArea className="min-h-0 flex-1 p-1">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">Loading conversations...</p>
            ) : (
              filteredConversations.map((conversation) => {
                const name = getName(conversation.user)
                return (
                  <div key={conversation.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                        selectedConversationId === conversation.id && "bg-muted"
                      )}
                      onClick={() => openConversation(conversation.id)}
                    >
                      <Avatar>
                        <AvatarImage src={getAvatarUrl(conversation.user)} alt={name} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2 min-w-0">
                        <span className="block truncate font-medium">{name}</span>
                        <span className="block line-clamp-2 text-ellipsis text-muted-foreground">
                          {conversation.lastMessage
                            ? `${conversation.lastMessage.sender_id === currentUser?.id ? "You: " : ""}${conversation.lastMessage.content}`
                            : "No messages yet"}
                        </span>
                      </div>
                    </button>
                    <Separator className="my-1" />
                  </div>
                )
              })
            )}
            {!loading && filteredConversations.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No conversations yet.</p>
            )}
          </ScrollArea>
        </div>

        {/* MAIN — message thread */}
        <div className={cn(
          "flex h-full min-h-0 flex-1 flex-col rounded-md border bg-background",
          !mobileOpen && "hidden sm:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex flex-none items-center justify-between bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="sm:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft />
                  </Button>
                  <Avatar>
                    <AvatarImage src={getAvatarUrl(selectedConversation.user)} />
                    <AvatarFallback>{getInitials(getName(selectedConversation.user))}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium lg:text-base">
                      {getName(selectedConversation.user)}
                    </p>
                    <p className="text-xs text-muted-foreground lg:text-sm">
                      {selectedConversation.user.company_name || "Organisation not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="hidden sm:inline-flex" aria-label="Start video call">
                    <Video />
                  </Button>
                  <Button size="icon" variant="ghost" className="hidden sm:inline-flex" aria-label="Start phone call">
                    <Phone />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="More conversation options">
                    <MoreVertical />
                  </Button>
                </div>
              </div>

              {/* Messages + input */}
              <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
                <div className="editor-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2">
                  {messages.map((message, index) => {
                    const messageDate = new Date(message.created_at)
                    const previousMessage = messages[index - 1]
                    const isNewDate =
                      !previousMessage ||
                      !isSameDay(messageDate, new Date(previousMessage.created_at))

                    return (
                      <Fragment key={message.id}>
                        {isNewDate && (
                          <div className="flex items-center gap-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <Separator className="flex-1" />
                            <span>{format(messageDate, "MMMM d, yyyy")}</span>
                            <Separator className="flex-1" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-72 break-words px-3 py-2 shadow-sm",
                            message.sender_id === currentUser?.id
                              ? "self-end rounded-[16px_16px_0_16px] bg-primary text-primary-foreground"
                              : "self-start rounded-[16px_16px_16px_0] bg-muted"
                          )}
                        >
                          <p>{message.content}</p>
                          <span className="mt-1 block text-xs opacity-70">
                            {format(messageDate, "h:mm a")}
                          </span>
                        </div>
                      </Fragment>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form className="flex w-full flex-none gap-2" onSubmit={handleSend}>
                  <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1">
                    <Button size="icon" type="button" variant="ghost" aria-label="Add attachment">
                      <Plus />
                    </Button>
                    <Button size="icon" type="button" variant="ghost" className="hidden lg:inline-flex" aria-label="Add image">
                      <ImagePlus />
                    </Button>
                    <Button size="icon" type="button" variant="ghost" className="hidden lg:inline-flex" aria-label="Attach file">
                      <Paperclip />
                    </Button>
                    <input
                      className="h-8 w-full bg-inherit text-sm outline-none"
                      placeholder="Type your message..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <Button variant="ghost" size="icon" type="submit" aria-label="Send message">
                      <Send />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-border">
                <MessagesSquare className="size-8" />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-semibold">Your messages</h1>
                <p className="text-sm text-muted-foreground">Send a message to start a chat.</p>
              </div>
              <Button onClick={() => setNewChatOpen(true)}>Send message</Button>
            </div>
          )}
        </div>
      </section>

      <NewChat
        users={users}
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onStart={handleChat}
      />
    </div>
  )
}