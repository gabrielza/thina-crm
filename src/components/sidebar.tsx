"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Contact, CheckSquare, Kanban, BarChart3, LogOut, Moon, Sun, Menu, Receipt, ShieldCheck, Home, MessageSquare, Building2, Inbox, Zap, UserSearch, FileText, TrendingUp, Timer, FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/use-auth";
import { CommandTrigger } from "@/components/command-palette";
import { useTheme } from "@/components/theme-provider";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Prospecting",
    items: [
      { name: "Inbound Leads", href: "/inbound", icon: Inbox },
      { name: "Show Days", href: "/showdays", icon: Home },
      { name: "Speed-to-Lead", href: "/speed-to-lead", icon: Timer },
      { name: "Lead ROI", href: "/lead-roi", icon: TrendingUp },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { name: "Leads", href: "/leads", icon: Users },
      { name: "Pipeline Board", href: "/pipeline", icon: Kanban },
      { name: "Contacts", href: "/contacts", icon: Contact },
      { name: "Buyer Match", href: "/buyer-match", icon: UserSearch },
      { name: "Sequences", href: "/sequences", icon: Zap },
      { name: "Messaging", href: "/messaging", icon: MessageSquare },
    ],
  },
  {
    label: "Listings",
    items: [
      { name: "Properties", href: "/properties", icon: Building2 },
      { name: "CMA Reports", href: "/cma", icon: FileBarChart },
    ],
  },
  {
    label: "Transactions",
    items: [
      { name: "Deals", href: "/transactions", icon: Receipt },
      { name: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Compliance", href: "/compliance", icon: ShieldCheck },
    ],
  },
];

// Flat list for mobile nav and other consumers
const navigation = navGroups.flatMap((g) => g.items);

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <aside className="hidden lg:flex h-screen w-[240px] flex-col bg-sidebar-bg border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Image src="/logo.png" alt="Thina CRM" width={28} height={28} className="h-7 w-7 rounded-md" />
        <span className="text-sm font-semibold tracking-tight text-sidebar-fg-active">Thina</span>
        <span className="text-[10px] font-medium text-sidebar-fg uppercase tracking-widest ml-auto">CRM</span>
      </div>

      {/* Search trigger */}
      <div className="px-3 pb-2">
        <CommandTrigger />
      </div>

      {/* Navigation */}
      <nav className="flex-1 sidebar-scroll overflow-y-auto px-3 py-1 space-y-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group heading — hidden for "Overview" since it's just Dashboard */}
            {group.label !== "Overview" && (
              <div className="px-3 pb-1 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-fg/60">
                  {group.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
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

/** Mobile bottom navigation with slide-up menu for all items */
export function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileItems = navigation.slice(0, 4); // Show first 4 in tab bar

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <>
      {/* Slide-up overlay menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-card rounded-t-2xl border-t border-border shadow-lg animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mt-3" />
            <div className="p-4 space-y-1">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="bg-muted text-foreground text-sm">
                    {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {/* All nav items — grouped */}
              {navGroups.map((group) => (
                <div key={group.label}>
                  {group.label !== "Overview" && (
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </span>
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              ))}

              <div className="border-t border-border my-2" />

              {/* Theme toggle */}
              <button
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              {/* Sign out */}
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
            <div className="mobile-nav-safe" />
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg mobile-nav-safe">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 min-w-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
