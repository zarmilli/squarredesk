import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckSquare,
  CreditCard,
  Crown,
  ClipboardList,
  FolderKanban,
  Info,
  LogOut,
  Menu,
  ShoppingBag,
  Settings,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";

const notificationCategoryStyles: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  tasks: { icon: ClipboardList, className: "bg-blue-100 text-blue-600" },
  task: { icon: ClipboardList, className: "bg-blue-100 text-blue-600" },
  orders: { icon: ShoppingBag, className: "bg-green-100 text-green-600" },
  order: { icon: ShoppingBag, className: "bg-green-100 text-green-600" },
  requests: { icon: UserPlus, className: "bg-amber-100 text-amber-600" },
  request: { icon: UserPlus, className: "bg-amber-100 text-amber-600" },
  projects: { icon: FolderKanban, className: "bg-purple-100 text-purple-600" },
  project: { icon: FolderKanban, className: "bg-purple-100 text-purple-600" },
  account: { icon: Info, className: "bg-stone-100 text-stone-600" },
};

const defaultNotificationCategoryStyle = {
  icon: Bell,
  className: "bg-stone-100 text-stone-600",
};

function formatMinutesAgo(createdAt: string) {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return "Unknown time";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  return `${minutes} min ago`;
}

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
  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    isFetching: isFetchingNotifications,
    error: notificationsError,
  } = useNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${unreadCount} unread notifications`}
              className="relative h-9 w-9 rounded-full"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#BEF164] px-1 text-[10px] font-semibold text-stone-900">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 overflow-hidden p-0"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Notifications</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/notifications");
                }}
                className="h-auto p-0"
              >
                View all
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notificationsError ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-destructive">
                    Unable to load notifications.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notificationsError instanceof Error
                      ? notificationsError.message
                      : "Please try again."}
                  </p>
                </div>
              ) : isLoadingNotifications && isFetchingNotifications ? (
                <p
                  role="status"
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  Loading notifications...
                </p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.slice(0, 5).map((notification) => {
                  const categoryStyle =
                    notificationCategoryStyles[
                      notification.category.toLowerCase()
                    ] ?? defaultNotificationCategoryStyle;
                  const Icon = categoryStyle.icon;

                  return (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${categoryStyle.className}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {notification.event_name}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {notification.category}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatMinutesAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

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
