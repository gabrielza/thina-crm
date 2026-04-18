"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardCards } from "@/components/dashboard-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.displayName?.split(" ")[0] || "there";

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your leads today.
          </p>
        </div>

        {/* Stats */}
        <DashboardCards />

        {/* Recent activity placeholder */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Leads</CardTitle>
              <CardDescription>Your latest additions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">
                No leads yet. Go to the Leads page to add your first one!
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Overview</CardTitle>
              <CardDescription>Lead status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">
                Your pipeline will appear here once you have leads.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
