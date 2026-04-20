"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Briefcase, Calendar, Home, FileText, DollarSign, Users, FileBarChart, MessageSquare, UserCheck } from "lucide-react";
import {
  getContactById, deleteContact, getLeadsByContact, getActivitiesByContact, getTasksByContact,
  getTransactionsByContact, getPropertiesByContact, getDocumentsByContact,
  getBuyerProfilesByContact, getCmaReportsByContact, getSmsByContact,
  type Contact, type Lead, type Activity, type Task, type Transaction, type Property,
  type StoredDocument, type BuyerProfile, type CmaReport, type SmsMessage,
} from "@/lib/firestore";
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [buyerProfiles, setBuyerProfiles] = useState<BuyerProfile[]>([]);
  const [cmaReports, setCmaReports] = useState<CmaReport[]>([]);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const id = params.id as string;
    try {
      const c = await getContactById(id);
      setContact(c);

      // Fetch all related data in parallel
      const [l, a, t, tx, props, docs, bp, cma, sms] = await Promise.all([
        getLeadsByContact(id).catch(() => [] as Lead[]),
        getActivitiesByContact(id).catch(() => [] as Activity[]),
        getTasksByContact(id).catch(() => [] as Task[]),
        getTransactionsByContact(id).catch(() => [] as Transaction[]),
        getPropertiesByContact(id).catch(() => [] as Property[]),
        getDocumentsByContact(id).catch(() => [] as StoredDocument[]),
        getBuyerProfilesByContact(id).catch(() => [] as BuyerProfile[]),
        getCmaReportsByContact(id).catch(() => [] as CmaReport[]),
        getSmsByContact(id).catch(() => [] as SmsMessage[]),
      ]);
      setLeads(l);
      setActivities(a);
      setTasks(t);
      setTransactions(tx);
      setProperties(props);
      setDocuments(docs);
      setBuyerProfiles(bp);
      setCmaReports(cma);
      setSmsMessages(sms);
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
              <div className="flex items-center gap-3"><UserCheck className="h-4 w-4 text-muted-foreground/60" /><span className="text-[13px]">Agent: {contact.assignedAgentName || "—"}</span></div>
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

          {/* Transactions */}
          <Card>
            <CardHeader><CardTitle><DollarSign className="inline h-4 w-4 mr-1.5" />Transactions ({transactions.length})</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-4">No transactions linked.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => router.push(`/transactions/${tx.id}`)}>
                      <div>
                        <p className="text-[13px] font-medium truncate">{tx.propertyAddress}</p>
                        <p className="text-[11px] text-muted-foreground">{tx.buyerName} → {tx.sellerName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px]">{formatCurrency(tx.salePrice)}</span>
                        <Badge variant="outline" className="ml-2 text-[10px] capitalize">{tx.stage.replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties (as seller) */}
          <Card>
            <CardHeader><CardTitle><Home className="inline h-4 w-4 mr-1.5" />Properties ({properties.length})</CardTitle></CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-4">No properties linked.</p>
              ) : (
                <div className="space-y-2">
                  {properties.map((prop) => (
                    <div key={prop.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div>
                        <p className="text-[13px] font-medium">{prop.address}</p>
                        <p className="text-[11px] text-muted-foreground">{prop.suburb}, {prop.city}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px]">{formatCurrency(prop.askingPrice)}</span>
                        <Badge variant="outline" className="ml-2 text-[10px] capitalize">{prop.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Profiles */}
          {buyerProfiles.length > 0 && (
            <Card>
              <CardHeader><CardTitle><Users className="inline h-4 w-4 mr-1.5" />Buyer Profile</CardTitle></CardHeader>
              <CardContent>
                {buyerProfiles.map((bp) => (
                  <div key={bp.id} className="space-y-2">
                    <p className="text-[13px]"><span className="text-muted-foreground">Budget:</span> {formatCurrency(bp.minBudget)} – {formatCurrency(bp.maxBudget)}</p>
                    <p className="text-[13px]"><span className="text-muted-foreground">Areas:</span> {bp.areas.join(", ")}</p>
                    <p className="text-[13px]"><span className="text-muted-foreground">Types:</span> {bp.propertyTypes.join(", ")}</p>
                    <p className="text-[13px]"><span className="text-muted-foreground">Min beds:</span> {bp.minBedrooms} | <span className="text-muted-foreground">Min baths:</span> {bp.minBathrooms}</p>
                    {bp.features.length > 0 && <div className="flex flex-wrap gap-1">{bp.features.map((f, i) => <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>)}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {contact.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{contact.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Center + Right columns - Activity, Tasks, Documents, CMA, SMS */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline activities={activities} contactId={contact.id} onActivityAdded={fetchData} />
          <TaskList tasks={tasks} contactId={contact.id} onTaskChanged={fetchData} />

          {/* Documents */}
          <Card>
            <CardHeader><CardTitle><FileText className="inline h-4 w-4 mr-1.5" />Documents ({documents.length})</CardTitle></CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-4">No documents linked.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground/60" />
                        <div>
                          <p className="text-[13px] font-medium">{doc.name}</p>
                          <p className="text-[11px] text-muted-foreground">{(doc.fileSize / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">{doc.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CMA Reports */}
          {cmaReports.length > 0 && (
            <Card>
              <CardHeader><CardTitle><FileBarChart className="inline h-4 w-4 mr-1.5" />CMA Reports ({cmaReports.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cmaReports.map((cma) => (
                    <div key={cma.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div>
                        <p className="text-[13px] font-medium">{cma.title}</p>
                        <p className="text-[11px] text-muted-foreground">{cma.subjectAddress}, {cma.subjectSuburb}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px]">{formatCurrency(cma.estimatedValue)}</span>
                        <Badge variant="outline" className="ml-2 text-[10px] capitalize">{cma.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMS History */}
          {smsMessages.length > 0 && (
            <Card>
              <CardHeader><CardTitle><MessageSquare className="inline h-4 w-4 mr-1.5" />SMS History ({smsMessages.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {smsMessages.slice(0, 10).map((sms) => (
                    <div key={sms.id} className="p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={sms.direction === "outbound" ? "default" : "secondary"} className="text-[10px]">{sms.direction}</Badge>
                        <Badge variant={sms.status === "delivered" ? "success" : sms.status === "failed" ? "destructive" : "outline"} className="text-[10px]">{sms.status}</Badge>
                        <span className="text-[11px] text-muted-foreground">{sms.to}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground line-clamp-2">{sms.body}</p>
                    </div>
                  ))}
                  {smsMessages.length > 10 && <p className="text-[11px] text-muted-foreground text-center">… and {smsMessages.length - 10} more</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditContactSheet contact={contact} open={editOpen} onOpenChange={setEditOpen} onContactUpdated={fetchData} />
    </AppShell>
  );
}
