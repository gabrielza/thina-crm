"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardCards } from "@/components/dashboard-cards";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";
import { getLeads, getContacts, getTasks, getActivities, type Lead, type Contact, type Task, type Activity } from "@/lib/firestore";
import { calculateForecast } from "@/lib/scoring";
import { format, isPast, isToday, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Contact as ContactIcon, CheckSquare, AlertTriangle, TrendingUp, DollarSign, Activity as ActivityIcon, Phone, Mail, Calendar, StickyNote } from "lucide-react";

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default", contacted: "secondary", qualified: "success", proposal: "warning", won: "success", lost: "destructive",
};

const ACTIVITY_ICONS: Record<string, typeof Phone> = { call: Phone, email: Mail, meeting: Calendar, note: StickyNote };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [l, c, t, a] = await Promise.all([getLeads(), getContacts(), getTasks(), getActivities()]);
        setLeads(l);
        setContacts(c);
        setTasks(t);
        setActivities(a);
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
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="cursor-pointer" onClick={() => router.push("/contacts")}>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contacts</p><p className="text-2xl font-semibold tabular-nums mt-1">{contacts.length}</p></div><ContactIcon className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
              </Card>
              <Card className="cursor-pointer" onClick={() => router.push("/tasks")}>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Tasks</p><p className="text-2xl font-semibold tabular-nums mt-1">{pendingTasks.length}</p></div><CheckSquare className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
              </Card>
              <Card className="cursor-pointer" onClick={() => router.push("/tasks")}>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Overdue</p><p className="text-2xl font-semibold tabular-nums mt-1">{overdueTasks.length}</p></div><AlertTriangle className={`h-5 w-5 ${overdueTasks.length > 0 ? 'text-destructive/70' : 'text-muted-foreground/50'}`} /></div></CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Activities</p><p className="text-2xl font-semibold tabular-nums mt-1">{activities.length}</p></div><ActivityIcon className="h-5 w-5 text-muted-foreground/50" /></div></CardContent>
              </Card>
            </div>

            {/* Forecast Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Forecast</CardTitle>
                <CardDescription>Weighted pipeline value by probability of close</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={forecast.stages}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="stage" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="totalValue" fill="#93c5fd" name="Total Value" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="weightedValue" fill="#3b82f6" name="Weighted Value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {forecast.stages.map((s) => (
                      <div key={s.stage} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{s.stage}</span>
                          <span className="text-muted-foreground ml-2">({s.count} deals, {(s.probability * 100).toFixed(0)}%)</span>
                        </div>
                        <span className="font-mono">{formatCurrency(s.weightedValue)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm"><span>Won Revenue</span><span className="font-mono font-semibold text-green-600">{formatCurrency(forecast.wonRevenue)}</span></div>
                      <div className="flex justify-between text-sm"><span>Weighted Pipeline</span><span className="font-mono font-semibold text-blue-600">{formatCurrency(forecast.weightedPipeline)}</span></div>
                      <div className="flex justify-between text-sm font-bold"><span>Expected Total</span><span className="font-mono">{formatCurrency(forecast.expectedClose)}</span></div>
                    </div>
                  </div>
                </div>
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
