"use client";

import dynamic from "next/dynamic";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { PageTransition } from "@/components/page-transition";
import { Search } from "lucide-react";

const CommandPalette = dynamic(() => import("@/components/command-palette").then((m) => m.CommandPalette), { ssr: false });

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-lg px-4 h-12 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-[10px]">T</div>
              <span className="text-sm font-semibold">Thina</span>
            </div>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </button>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20 lg:pb-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>

        <MobileNav />
        <CommandPalette />
      </div>
    </AuthGuard>
  );
}
