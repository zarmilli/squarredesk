import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { BadgeWithFlag, BadgeWithDot } from "@/components/base/badges/badges"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import squeakImage from "/images/speaking.png"

type Profile = {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  personal_bio: string | null
  business_field: string | null
  business_location: string | null
  company_name: string | null
  company_size: string | null
  company_bio: string | null
  services_offered: string[] | null
  membership_tier: string
}

export default function Profile() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [others, setOthers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [editType, setEditType] = useState<"business" | "personal" | null>(null)
  const [formData, setFormData] = useState<Partial<Profile>>({})
  const [hoverProfile, setHoverProfile] = useState<any | null>(null)
  const [hoverLoading, setHoverLoading] = useState(false)

  // -----------------------------
  // FETCH PROFILE
  // -----------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!error && data) {
        setProfile(data)
        setFormData(data)

        // fetch others in same field
        const { data: othersData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, personal_bio")
          .eq("business_field", data.business_field)
          .neq("user_id", data.user_id)

        setOthers(othersData || [])
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const fetchHoverProfile = async (userId: string) => {
    setHoverLoading(true)

    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, company_name, personal_bio")
      .eq("user_id", userId)
      .single()

    if (data) {
      setHoverProfile(data)
    }

    setHoverLoading(false)
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* HEADER SKELETON */}
          <div className="bg-stone-900 rounded-xl p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="w-16 h-16 rounded-full bg-stone-700" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-6 w-40 bg-stone-700" />
                  <Skeleton className="h-4 w-28 bg-stone-700" />
                </div>
              </div>
              <div className="flex space-x-3">
                <Skeleton className="h-10 w-28 bg-stone-700" />
                <Skeleton className="h-10 w-28 bg-stone-700" />
                <Skeleton className="h-10 w-28 bg-stone-700" />
              </div>
            </div>
          </div>

          {/* 3 CARD SKELETONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    )
  }

  if (!profile) return <div className="p-6">Profile not found</div>

  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`

  // Users on basic or pro can access the networking card
  const canNetwork =
    profile.membership_tier === "basic" || profile.membership_tier === "pro"

  // -----------------------------
  // SAVE HANDLER
  // -----------------------------
  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("user_id", profile.user_id)

    if (!error) {
      setProfile(prev => ({ ...prev!, ...formData }))
      toast({ title: "Profile updated successfully" })
      setEditType(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-stone-900 rounded-xl p-8 mb-6">
          <div className="flex items-center justify-between">

            <div className="flex items-center">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarFallback className="bg-stone-700 text-white text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-white/80">{profile.company_name}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="default" onClick={() => navigate("/subscription")}>
                Subscription
              </Button>
              <Button variant="default" onClick={() => navigate("/messages")}>
                Message
              </Button>
              <Button variant="default" onClick={() => navigate("/marketplace")}>
                Marketplace
              </Button>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* BUSINESS INFORMATION */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Business Information</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditType("business")}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Company Name</p>
                <p className="text-sm text-muted-foreground">{profile.company_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Business Field</p>
                <p className="text-sm text-muted-foreground">{profile.business_field}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{profile.business_location}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Company Size</p>
                <p className="text-sm text-muted-foreground">{profile.company_size}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Company Bio</p>
                <p className="text-sm text-muted-foreground">{profile.company_bio}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Services Offered</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.services_offered?.map((service) => (
                    <BadgeWithDot
                      key={service}
                      type="pill-color"
                      color="success"
                      size="md"
                    >
                      {service}
                    </BadgeWithDot>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PERSONAL INFORMATION */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditType("personal")}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">First Name</p>
                <p className="text-sm text-muted-foreground">{profile.first_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Name</p>
                <p className="text-sm text-muted-foreground">{profile.last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Personal Bio</p>
                <p className="text-sm text-muted-foreground">{profile.personal_bio}</p>
              </div>
            </CardContent>
          </Card>

          {/* OTHERS IN FIELD */}
          <div className="relative">

            {/* Card content — blurred when on free plan */}
            <div className={!canNetwork ? "pointer-events-none select-none" : ""}>
              <Card className={!canNetwork ? "blur-sm" : ""}>
                <CardHeader>
                  <CardTitle>Others In Your Field</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {others.map((user) => {
                    const otherInitials =
                      `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`

                    return (
                      <div
                        key={user.user_id}
                        className="flex justify-between items-center"
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <div
                              className="flex items-start cursor-pointer"
                              onMouseEnter={() => fetchHoverProfile(user.user_id)}
                            >
                              <Avatar>
                                <AvatarFallback>{otherInitials}</AvatarFallback>
                              </Avatar>

                              <div className="ml-3">
                                <p className="text-sm font-medium">
                                  {user.first_name} {user.last_name}
                                </p>
                                {user.personal_bio && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {user.personal_bio.length > 17
                                      ? user.personal_bio.slice(0, 17) + "..."
                                      : user.personal_bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </PopoverTrigger>

                          <PopoverContent className="w-64">
                            {hoverLoading ? (
                              <div className="space-y-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-muted mx-auto" />
                                <div className="h-4 bg-muted rounded w-32 mx-auto" />
                                <div className="h-3 bg-muted rounded w-24 mx-auto" />
                                <div className="h-3 bg-muted rounded w-full" />
                                <div className="h-3 bg-muted rounded w-5/6" />
                              </div>
                            ) : hoverProfile ? (
                              <div className="space-y-3 text-center">
                                <Avatar className="mx-auto">
                                  <AvatarFallback>
                                    {hoverProfile.first_name?.[0] ?? ""}
                                    {hoverProfile.last_name?.[0] ?? ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {hoverProfile.first_name} {hoverProfile.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {hoverProfile.company_name}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {hoverProfile.personal_bio}
                                </p>
                              </div>
                            ) : null}
                          </PopoverContent>
                        </Popover>

                        <Button variant="ghost" size="sm">
                          Chat
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Upgrade overlay — only shown on free plan */}
            {!canNetwork && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center gap-3 px-6 max-w-xs">
                  <img src={squeakImage} className="w-20" alt="Squeak the parrot" />
                  <h3 className="text-base font-semibold text-stone-900">
                    Connect with others
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Squeak says messaging other businesses is available on the
                    Basic and Pro plans. Upgrade to start networking.
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-stone-700 text-white hover:bg-stone-700">
                      Basic
                    </Badge>
                    <Badge className="bg-stone-900 text-white hover:bg-stone-900">
                      Pro
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => navigate("/subscriptions")}
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* EDIT DIALOG */}
        <Dialog open={!!editType} onOpenChange={() => setEditType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit {editType === "business" ? "Business" : "Personal"} Information
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">

              {editType === "business" && (
                <>
                  <Input
                    placeholder="Company Name"
                    value={formData.company_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Business Field"
                    value={formData.business_field || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, business_field: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Location"
                    value={formData.business_location || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, business_location: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Company Size"
                    value={formData.company_size || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, company_size: e.target.value })
                    }
                  />
                </>
              )}

              {editType === "personal" && (
                <>
                  <Input
                    placeholder="First Name"
                    value={formData.first_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Last Name"
                    value={formData.last_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Personal Bio"
                    value={formData.personal_bio || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, personal_bio: e.target.value })
                    }
                  />
                </>
              )}

              <Button className="w-full mt-4" onClick={handleSave}>
                Save Changes
              </Button>

            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}