"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Inbox, CheckCircle2, XCircle, Clock, FileText, Plus,
} from "lucide-react";
import {
  getInboundLeads, addInboundLead, updateInboundLead, addLead, addContact, getContacts,
  type InboundLead,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { serverTimestamp } from "firebase/firestore";

// ─── Email Parsers ───────────────────────────────────────
function parseProperty24(content: string) {
  const name = content.match(/Name:\s*(.+)/i)?.[1]?.trim() || "";
  const email = content.match(/Email:\s*(\S+@\S+)/i)?.[1]?.trim() || "";
  const phone = content.match(/(?:Phone|Tel|Cell|Mobile):\s*([\d\s+()-]+)/i)?.[1]?.trim() || "";
  const propertyRef = content.match(/(?:Ref|Reference|Property ID):\s*(\S+)/i)?.[1]?.trim() || "";
  const propertyAddress = content.match(/(?:Property|Address|Listing):\s*(.+)/i)?.[1]?.trim() || "";
  const message = content.match(/(?:Message|Comment|Enquiry):\s*([\s\S]*?)(?:\n\n|$)/i)?.[1]?.trim() || "";
  return { name, email, phone, propertyRef, propertyAddress, message };
}

function parsePrivateProperty(content: string) {
  // Similar structure — Private Property uses slightly different formatting
  return parseProperty24(content); // Same regex works for most formats
}

export default function InboundPage() {
  const { user } = useAuth();
  const [inboundLeads, setInboundLeads] = useState<InboundLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [pasteSource, setPasteSource] = useState<"property24" | "private-property" | "manual">("property24");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  const fetchData = useCallback(async () => {
    try {
      const data = await getInboundLeads();
      setInboundLeads(data);
    } catch (error) {
      console.error("Failed to fetch inbound leads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePaste = async () => {
    if (!user || !pasteContent.trim()) return;
    const parser = pasteSource === "private-property" ? parsePrivateProperty : parseProperty24;
    const parsed = parser(pasteContent);
    await addInboundLead({
      source: pasteSource,
      rawContent: pasteContent,
      parsed,
      status: "pending",
      ownerId: user.uid,
    });
    setPasteContent("");
    setPasteOpen(false);
    fetchData();
  };

  const handleAccept = async (lead: InboundLead) => {
    if (!user || !lead.id) return;
    try {
      // Find or create a Contact for this inbound lead
      const existingContacts = await getContacts();
      let contactId: string | undefined;
      const matchedContact = existingContacts.find(
        (c) => c.email.toLowerCase() === lead.parsed.email.toLowerCase()
      );
      if (matchedContact?.id) {
        contactId = matchedContact.id;
      } else if (lead.parsed.name && lead.parsed.email) {
        contactId = await addContact({
          name: lead.parsed.name,
          email: lead.parsed.email,
          phone: lead.parsed.phone,
          company: "",
          title: "",
          notes: `Auto-created from ${lead.source} portal enquiry.`,
          ownerId: user.uid,
          assignedAgentId: user.uid,
          assignedAgentName: user.displayName || user.email || "Unknown Agent",
          assignedAt: new Date().toISOString(),
        });
      }

      const leadId = await addLead({
        name: lead.parsed.name,
        email: lead.parsed.email,
        phone: lead.parsed.phone,
        company: "",
        status: "new",
        source: lead.source === "property24" ? "Property24" : lead.source === "private-property" ? "Private Property" : "Portal",
        notes: `Portal enquiry: ${lead.parsed.message}\nProperty: ${lead.parsed.propertyAddress}\nRef: ${lead.parsed.propertyRef}`,
        value: 0,
        contactId,
        ownerId: user.uid,
        assignedAgentId: user.uid,
        assignedAgentName: user.displayName || user.email || "Unknown Agent",
        assignedAt: new Date().toISOString(),
      });
      await updateInboundLead(lead.id, {
        status: "accepted",
        leadId,
        contactId,
        reviewedAt: serverTimestamp() as unknown as InboundLead["reviewedAt"],
      });
      fetchData();
    } catch (error) {
      console.error("Failed to accept lead:", error);
    }
  };

  const handleReject = async (lead: InboundLead) => {
    if (!lead.id) return;
    await updateInboundLead(lead.id, { status: "rejected", reviewedAt: serverTimestamp() as unknown as InboundLead["reviewedAt"] });
    fetchData();
  };

  const filtered = filter === "all" ? inboundLeads : inboundLeads.filter((l) => l.status === filter);
  const pendingCount = inboundLeads.filter((l) => l.status === "pending").length;
  const acceptedCount = inboundLeads.filter((l) => l.status === "accepted").length;

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Inbound Leads</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Portal lead injection from Property24 &amp; Private Property</p>
          </div>
          <Button size="sm" onClick={() => setPasteOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Paste Lead Email
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Inbound</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">{inboundLeads.length}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFilter("pending")}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-amber-600">{pendingCount}</p>
                </div>
                <Clock className="h-5 w-5 text-amber-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFilter("accepted")}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{acceptedCount}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === "pending" && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Inbox className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] text-muted-foreground">No inbound leads. Paste a portal email to import a lead.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => (
              <Card key={lead.id} className={lead.status === "pending" ? "border-amber-200 dark:border-amber-800/50" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{lead.parsed.name || "Unknown"}</p>
                        <Badge variant={lead.status === "pending" ? "warning" : lead.status === "accepted" ? "success" : "destructive"} className="text-[10px]">
                          {lead.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                        {lead.parsed.email && <span>{lead.parsed.email}</span>}
                        {lead.parsed.phone && <span>{lead.parsed.phone}</span>}
                        {lead.parsed.propertyAddress && <span>🏠 {lead.parsed.propertyAddress}</span>}
                      </div>
                      {lead.parsed.message && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{lead.parsed.message}</p>
                      )}
                    </div>
                    {lead.status === "pending" && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20" onClick={() => handleAccept(lead)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleReject(lead)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Paste Sheet */}
      <Sheet open={pasteOpen} onOpenChange={setPasteOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Import Portal Lead</SheetTitle>
            <SheetDescription>Paste the email notification from Property24 or Private Property</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={pasteSource} onValueChange={(v) => setPasteSource(v as typeof pasteSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="property24">Property24</SelectItem>
                  <SelectItem value="private-property">Private Property</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Content *</Label>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={"Paste the full email notification here...\n\nExample:\nName: John Smith\nEmail: john@example.com\nPhone: 082 123 4567\nProperty: 12 Oak Ave, Sandton\nRef: P24-12345\nMessage: I'm interested in viewing this property."}
              />
            </div>
            <Button onClick={handlePaste} className="w-full">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Parse &amp; Import
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
