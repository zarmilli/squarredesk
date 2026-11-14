import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckSquare,
  CreditCard,
  Crown,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  membership_tier: string | null;
  email: string;
};

export default function HeaderRight({
  onOpenSettings,
  onOpenSidebar,
}: {
  onOpenSettings: () => void;
  onOpenSidebar?: () => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, membership_tier")
      .eq("user_id", session.user.id)
      .single();

    if (!error && data) {
      setProfile({ ...data, email: session.user.email ?? "" });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error("Failed to load workspace membership:", membershipError);
    }

    let businessQuery = supabase
      .from("businesses")
      .select("company_name");

    if (membership?.business_id) {
      businessQuery = businessQuery.eq("id", membership.business_id);
    } else {
      businessQuery = businessQuery.eq("owner_user_id", session.user.id);
    }

    const { data: business, error: businessError } =
      await businessQuery.maybeSingle();

    if (businessError) {
      console.error("Failed to load workspace name:", businessError);
    }

    setBusinessName(business?.company_name ?? null);
  }

  function navigateFromMenu(path: string) {
    setMenuOpen(false);
    navigate(path);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setMenuOpen(false);
    navigate("https://squarreonline.vercel.app/");
  }

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`
        .toUpperCase() ||
      profile.email[0]?.toUpperCase() ||
      "?"
    : "?";
  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "";

  return (
    <header className="flex h-16 w-full flex-none items-center justify-between bg-background px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
            className="h-9 w-9 shrink-0 rounded-md lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/"
              aria-label="Back to organisation dashboard"
              className="shrink-0"
            >
              <img
                src="/images/logo.png"
                alt="Squarredesk"
                className="h-8 w-8 rounded-md object-contain"
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Back to organisation dashboard
          </TooltipContent>
        </Tooltip>
        <div className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />
        <p className="truncate text-sm font-medium">
          {businessName ? `${businessName}'s Workspace` : "Workspace"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {profile && (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/subscriptions")}
            className="h-9 rounded-full px-3"
          >
            <Crown className="h-4 w-4" />
            {profile.membership_tier || "Member"}
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="h-9 w-9 rounded-full"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Tasks"
              className="h-9 w-9 rounded-full"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tasks</TooltipContent>
        </Tooltip>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Settings"
          className="h-9 w-9 rounded-full"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {profile && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                className="h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-stone-900 text-xs font-medium text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-72 overflow-hidden p-0"
            >
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-medium">
                  {fullName || "Account"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email}
                </p>
              </div>

              <div className="space-y-1 p-2">
                <button
                  type="button"
                  onClick={() => navigateFromMenu("/profile")}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <User className="h-4 w-4" />
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => navigateFromMenu("/subscriptions")}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <CreditCard className="h-4 w-4" />
                  Billing
                </button>

                <div className="my-2 border-t border-border" />

                <Button
                  type="button"
                  onClick={() => navigateFromMenu("/subscriptions")}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </div>

              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start text-sm font-normal text-stone-700 hover:bg-accent hover:text-red-500"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </header>
  );
}
