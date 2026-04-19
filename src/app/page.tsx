"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { DashboardCards } from "@/components/dashboard-cards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";
import { getLeads, getTasks, getActivities, getTransactions, getCollectionCount, type Lead, type Task, type Activity, type Transaction } from "@/lib/firestore";
import { calculateForecast, calculateTransactionForecast } from "@/lib/scoring";
import { formatCurrency } from "@/lib/utils";
import { format, isPast, isToday, parseISO } from "date-fns";
import { Users, Contact as ContactIcon, CheckSquare, AlertTriangle, TrendingUp, DollarSign, Activity as ActivityIcon, Phone, Mail, Calendar, StickyNote, Receipt, Home } from "lucide-react";

const DashboardCharts = dynamic(() => import("@/components/dashboard-charts").then((m) => m.DashboardCharts), {
  loading: () => <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>,
  ssr: false,
});

const ForecastChart = dynamic(() => import("@/components/forecast-chart").then((m) => m.ForecastChart), {
  loading: () => <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>,
  ssr: false,
});

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default", contacted: "secondary", qualified: "success", proposal: "warning", won: "success", lost: "destructive",
};

const ACTIVITY_ICONS: Record<string, typeof Phone> = { call: Phone, email: Mail, meeting: Calendar, note: StickyNote };

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [l, cc, t, a, ac, tx] = await Promise.all([
          getLeads(),
          getCollectionCount("contacts"),
          getTasks(),
          getActivities(10),
          getCollectionCount("activities"),
          getTransactions(),
        ]);
        setLeads(l);
        setContactCount(cc);
        setTasks(t);
        setActivities(a);
        setActivityCount(ac);
        setTransactions(tx);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const recentLeads = leads.slice(0, 5);
  const recentActivities = activities.slice(0, 8);
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate)));
  const forecast = calculateForecast(leads);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your sales pipeline.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <DashboardCards leads={leads} />

            {/* Quick Stats Row */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card className="cursor-pointer" onClick={() => router.push("/contacts")}>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contacts</p><p className="text-2xl font-semibold tabular-nums mt-1">{contactCount}</p></div><ContactIcon className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
              </Card>
              <Card className="cursor-pointer" onClick={() => router.push("/tasks")}>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Tasks</p><p className="text-2xl font-semibold tabular-nums mt-1">{pendingTasks.length}</p></div><CheckSquare className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
              </Card>
              <Card className="cursor-pointer" onClick={() => router.push("/tasks")}>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Overdue</p><p className="text-2xl font-semibold tabular-nums mt-1">{overdueTasks.length}</p></div><AlertTriangle className={`h-5 w-5 ${overdueTasks.length > 0 ? 'text-destructive/70' : 'text-muted-foreground/50'}`} /></div></CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Activities</p><p className="text-2xl font-semibold tabular-nums mt-1">{activityCount}</p></div><ActivityIcon className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
              </Card>
            </div>

            {/* Transaction KPIs */}
            {transactions.length > 0 && (() => {
              const txForecast = calculateTransactionForecast(transactions);
              return (
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <Card className="cursor-pointer" onClick={() => router.push("/transactions")}>
                    <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active Transactions</p><p className="text-2xl font-semibold tabular-nums mt-1">{txForecast.activeTransactions}</p></div><Receipt className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
                  </Card>
                  <Card className="cursor-pointer" onClick={() => router.push("/transactions/pipeline")}>
                    <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Commission</p><p className="text-2xl font-semibold tabular-nums mt-1">{formatCurrency(txForecast.totalPendingCommission)}</p></div><DollarSign className="h-5 w-5 text-amber-500/70" /></div></CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Expected Income</p><p className="text-2xl font-semibold tabular-nums mt-1">{formatCurrency(txForecast.weightedPendingCommission)}</p></div><TrendingUp className="h-5 w-5 text-blue-500/70" /></div></CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Earned Commission</p><p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{formatCurrency(txForecast.earnedCommission)}</p></div><DollarSign className="h-5 w-5 text-green-500/70" /></div></CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Forecast Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Forecast</CardTitle>
                <CardDescription>Weighted pipeline value by probability of close</CardDescription>
              </CardHeader>
              <CardContent>
                <ForecastChart stages={forecast.stages} wonRevenue={forecast.wonRevenue} weightedPipeline={forecast.weightedPipeline} expectedClose={forecast.expectedClose} />
              </CardContent>
            </Card>

            {/* Charts */}
            <DashboardCharts leads={leads} />

            {/* Recent Activity & Recent Leads side-by-side */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest interactions across your CRM</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activities yet. Log one from a lead or contact page!</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.map((activity) => {
                        const Icon = ACTIVITY_ICONS[activity.type] || StickyNote;
                        return (
                          <div key={activity.id} className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.subject}</p>
                              <p className="text-xs text-muted-foreground">{activity.type} &middot; {activity.createdAt ? format(activity.createdAt.toDate(), "dd MMM, HH:mm") : "—"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>Latest additions to your pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No leads yet. Go to the Leads page to add your first one!</p>
                  ) : (
                    <div className="space-y-2">
                      {recentLeads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => router.push(`/leads/${lead.id}`)}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">{lead.name.charAt(0)}</div>
                            <div><p className="font-medium text-sm">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.company}</p></div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-semibold">{lead.value ? formatCurrency(lead.value) : "—"}</p>
                            <Badge variant={statusColors[lead.status]} className="text-xs">{lead.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
