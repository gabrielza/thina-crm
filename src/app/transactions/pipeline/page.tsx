"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, GripVertical, Home } from "lucide-react";
import {
  getTransactions, updateTransaction,
  type Transaction, type TransactionStage, TRANSACTION_STAGES,
} from "@/lib/firestore";
import { NewTransactionSheet } from "@/components/new-transaction-sheet";

const STAGES: { key: TransactionStage; label: string; color: string; bg: string }[] = [
  { key: "otp_signed", label: "OTP Signed", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  { key: "fica_submitted", label: "FICA Submitted", color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
  { key: "fica_verified", label: "FICA Verified", color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
  { key: "bond_applied", label: "Bond Applied", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  { key: "bond_approved", label: "Bond Approved", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  { key: "transfer_lodged", label: "Transfer Lodged", color: "text-orange-700", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
  { key: "transfer_registered", label: "Transfer Registered", color: "text-green-700", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  { key: "commission_paid", label: "Commission Paid", color: "text-green-700", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  { key: "fallen_through", label: "Fallen Through", color: "text-red-700", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
];

export default function TransactionPipelinePage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTransaction, setDraggedTransaction] = useState<Transaction | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDragStart = (e: React.DragEvent, transaction: Transaction) => {
    setDraggedTransaction(transaction);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", transaction.id || "");
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => { setDragOverStage(null); };

  const handleDrop = async (e: React.DragEvent, newStage: TransactionStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedTransaction?.id || draggedTransaction.stage === newStage) {
      setDraggedTransaction(null);
      return;
    }

    // Optimistic update
    setTransactions((prev) => prev.map((t) => (t.id === draggedTransaction.id ? { ...t, stage: newStage } : t)));

    try {
      const now = new Date().toISOString().split("T")[0];
      const stageHistory = [...(draggedTransaction.stageHistory || []), { stage: newStage, date: now }];
      const dates = { ...draggedTransaction.dates };
      const dateMap: Partial<Record<TransactionStage, keyof typeof dates>> = {
        bond_applied: "bondApplied",
        bond_approved: "bondApproved",
        transfer_lodged: "transferLodged",
        transfer_registered: "transferRegistered",
        commission_paid: "commissionPaid",
      };
      const dateKey = dateMap[newStage];
      if (dateKey) dates[dateKey] = now;

      await updateTransaction(draggedTransaction.id, { stage: newStage, stageHistory, dates });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      fetchTransactions(); // Revert on error
    }
    setDraggedTransaction(null);
  };

  const getStageTransactions = (stage: TransactionStage) => transactions.filter((t) => t.stage === stage);
  const getStageValue = (stage: TransactionStage) => getStageTransactions(stage).reduce((sum, t) => sum + (t.agentNetCommission || 0), 0);

  const totalPending = transactions.filter((t) => !["commission_paid", "fallen_through"].includes(t.stage)).reduce((sum, t) => sum + (t.agentNetCommission || 0), 0);
  const totalEarned = transactions.filter((t) => t.stage === "commission_paid").reduce((sum, t) => sum + (t.agentNetCommission || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Transaction Pipeline</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Drag transactions between stages &middot; Pending: <span className="font-mono font-medium">{formatCurrency(totalPending)}</span> &middot; Earned: <span className="font-mono font-medium text-green-600">{formatCurrency(totalEarned)}</span>
            </p>
          </div>
          <NewTransactionSheet onTransactionAdded={fetchTransactions} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : (
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <div className="flex gap-3 min-h-[60vh] px-4 sm:px-0" style={{ minWidth: "1400px" }}>
              {STAGES.map((stage) => {
                const stageTransactions = getStageTransactions(stage.key);
                const stageValue = getStageValue(stage.key);
                const isOver = dragOverStage === stage.key;

                return (
                  <div
                    key={stage.key}
                    className={`flex flex-col rounded-xl border p-3 transition-all min-w-[160px] flex-1 ${stage.bg} ${isOver ? "ring-2 ring-primary" : ""}`}
                    onDragOver={(e) => handleDragOver(e, stage.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.key)}
                  >
                    <div className="mb-3 px-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-[10px] font-semibold uppercase tracking-wider ${stage.color}`}>{stage.label}</h3>
                        <span className={`text-[11px] font-semibold tabular-nums ${stage.color}`}>{stageTransactions.length}</span>
                      </div>
                      <p className={`text-xs mt-0.5 font-mono ${stage.color} opacity-75`}>{formatCurrency(stageValue)}</p>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {stageTransactions.map((t) => (
                        <Card
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t)}
                          onClick={() => router.push(`/transactions/${t.id}`)}
                          className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedTransaction?.id === t.id ? "opacity-40" : ""}`}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {t.propertyAddress.split(",")[0]}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{t.buyerName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono font-medium">{formatCurrency(t.agentNetCommission)}</span>
                            </div>
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
