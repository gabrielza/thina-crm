"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Users, DollarSign, Target, Activity, BarChart3 } from "lucide-react";
import { getLeads, getContacts, getTasks, getActivities, type Lead, type Contact, type Task, type Activity as ActivityType } from "@/lib/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, subDays, startOfMonth, isAfter } from "date-fns";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#14b8a6"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Computed Metrics ---
  const totalLeads = leads.length;
  const wonDeals = leads.filter((l) => l.status === "won");
  const lostDeals = leads.filter((l) => l.status === "lost");
  const openDeals = leads.filter((l) => !["won", "lost"].includes(l.status));
  const wonRevenue = wonDeals.reduce((s, l) => s + (l.value || 0), 0);
  const pipelineValue = openDeals.reduce((s, l) => s + (l.value || 0), 0);
  const avgDealSize = wonDeals.length > 0 ? wonRevenue / wonDeals.length : 0;
  const winRate = totalLeads > 0 ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) || 0 : 0;

  // Leads by status
  const statusData = ["new", "contacted", "qualified", "proposal", "won", "lost"].map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: leads.filter((l) => l.status === status).length,
  }));

  // Revenue by source
  const sourceMap = new Map<string, number>();
  wonDeals.forEach((l) => {
    const src = l.source || "Unknown";
    sourceMap.set(src, (sourceMap.get(src) || 0) + (l.value || 0));
  });
  const sourceData = Array.from(sourceMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Pipeline by stage (value)
  const pipelineData = ["new", "contacted", "qualified", "proposal"].map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: leads.filter((l) => l.status === status).reduce((s, l) => s + (l.value || 0), 0),
    count: leads.filter((l) => l.status === status).length,
  }));

  // Activity by type
  const activityTypeData = ["call", "email", "meeting", "note"].map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: activities.filter((a) => a.type === type).length,
  }));

  // Tasks summary
  const tasksPending = tasks.filter((t) => t.status === "pending").length;
  const tasksCompleted = tasks.filter((t) => t.status === "completed").length;
  const tasksOverdue = tasks.filter((t) => t.status !== "completed" && t.dueDate && isAfter(new Date(), new Date(t.dueDate))).length;

  // Activity trend (last 30 days)
  const activityTrend = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count = activities.filter((a) => a.createdAt && format(a.createdAt.toDate(), "yyyy-MM-dd") === dateStr).length;
    return { date: format(date, "dd MMM"), count };
  });

  // Top performers (leads with highest value)
  const topDeals = [...leads].filter((l) => l.value > 0).sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 10);

  // --- CSV Export ---
  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => {
        const val = String(row[h] ?? "").replace(/"/g, '""');
        return `"${val}"`;
      }).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportLeads = () => exportCSV(leads.map((l) => ({
    Name: l.name, Email: l.email, Phone: l.phone, Company: l.company, Status: l.status,
    Source: l.source, Value: l.value, Notes: l.notes,
    Created: l.createdAt ? format(l.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "",
  })), "leads-export");

  const exportContacts = () => exportCSV(contacts.map((c) => ({
    Name: c.name, Email: c.email, Phone: c.phone, Company: c.company, Title: c.title, Notes: c.notes,
    Created: c.createdAt ? format(c.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "",
  })), "contacts-export");

  const exportTasks = () => exportCSV(tasks.map((t) => ({
    Title: t.title, Description: t.description, DueDate: t.dueDate, Status: t.status, Priority: t.priority,
  })), "tasks-export");

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">Analytics, insights &amp; data export</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportLeads}><Download className="mr-2 h-4 w-4" /> Leads CSV</Button>
            <Button variant="outline" size="sm" onClick={exportContacts}><Download className="mr-2 h-4 w-4" /> Contacts CSV</Button>
            <Button variant="outline" size="sm" onClick={exportTasks}><Download className="mr-2 h-4 w-4" /> Tasks CSV</Button>
          </div>
        </div>

        {/* KPI Overview */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <Card className="md:col-span-1 lg:col-span-2">
            <CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{totalLeads}</p><p className="text-xs text-muted-foreground">Total Leads</p></div></div></CardContent>
          </Card>
          <Card className="md:col-span-1 lg:col-span-2">
            <CardContent className="pt-6"><div className="flex items-center gap-3"><Target className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{winRate.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Win Rate</p></div></div></CardContent>
          </Card>
          <Card className="md:col-span-1 lg:col-span-2">
            <CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-emerald-500" /><div><p className="text-2xl font-bold">{formatCurrency(avgDealSize)}</p><p className="text-xs text-muted-foreground">Avg Deal Size</p></div></div></CardContent>
          </Card>
          <Card className="md:col-span-1 lg:col-span-2">
            <CardContent className="pt-6"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-purple-500" /><div><p className="text-2xl font-bold">{activities.length}</p><p className="text-xs text-muted-foreground">Activities Logged</p></div></div></CardContent>
          </Card>
        </div>

        {/* Revenue Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
                <div><p className="text-xl font-bold font-mono">{formatCurrency(wonRevenue)}</p><p className="text-xs text-muted-foreground">Won Revenue</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                <div><p className="text-xl font-bold font-mono">{formatCurrency(pipelineValue)}</p><p className="text-xs text-muted-foreground">Open Pipeline</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-6 w-6 text-red-500" />
                <div><p className="text-xl font-bold font-mono">{formatCurrency(lostDeals.reduce((s, l) => s + (l.value || 0), 0))}</p><p className="text-xs text-muted-foreground">Lost Revenue</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Pipeline by Stage</CardTitle><CardDescription>Deal count and value per stage</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lead Distribution</CardTitle><CardDescription>Leads by status</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Revenue by Source</CardTitle><CardDescription>Won deals by lead source</CardDescription></CardHeader>
            <CardContent>
              {sourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No won deals yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity Breakdown</CardTitle><CardDescription>Logged activities by type</CardDescription></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No activities logged yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={activityTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {activityTypeData.map((_, i) => <Cell key={i} fill={COLORS[i + 3]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Trend */}
        <Card>
          <CardHeader><CardTitle>Activity Trend (Last 30 Days)</CardTitle><CardDescription>Daily logged activities</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" interval={4} />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Summary & Top Deals */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Task Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm">Pending</span><Badge variant="warning">{tasksPending}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-sm">Overdue</span><Badge variant="destructive">{tasksOverdue}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-sm">Completed</span><Badge variant="success">{tasksCompleted}</Badge></div>
              <div className="flex justify-between items-center pt-2 border-t"><span className="text-sm font-medium">Total</span><span className="font-bold">{tasks.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm">Completion Rate</span><span className="font-mono font-medium">{tasks.length > 0 ? ((tasksCompleted / tasks.length) * 100).toFixed(1) : 0}%</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Deals</CardTitle><CardDescription>Highest-value opportunities</CardDescription></CardHeader>
            <CardContent>
              {topDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No deals with values yet.</p>
              ) : (
                <div className="space-y-3">
                  {topDeals.map((lead, i) => (
                    <div key={lead.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                        <div>
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold">{formatCurrency(lead.value)}</p>
                        <Badge variant={lead.status === "won" ? "success" : lead.status === "lost" ? "destructive" : "outline"} className="text-xs">
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
