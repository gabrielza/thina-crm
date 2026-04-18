"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Pencil } from "lucide-react";
import { getLeads, deleteLead, type Lead } from "@/lib/firestore";
import { EditLeadSheet } from "@/components/edit-lead-sheet";

const statusColors: Record<Lead["status"], "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  qualified: "success",
  proposal: "warning",
  won: "success",
  lost: "destructive",
};

const ALL_STATUSES: Lead["status"][] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

interface LeadsTableProps {
  refreshKey: number;
}

export function LeadsTable({ refreshKey }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Lead["status"] | "all">("all");
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setEditOpen(true);
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All ({leads.length})
          </Button>
          {ALL_STATUSES.map((status) => {
            const count = leads.filter((l) => l.status === status).length;
            return (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">
            {leads.length === 0
              ? "No leads yet. Click 'Add Lead' to get started!"
              : "No leads match your filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/leads/${lead.id}`)}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {lead.value ? formatCurrency(lead.value) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[lead.status]}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); lead.id && handleDelete(lead.id); }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Sheet */}
      <EditLeadSheet
        lead={editLead}
        open={editOpen}
        onOpenChange={setEditOpen}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
}
