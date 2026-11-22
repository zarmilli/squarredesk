import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Globe,
  X,
  BarChart3,
  Activity,
  ShoppingCart,
  MessagesSquare,
  ListTodo,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    title: "Messages",
    href: "/messages",
    icon: MessagesSquare,
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
    title: "Traffic",
    href: "/traffic",
    icon: Activity,
    nested: true,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    nested: true,
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();

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

      </nav>

    </aside>
  );
}
