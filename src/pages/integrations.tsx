import { useEffect, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAppData } from "@/context/AppDataContext"
import { supabase } from "@/lib/supabase"

const merchantQueryKey = (userId: string | undefined) => [
  "payfast-integration",
  userId,
]

export default function Integrations() {
  const { user, isLoading: isAppDataLoading, error: appDataError } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [merchantId, setMerchantId] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const merchantIdQuery = useQuery({
    queryKey: merchantQueryKey(user?.id),
    enabled: !!user?.id && !isAppDataLoading,
    queryFn: async () => {
      if (!user?.id) throw new Error("User session not found.")
      const { data, error } = await supabase
        .from("profiles")
        .select("payfast_merchant_id")
        .eq("user_id", user.id)
        .single()

      if (error) throw error
      return data.payfast_merchant_id as string | null
    },
  })

  const saveMerchantIdMutation = useMutation({
    mutationFn: async (value: string | null) => {
      if (!user?.id) throw new Error("User session not found.")

      const { data, error } = await supabase
        .from("profiles")
        .update({ payfast_merchant_id: value })
        .eq("user_id", user.id)
        .select("payfast_merchant_id")
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error("Your PayFast settings could not be updated.")
      return data.payfast_merchant_id as string | null
    },
    onSuccess: (value) => {
      queryClient.setQueryData(merchantQueryKey(user?.id), value)
      setDialogOpen(false)
      toast({
        title: value ? "PayFast connected" : "PayFast disconnected",
      })
    },
    onError: (error) => {
      toast({
        title: "Unable to update PayFast",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    const error = appDataError ?? merchantIdQuery.error
    if (!error) return
    toast({
      title: "Unable to load PayFast settings",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    })
  }, [appDataError, merchantIdQuery.error, toast])

  const isConnected = Boolean(merchantIdQuery.data?.trim())
  const isBusy = merchantIdQuery.isLoading || saveMerchantIdMutation.isPending

  function openConnectionDialog() {
    setMerchantId(merchantIdQuery.data ?? "")
    setDialogOpen(true)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = merchantId.trim()
    if (!value) {
      toast({
        title: "Merchant ID required",
        description: "Enter your PayFast merchant ID to connect.",
        variant: "destructive",
      })
      return
    }
    saveMerchantIdMutation.mutate(value)
  }

  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto p-4 custom-scrollbar lg:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">App Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect the services used by your workspace.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <li>
          <Card className="h-full rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted p-2 text-muted-foreground">
                <CreditCard className="size-6" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Connected
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy || !!merchantIdQuery.error}
                  onClick={openConnectionDialog}
                >
                  {merchantIdQuery.isLoading ? "Loading..." : isConnected ? "Manage" : "Connect"}
                </Button>
              </div>
            </div>
            <h2 className="mb-1 font-semibold">PayFast</h2>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              Connect PayFast to accept payments from customers on your store.
            </p>
          </Card>
        </li>
      </ul>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isConnected ? "Manage PayFast" : "Connect PayFast"}</DialogTitle>
            <DialogDescription>
              Enter the merchant ID from your PayFast account. Your merchant key remains securely managed on the server.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payfast-merchant-id">Merchant ID</Label>
              <Input
                id="payfast-merchant-id"
                value={merchantId}
                onChange={(event) => setMerchantId(event.target.value)}
                autoComplete="off"
                disabled={saveMerchantIdMutation.isPending}
              />
            </div>
            <DialogFooter className="gap-2">
              {isConnected && (
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  disabled={saveMerchantIdMutation.isPending}
                  onClick={() => saveMerchantIdMutation.mutate(null)}
                >
                  Disconnect
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={saveMerchantIdMutation.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMerchantIdMutation.isPending}>
                {saveMerchantIdMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
