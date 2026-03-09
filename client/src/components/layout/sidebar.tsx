import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  User, 
  Table, 
  Bell,
  CreditCard,
  BookOpen,
  LogIn, 
  UserPlus,
  LogOut,
  X,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Metrics",
    href: "/tables",
    icon: Table,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
  },
];

const authItems = [
  {
    title: "Sign In",
    href: "/auth/sign-in",
    icon: LogIn,
  },
  {
    title: "Sign Up",
    href: "/auth/sign-up",
    icon: UserPlus,
  },
];

export function Sidebar({
  onClose,
  darkMode = false,
  onToggleDarkMode,
}: {
  onClose?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: (enabled: boolean) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    onClose?.();
    navigate("https://squarre.vercel.app/");
  };

  return (
    <aside className="w-60 bg-white lg:bg-transparent flex flex-col relative z-10 h-full border-r border-stone-200 lg:border-0">
      {/* Brand Header */}
      <div className="p-6 pb-0 relative z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">
          Squarre Desk
        </h1>
        {/* Close button for mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink key={item.href} to={item.href}>
              <div
                className={cn(
                  "flex items-center text-sm font-normal rounded-lg cursor-pointer",
                  isActive
                    ? "px-3 py-2 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
                    : "px-3 py-2 text-stone-700 hover:bg-stone-100 transition-colors duration-200 border border-transparent"
                )}
              >
                <Icon className="mr-3 w-4 h-4" />
                {item.title}
              </div>
            </NavLink>
          );
        })}

        {/* Auth Section */}
        <div className="pt-4 border-t border-stone-200 mt-4">
          <p className="px-4 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            AUTH PAGES
          </p>
          {authItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center text-sm font-normal rounded-lg cursor-pointer",
                    isActive
                      ? "px-3 py-2 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
                      : "px-3 py-2 text-stone-700 hover:bg-stone-100 transition-colors duration-200 border border-transparent"
                  )}
                >
                  <Icon className="mr-3 w-4 h-4" />
                  {item.title}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <div className="pt-4 border-t border-stone-200">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-stone-700 dark:text-stone-200">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm font-normal">Dark mode</span>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={(checked) => onToggleDarkMode?.(checked)}
            />
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-auto pt-4 border-t border-stone-200">
          <NavLink to="/documentation">
            <div
              className={cn(
                "flex items-center text-sm font-normal rounded-lg cursor-pointer",
                location.pathname === "/documentation"
                  ? "px-3 py-2 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
                  : "px-3 py-2 text-stone-700 hover:bg-stone-100 transition-colors duration-200"
              )}
            >
              <BookOpen className="mr-3 w-4 h-4" />
              Documentation
            </div>
          </NavLink>
        </div>

        {session && (
          <div className="pt-4 border-t border-stone-200">
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start px-3 py-2 text-sm font-normal rounded-lg text-stone-700 hover:bg-stone-100 transition-colors duration-200"
            >
              <LogOut className="mr-3 w-4 h-4" />
              Log Out
            </Button>
          </div>
        )}
      </nav>

    </aside>
  );
}
