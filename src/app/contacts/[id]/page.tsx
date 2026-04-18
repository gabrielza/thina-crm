"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Briefcase, Calendar } from "lucide-react";
import { getContactById, deleteContact, getLeadsByContact, getActivitiesByContact, getTasksByLead, type Contact, type Lead, type Activity, type Task } from "@/lib/firestore";
import { EditContactSheet } from "@/components/edit-contact-sheet";
import { ActivityTimeline } from "@/components/activity-timeline";
import { TaskList } from "@/components/task-list";
import { format } from "date-fns";

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default", contacted: "secondary", qualified: "success", proposal: "warning", won: "success", lost: "destructive",
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const id = params.id as string;
    try {
      const [c, l, a] = await Promise.all([
        getContactById(id),
        getLeadsByContact(id),
        getActivitiesByContact(id),
      ]);
      setContact(c);
      setLeads(l);
      setActivities(a);
      // Fetch tasks for all associated leads
      const allTasks: Task[] = [];
      for (const lead of l) {
        if (lead.id) {
          const lt = await getTasksByLead(lead.id);
          allTasks.push(...lt);
        }
      }
      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to fetch contact:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!contact?.id || !confirm("Delete this contact?")) return;
    await deleteContact(contact.id);
    router.push("/contacts");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  if (!contact) {
    return <AppShell><div className="text-center py-24"><p className="text-muted-foreground text-lg">Contact not found.</p><Button variant="outline" className="mt-4" onClick={() => router.push("/contacts")}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")} className="h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary font-semibold">{contact.name.charAt(0)}</div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{contact.name}</h1>
            <p className="text-[13px] text-muted-foreground truncate">{contact.title ? `${contact.title} at ` : ""}{contact.company}</p>
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
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground/60" /><a href={`mailto:${contact.email}`} className="text-[13px] text-primary hover:underline">{contact.email}</a></div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">{contact.phone || "—"}</span></div>
              <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">{contact.company || "—"}</span></div>
              <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">{contact.title || "—"}</span></div>
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">Created: {contact.createdAt ? format(contact.createdAt.toDate(), "dd MMM yyyy") : "—"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Associated Leads ({leads.length})</CardTitle></CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-4">No leads linked to this contact.</p>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => router.push(`/leads/${lead.id}`)}>
                      <div>
                        <p className="text-[13px] font-medium">{lead.name}</p>
                        <p className="text-[11px] text-muted-foreground">{lead.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px]">{lead.value ? formatCurrency(lead.value) : "—"}</span>
                        <Badge variant={statusColors[lead.status]} className="text-[10px]">{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {contact.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{contact.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Center + Right columns - Activity & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline activities={activities} contactId={contact.id} onActivityAdded={fetchData} />
          <TaskList tasks={tasks} contactId={contact.id} onTaskChanged={fetchData} />
        </div>
      </div>

      <EditContactSheet contact={contact} open={editOpen} onOpenChange={setEditOpen} onContactUpdated={fetchData} />
    </AppShell>
  );
}
