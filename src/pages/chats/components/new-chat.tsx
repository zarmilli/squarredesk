import { useState } from "react"
import { Check, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ProfileSummary } from "../data/chat-types"

type NewChatProps = {
  users: ProfileSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (otherUserId: string) => Promise<void>
}

const getAvatarUrl = (user: ProfileSummary) => user.avatar_url || user.avatar || undefined
const getInitials = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()

export function NewChat({ users, onOpenChange, open, onStart }: NewChatProps) {
  const [selectedUser, setSelectedUser] = useState<ProfileSummary | null>(null)
  const [starting, setStarting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) setSelectedUser(null)
  }

  const handleStart = async () => {
    if (!selectedUser) return
    setStarting(true)
    try {
      await onStart(selectedUser.user_id)
      handleOpenChange(false)
    } finally {
      setStarting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>

        {selectedUser && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 py-1">
              {selectedUser.first_name} {selectedUser.last_name}
              <button type="button" onClick={() => setSelectedUser(null)} aria-label="Remove recipient">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        <Command className="rounded-lg border">
          <CommandInput placeholder="Search people..." />
          <CommandList>
            <CommandEmpty>No people found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => {
                const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                const avatarUrl = getAvatarUrl(user)
                return (
                  <CommandItem
                    key={user.user_id}
                    value={`${name} ${user.company_name ?? ""}`}
                    onSelect={() => setSelectedUser(user)}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarUrl} alt={name} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground">{user.company_name || "Organisation not provided"}</p>
                      </div>
                    </div>
                    {selectedUser?.user_id === user.user_id && <Check className="h-4 w-4" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>

        <Button onClick={handleStart} disabled={!selectedUser || starting} className={cn("w-full")}> 
          {starting ? "Opening conversation..." : "Start chat"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}