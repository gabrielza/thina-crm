"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Calendar, DollarSign, Tag } from "lucide-react";
import { getLeadById, deleteLead, type Lead } from "@/lib/firestore";
import { EditLeadSheet } from "@/components/edit-lead-sheet";
import { format } from "date-fns";

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  qualified: "success",
  proposal: "warning",
  won: "success",
  lost: "destructive",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchLead = async () => {
    const id = params.id as string;
    try {
      const data = await getLeadById(id);
      setLead(data);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleDelete = async () => {
    if (!lead?.id || !confirm("Are you sure you want to delete this lead?")) return;
    await deleteLead(lead.id);
    router.push("/leads");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell>
        <div className="text-center py-24">
          <p className="text-muted-foreground text-lg">Lead not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/leads")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/leads")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">{lead.company}</p>
          </div>
          <Badge variant={statusColors[lead.status]} className="ml-2 text-sm">
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone || "—"}</a>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{lead.company || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Deal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-lg font-semibold">
                {lead.value ? formatCurrency(lead.value) : "No value set"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>Source: {lead.source || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Created:{" "}
                {lead.createdAt
                  ? format(lead.createdAt.toDate(), "dd MMM yyyy, HH:mm")
                  : "—"}
              </span>
            </div>
            {lead.updatedAt && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Updated: {format(lead.updatedAt.toDate(), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {lead.notes || "No notes yet."}
            </p>
          </CardContent>
        </Card>
      </div>

      <EditLeadSheet
        lead={lead}
        open={editOpen}
        onOpenChange={setEditOpen}
        onLeadUpdated={fetchLead}
      />
    </AppShell>
  );
}
