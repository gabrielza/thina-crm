"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Contact, CheckSquare, Kanban, BarChart3,
  Plus, Search, Settings, Moon, Sun, Monitor,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, keywords: "home overview" },
  { label: "Leads", href: "/leads", icon: Users, keywords: "deals sales pipeline" },
  { label: "Contacts", href: "/contacts", icon: Contact, keywords: "people customers" },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, keywords: "todos follow-up" },
  { label: "Pipeline", href: "/pipeline", icon: Kanban, keywords: "kanban board stages" },
  { label: "Reports", href: "/reports", icon: BarChart3, keywords: "analytics charts export" },
];

const ACTIONS = [
  { label: "Add Lead", href: "/leads?action=new", icon: Plus, keywords: "create new lead" },
  { label: "Add Contact", href: "/contacts?action=new", icon: Plus, keywords: "create new contact" },
  { label: "Add Task", href: "/tasks?action=new", icon: Plus, keywords: "create new task" },
  { label: "Seed Sample Data", href: "/seed", icon: Settings, keywords: "demo test data" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 top-[20%] z-50 mx-auto max-w-[540px] px-4"
          >
            <Command
              className="rounded-xl border border-border/50 bg-popover text-popover-foreground shadow-elevated overflow-hidden"
              loop
            >
              <div className="flex items-center border-b border-border/50 px-4">
                <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <Command.List className="max-h-[320px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="px-1 pb-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {NAV_ITEMS.map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.keywords}`}
                      onSelect={() => runCommand(() => router.push(item.href))}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border/50" />

                <Command.Group heading="Actions" className="px-1 pb-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {ACTIONS.map((item) => (
                    <Command.Item
                      key={item.label}
                      value={`${item.label} ${item.keywords}`}
                      onSelect={() => runCommand(() => router.push(item.href))}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border/50" />

                <Command.Group heading="Theme" className="px-1 pb-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  <Command.Item
                    value="light mode theme"
                    onSelect={() => runCommand(() => setTheme("light"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <span>Light Mode</span>
                  </Command.Item>
                  <Command.Item
                    value="dark mode theme"
                    onSelect={() => runCommand(() => setTheme("dark"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <span>Dark Mode</span>
                  </Command.Item>
                  <Command.Item
                    value="system mode theme auto"
                    onSelect={() => runCommand(() => setTheme("system"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span>System</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="border-t border-border/50 px-4 py-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Navigate with <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd></span>
                  <span>Select with <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd></span>
                  <span>Close with <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">esc</kbd></span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Small button to trigger command palette — shown in the sidebar/nav */
export function CommandTrigger() {
  return (
    <button
      onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
      className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-hover/50 px-3 py-2 text-xs text-sidebar-fg transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg-active"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded bg-sidebar-border px-1.5 py-0.5 font-mono text-[10px] text-sidebar-fg">⌘K</kbd>
    </button>
  );
}
