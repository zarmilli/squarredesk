import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, 
  User, 
  Table, 
  Bell,
  CreditCard,
  BookOpen,
  ShoppingBag,
  LogIn,
  Globe, 
  UserPlus,
  LogOut,
  X,
  Moon,
  Sun,
  BarChart3,
  ShoppingCart,
  MessagesSquare,
  ListTodo,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  {
    title: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Marketplace",
    href: "/Marketplace",
    icon: ShoppingBag,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessagesSquare,
  },
  {
    title: "Organisation",
    section: true,
  },
  {
    title: "Members",
    href: "/members",
    icon: Users,
    nested: true,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListTodo,
    nested: true,
  },
  {
    title: "My Sites",
    href: "/tables",
    icon: Globe,
  },
  {
    title: "Analytics",
    section: true,
  },
  {
    title: "Site Analytics",
    href: "/analytics",
    icon: BarChart3,
    nested: true,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    nested: true,
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
    navigate("https://squarreonline.vercel.app/");
  };

  return (
    <aside className="w-60 bg-white lg:bg-transparent flex flex-col relative z-10 h-full border-r border-stone-200 lg:border-0">
      {onClose && (
        <div className="flex justify-end p-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 text-stone-600 hover:bg-[#121212] hover:text-stone-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          if ("section" in item) {
            return (
              <div
                key={item.title}
                className="px-3 pt-3 pb-1 text-sm font-semibold text-stone-500"
              >
                {item.title}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink key={item.href} to={item.href}>
              <div
                className={cn(
                  "mb-1 flex cursor-pointer items-center rounded-lg border-0 py-2 text-sm font-normal shadow-none ring-0 transition-colors duration-200",
                  item.nested ? "ml-7 px-3" : "px-3",
                  isActive
                    ? "bg-[#131313] text-stone-50 hover:bg-[#121212]"
                    : "text-stone-700 hover:bg-[#121212] hover:text-stone-50"
                )}
              >
                <Icon className="mr-3 w-4 h-4" />
                {item.title}
              </div>
            </NavLink>
          );
        })}

        {session && (
          <div className="pt-4 border-t border-stone-700">
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start px-3 py-2 text-sm font-normal rounded-lg text-stone-700 hover:bg-[#121212] hover:text-red-500 transition-colors duration-200 border-0 shadow-none ring-0"
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
