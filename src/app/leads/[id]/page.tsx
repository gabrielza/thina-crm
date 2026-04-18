"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Calendar, DollarSign, Tag } from "lucide-react";
import { getLeadById, deleteLead, getActivitiesByLead, getTasksByLead, type Lead, type Activity, type Task } from "@/lib/firestore";
import { EditLeadSheet } from "@/components/edit-lead-sheet";
import { ActivityTimeline } from "@/components/activity-timeline";
import { TaskList } from "@/components/task-list";
import { format } from "date-fns";

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default", contacted: "secondary", qualified: "success", proposal: "warning", won: "success", lost: "destructive",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const id = params.id as string;
    try {
      const [l, a, t] = await Promise.all([
        getLeadById(id),
        getActivitiesByLead(id),
        getTasksByLead(id),
      ]);
      setLead(l);
      setActivities(a);
      setTasks(t);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!lead?.id || !confirm("Are you sure you want to delete this lead?")) return;
    await deleteLead(lead.id);
    router.push("/leads");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  if (!lead) {
    return <AppShell><div className="text-center py-24"><p className="text-muted-foreground text-lg">Lead not found.</p><Button variant="outline" className="mt-4" onClick={() => router.push("/leads")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads</Button></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/leads")} className="h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary font-semibold">{lead.name.charAt(0)}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight truncate">{lead.name}</h1>
              <Badge variant={statusColors[lead.status]} className="text-[11px] shrink-0">{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</Badge>
            </div>
            <p className="text-[13px] text-muted-foreground truncate">{lead.company}</p>
          </div>
        </div>
        <div className="flex gap-2 ml-11 sm:ml-0 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground/60" /><a href={`mailto:${lead.email}`} className="text-[13px] text-primary hover:underline">{lead.email}</a></div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">{lead.phone || "—"}</span></div>
              <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">{lead.company || "—"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Deal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3"><DollarSign className="h-4 w-4 text-muted-foreground/60" /><span className="font-mono text-sm font-semibold">{lead.value ? formatCurrency(lead.value) : "No value set"}</span></div>
              <div className="flex items-center gap-3"><Tag className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">Source: {lead.source || "—"}</span></div>
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">Created: {lead.createdAt ? format(lead.createdAt.toDate(), "dd MMM yyyy, HH:mm") : "—"}</span></div>
              {lead.updatedAt && <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">Updated: {format(lead.updatedAt.toDate(), "dd MMM yyyy, HH:mm")}</span></div>}
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{lead.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Center + Right columns - Activity & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline activities={activities} leadId={lead.id} onActivityAdded={fetchData} />
          <TaskList tasks={tasks} leadId={lead.id} onTaskChanged={fetchData} />
        </div>
      </div>

      <EditLeadSheet lead={lead} open={editOpen} onOpenChange={setEditOpen} onLeadUpdated={fetchData} />
    </AppShell>
  );
}
