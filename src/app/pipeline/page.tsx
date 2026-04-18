"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, GripVertical } from "lucide-react";
import { getLeads, updateLead, type Lead } from "@/lib/firestore";
import { NewLeadSheet } from "@/components/new-lead-sheet";

const STAGES: { key: Lead["status"]; label: string; color: string; bg: string }[] = [
  { key: "new", label: "New", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  { key: "contacted", label: "Contacted", color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
  { key: "qualified", label: "Qualified", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  { key: "proposal", label: "Proposal", color: "text-orange-700", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
  { key: "won", label: "Won", color: "text-green-700", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  { key: "lost", label: "Lost", color: "text-red-700", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

export default function PipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id || "");
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Lead["status"]) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedLead?.id || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === draggedLead.id ? { ...l, status: newStatus } : l)));
    try {
      await updateLead(draggedLead.id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update lead:", error);
      fetchLeads(); // Revert on error
    }
    setDraggedLead(null);
  };

  const getStageLeads = (status: Lead["status"]) => leads.filter((l) => l.status === status);
  const getStageValue = (status: Lead["status"]) => getStageLeads(status).reduce((sum, l) => sum + (l.value || 0), 0);

  const totalPipelineValue = leads.filter((l) => !["won", "lost"].includes(l.status)).reduce((sum, l) => sum + (l.value || 0), 0);
  const totalWonValue = leads.filter((l) => l.status === "won").reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Drag deals between stages &middot; Pipeline: <span className="font-mono font-medium">{formatCurrency(totalPipelineValue)}</span> &middot; Won: <span className="font-mono font-medium">{formatCurrency(totalWonValue)}</span>
            </p>
          </div>
          <NewLeadSheet onLeadAdded={fetchLeads} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : (
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <div className="flex lg:grid lg:grid-cols-6 gap-3 min-h-[60vh] px-4 sm:px-0" style={{ minWidth: "900px" }}>
              {STAGES.map((stage) => {
              const stageLeads = getStageLeads(stage.key);
              const stageValue = getStageValue(stage.key);
              const isOver = dragOverStage === stage.key;

              return (
                <div
                  key={stage.key}
                  className={`flex flex-col rounded-xl border p-3 transition-all bg-muted/20 min-w-[150px] flex-1 ${isOver ? "ring-2 ring-primary" : "border-border/50"}`}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.key)}
                >
                  {/* Column Header */}
                  <div className="mb-3 px-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{stage.label}</h3>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{stageLeads.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{formatCurrency(stageValue)}</p>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {stageLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedLead?.id === lead.id ? "opacity-40" : ""}`}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                                onClick={() => router.push(`/leads/${lead.id}`)}
                              >
                                {lead.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                            </div>
                          </div>
                          {lead.value > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono font-medium">{formatCurrency(lead.value)}</span>
                            </div>
                          )}
                          {lead.source && <p className="text-xs text-muted-foreground">{lead.source}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
