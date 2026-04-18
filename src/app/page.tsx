"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardCards } from "@/components/dashboard-cards";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";
import { getLeads, type Lead } from "@/lib/firestore";
import { format } from "date-fns";

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  qualified: "success",
  proposal: "warning",
  won: "success",
  lost: "destructive",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getLeads();
        setLeads(data);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const firstName = user?.displayName?.split(" ")[0] || "there";

  const recentLeads = leads.slice(0, 5);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your sales pipeline.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <DashboardCards leads={leads} />

            {/* Charts */}
            <DashboardCharts leads={leads} />

            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Leads</CardTitle>
                <CardDescription>Latest additions to your pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leads yet. Go to the Leads page to add your first one!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.company} &middot; {lead.source}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="font-mono text-sm font-semibold">
                              {lead.value ? formatCurrency(lead.value) : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.createdAt ? format(lead.createdAt.toDate(), "dd MMM yyyy") : "—"}
                            </p>
                          </div>
                          <Badge variant={statusColors[lead.status]}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
