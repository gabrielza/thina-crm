"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Contact, CheckSquare, Kanban, BarChart3, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/use-auth";
import { CommandTrigger } from "@/components/command-palette";
import { useTheme } from "@/components/theme-provider";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Contacts", href: "/contacts", icon: Contact },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Pipeline", href: "/pipeline", icon: Kanban },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <aside className="hidden lg:flex h-screen w-[240px] flex-col bg-sidebar-bg border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent text-white font-semibold text-xs">
          T
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-fg-active">Thina</span>
        <span className="text-[10px] font-medium text-sidebar-fg uppercase tracking-widest ml-auto">CRM</span>
      </div>

      {/* Search trigger */}
      <div className="px-3 pb-2">
        <CommandTrigger />
      </div>

      {/* Navigation */}
      <nav className="flex-1 sidebar-scroll overflow-y-auto px-3 py-1 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent/15 text-sidebar-fg-active"
                  : "text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-accent" : "text-sidebar-fg group-hover:text-sidebar-fg-active")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-fg transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg-active"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-1">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-sidebar-hover text-sidebar-fg-active text-xs">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-fg-active truncate">{user?.displayName || "User"}</p>
            <p className="text-[10px] text-sidebar-fg truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Mobile bottom navigation */
export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = navigation.slice(0, 5); // Show first 5 items

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg mobile-nav-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
