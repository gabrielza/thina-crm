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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <p className="text-muted-foreground">{contact.title ? `${contact.title} at ` : ""}{contact.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span>{contact.phone || "—"}</span></div>
            <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{contact.company || "—"}</span></div>
            <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{contact.title || "—"}</span></div>
            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Created: {contact.createdAt ? format(contact.createdAt.toDate(), "dd MMM yyyy") : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Associated Leads ({leads.length})</CardTitle></CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No leads linked to this contact.</p>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{lead.value ? formatCurrency(lead.value) : "—"}</span>
                      <Badge variant={statusColors[lead.status]}>{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {contact.notes && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-lg">Notes</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{contact.notes}</p></CardContent>
          </Card>
        )}

        <div className="md:col-span-2">
          <ActivityTimeline activities={activities} contactId={contact.id} onActivityAdded={fetchData} />
        </div>

        <div className="md:col-span-2">
          <TaskList tasks={tasks} contactId={contact.id} onTaskChanged={fetchData} />
        </div>
      </div>

      <EditContactSheet contact={contact} open={editOpen} onOpenChange={setEditOpen} onContactUpdated={fetchData} />
    </AppShell>
  );
}
