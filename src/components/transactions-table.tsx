"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Pencil, Home, FileCheck } from "lucide-react";
import { getTransactions, deleteTransaction, type Transaction, type TransactionStage, TRANSACTION_STAGES } from "@/lib/firestore";
import { formatCurrency } from "@/lib/utils";

const stageColors: Record<TransactionStage, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  otp_signed: "default",
  fica_submitted: "secondary",
  fica_verified: "secondary",
  bond_applied: "warning",
  bond_approved: "warning",
  transfer_lodged: "outline",
  transfer_registered: "success",
  commission_paid: "success",
  fallen_through: "destructive",
};

function stageLabel(stage: TransactionStage): string {
  return TRANSACTION_STAGES.find((s) => s.key === stage)?.label || stage;
}

interface TransactionsTableProps {
  refreshKey: number;
}

export function TransactionsTable({ refreshKey }: TransactionsTableProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [stageFilter, setStageFilter] = useState<TransactionStage | "all">("all");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.propertyAddress.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      t.buyerName.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      t.sellerName.toLowerCase().includes(deferredSearch.toLowerCase());
    const matchesStage = stageFilter === "all" || t.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const filterStages: (TransactionStage | "all")[] = ["all", "otp_signed", "fica_submitted", "fica_verified", "bond_applied", "bond_approved", "transfer_lodged", "transfer_registered", "commission_paid", "fallen_through"];

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px] border-border/50 bg-background" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterStages.map((stage) => {
            const count = stage === "all" ? transactions.length : transactions.filter((t) => t.stage === stage).length;
            if (stage !== "all" && count === 0) return null;
            return (
              <button key={stage} onClick={() => setStageFilter(stage)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${stageFilter === stage ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {stage === "all" ? "All" : stageLabel(stage as TransactionStage)} {count}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/50 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">{transactions.length === 0 ? "No transactions yet. Click 'New Transaction' to get started!" : "No transactions match your filters."}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Property</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>FICA</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/transactions/${t.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary text-xs"><Home className="h-4 w-4" /></div>
                        <div><p className="font-medium text-[13px] truncate max-w-[200px]">{t.propertyAddress}</p><p className="text-[11px] text-muted-foreground">{t.sellerName}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[13px]">{t.buyerName || "—"}</TableCell>
                    <TableCell className="font-mono text-[13px] font-medium">{formatCurrency(t.salePrice)}</TableCell>
                    <TableCell className="font-mono text-[13px] font-medium">{formatCurrency(t.agentNetCommission)}</TableCell>
                    <TableCell><Badge variant={stageColors[t.stage]} className="text-[11px]">{stageLabel(t.stage)}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <span title="Buyer FICA"><FileCheck className={`h-4 w-4 ${t.ficaBuyer ? "text-green-500" : "text-muted-foreground/30"}`} /></span>
                        <span title="Seller FICA"><FileCheck className={`h-4 w-4 ${t.ficaSeller ? "text-green-500" : "text-muted-foreground/30"}`} /></span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); t.id && handleDelete(t.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="rounded-xl border border-border/50 p-4 active:bg-muted/30 transition-colors" onClick={() => router.push(`/transactions/${t.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Home className="h-4 w-4" /></div>
                    <div><p className="font-medium text-sm truncate max-w-[180px]">{t.propertyAddress}</p><p className="text-[12px] text-muted-foreground">{t.buyerName}</p></div>
                  </div>
                  <Badge variant={stageColors[t.stage]} className="text-[10px]">{stageLabel(t.stage)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <span className="font-mono text-sm font-medium">{formatCurrency(t.salePrice)}</span>
                  <span className="font-mono text-[12px] text-green-600">{formatCurrency(t.agentNetCommission)} net</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
