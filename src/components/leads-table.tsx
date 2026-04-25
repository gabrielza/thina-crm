"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Pencil, Phone, Mail, Star } from "lucide-react";
import { getLeads, deleteLead, toggleLeadStar, type Lead } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";
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
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<Lead["status"] | "all">("all");
  const [starredOnly, setStarredOnly] = useState(false);
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

  useEffect(() => { fetchLeads(); }, [fetchLeads, refreshKey]);

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

  const handleToggleStar = async (lead: Lead) => {
    if (!lead.id) return;
    const next = !lead.starred;
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, starred: next } : l)));
    try {
      await toggleLeadStar(lead.id, next);
    } catch (error) {
      console.error("Failed to toggle star:", error);
      // Revert on failure
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, starred: !next } : l)));
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      lead.company.toLowerCase().includes(deferredSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesStarred = !starredOnly || lead.starred === true;
    return matchesSearch && matchesStatus && matchesStarred;
  });

  // Sort starred leads to top while preserving existing order otherwise
  const sortedFiltered = [...filtered].sort((a, b) => {
    const aStar = a.starred ? 1 : 0;
    const bStar = b.starred ? 1 : 0;
    return bStar - aStar;
  });

  const starredCount = leads.filter((l) => l.starred).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px] border-border/50 bg-background" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setStatusFilter("all")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            All {leads.length}
          </button>
          {starredCount > 0 && (
            <button
              onClick={() => setStarredOnly((v) => !v)}
              aria-pressed={starredOnly}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 ${starredOnly ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Star className={`h-3 w-3 ${starredOnly ? "fill-white" : "fill-amber-400 text-amber-400"}`} />
              Starred {starredCount}
            </button>
          )}
          {ALL_STATUSES.map((status) => {
            const count = leads.filter((l) => l.status === status).length;
            if (count === 0) return null;
            return (
              <button key={status} onClick={() => setStatusFilter(status)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === status ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)} {count}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/50 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">{leads.length === 0 ? "No leads yet. Click 'Add Lead' to get started!" : "No leads match your filters."}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[36px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiltered.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                    <TableCell onClick={(e) => { e.stopPropagation(); handleToggleStar(lead); }}>
                      <button
                        type="button"
                        aria-label={lead.starred ? "Unstar lead" : "Star lead"}
                        aria-pressed={!!lead.starred}
                        data-testid="lead-star-toggle"
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted transition-colors"
                      >
                        <Star className={`h-3.5 w-3.5 ${lead.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60"}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary text-xs font-semibold">{lead.name.charAt(0)}</div>
                        <div><p className="font-medium text-[13px]">{lead.name}</p><p className="text-[11px] text-muted-foreground">{lead.email}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.company || "—"}</TableCell>
                    <TableCell className="font-mono text-[13px] font-medium">{lead.value ? formatCurrency(lead.value) : "—"}</TableCell>
                    <TableCell><Badge variant={statusColors[lead.status]} className="text-[11px]">{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-[13px]">{lead.source}</TableCell>
                    <TableCell className="text-muted-foreground text-[13px]">{lead.assignedAgentName ? <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />{lead.assignedAgentName.split(" ")[0]}</span> : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.phone && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`); }}><Phone className="h-3.5 w-3.5" /></Button>}
                        {lead.email && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(`mailto:${lead.email}`); }}><Mail className="h-3.5 w-3.5" /></Button>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (lead.id) handleDelete(lead.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {sortedFiltered.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-border/50 p-4 active:bg-muted/30 transition-colors" onClick={() => router.push(`/leads/${lead.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={lead.starred ? "Unstar lead" : "Star lead"}
                      aria-pressed={!!lead.starred}
                      onClick={(e) => { e.stopPropagation(); handleToggleStar(lead); }}
                      className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted transition-colors"
                    >
                      <Star className={`h-4 w-4 ${lead.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60"}`} />
                    </button>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{lead.name.charAt(0)}</div>
                    <div><p className="font-medium text-sm">{lead.name}</p><p className="text-[12px] text-muted-foreground">{lead.company}</p></div>
                  </div>
                  <Badge variant={statusColors[lead.status]} className="text-[10px]">{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <span className="font-mono text-sm font-medium">{lead.value ? formatCurrency(lead.value) : "—"}</span>
                  <span className="text-[12px] text-muted-foreground">{lead.source}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <EditLeadSheet lead={editLead} open={editOpen} onOpenChange={setEditOpen} onLeadUpdated={fetchLeads} />
    </div>
  );
}
