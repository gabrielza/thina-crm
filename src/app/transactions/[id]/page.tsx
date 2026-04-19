"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Pencil, Trash2, Home, DollarSign, FileCheck, Scale, Landmark,
  Calendar, User, CheckCircle2, Circle, XCircle, ArrowRight,
} from "lucide-react";
import {
  getTransactionById, deleteTransaction, updateTransaction,
  type Transaction, type TransactionStage, TRANSACTION_STAGES,
} from "@/lib/firestore";
import { EditTransactionSheet } from "@/components/edit-transaction-sheet";
import { calculateCommission } from "@/lib/scoring";
import { format } from "date-fns";

const stageColors: Record<TransactionStage, string> = {
  otp_signed: "text-blue-700 bg-blue-50",
  fica_submitted: "text-violet-700 bg-violet-50",
  fica_verified: "text-violet-700 bg-violet-50",
  bond_applied: "text-amber-700 bg-amber-50",
  bond_approved: "text-amber-700 bg-amber-50",
  transfer_lodged: "text-orange-700 bg-orange-50",
  transfer_registered: "text-green-700 bg-green-50",
  commission_paid: "text-green-700 bg-green-50",
  fallen_through: "text-red-700 bg-red-50",
};

const badgeVariants: Record<TransactionStage, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const id = params.id as string;
    try {
      const t = await getTransactionById(id);
      setTransaction(t);
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!transaction?.id || !confirm("Are you sure you want to delete this transaction?")) return;
    await deleteTransaction(transaction.id);
    router.push("/transactions");
  };

  const handleAdvanceStage = async () => {
    if (!transaction?.id) return;
    const stageOrder: TransactionStage[] = [
      "otp_signed", "fica_submitted", "fica_verified", "bond_applied",
      "bond_approved", "transfer_lodged", "transfer_registered", "commission_paid",
    ];
    const currentIdx = stageOrder.indexOf(transaction.stage);
    if (currentIdx < 0 || currentIdx >= stageOrder.length - 1) return;

    const nextStage = stageOrder[currentIdx + 1];
    const now = new Date().toISOString().split("T")[0];
    const stageHistory = [...(transaction.stageHistory || []), { stage: nextStage, date: now }];

    const dates = { ...transaction.dates };
    const dateMap: Partial<Record<TransactionStage, keyof typeof dates>> = {
      bond_applied: "bondApplied",
      bond_approved: "bondApproved",
      transfer_lodged: "transferLodged",
      transfer_registered: "transferRegistered",
      commission_paid: "commissionPaid",
    };
    const dateKey = dateMap[nextStage];
    if (dateKey) dates[dateKey] = now;

    await updateTransaction(transaction.id, { stage: nextStage, stageHistory, dates });
    fetchData();
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  if (!transaction) {
    return <AppShell><div className="text-center py-24"><p className="text-muted-foreground text-lg">Transaction not found.</p><Button variant="outline" className="mt-4" onClick={() => router.push("/transactions")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions</Button></div></AppShell>;
  }

  const commission = calculateCommission(transaction.salePrice, transaction.commissionRate, transaction.vatIncluded, transaction.splits || []);
  const stageOrder: TransactionStage[] = [
    "otp_signed", "fica_submitted", "fica_verified", "bond_applied",
    "bond_approved", "transfer_lodged", "transfer_registered", "commission_paid",
  ];
  const currentStageIdx = stageOrder.indexOf(transaction.stage);
  const isFallenThrough = transaction.stage === "fallen_through";
  const isComplete = transaction.stage === "commission_paid";

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/transactions")} className="h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary"><Home className="h-5 w-5" /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight truncate">{transaction.propertyAddress}</h1>
              <Badge variant={badgeVariants[transaction.stage]} className="text-[11px] shrink-0">{stageLabel(transaction.stage)}</Badge>
            </div>
            <p className="text-[13px] text-muted-foreground truncate">{transaction.buyerName} &middot; {formatCurrency(transaction.salePrice)}</p>
          </div>
        </div>
        <div className="flex gap-2 ml-11 sm:ml-0 shrink-0">
          {!isFallenThrough && !isComplete && (
            <Button size="sm" onClick={handleAdvanceStage}><ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Advance Stage</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
        </div>
      </div>

      {/* Stage Timeline */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Transaction Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {stageOrder.map((stage, idx) => {
              const isActive = idx === currentStageIdx && !isFallenThrough;
              const isPast = idx < currentStageIdx && !isFallenThrough;
              const historyEntry = transaction.stageHistory?.find((h) => h.stage === stage);
              return (
                <div key={stage} className="flex items-center gap-1 shrink-0">
                  <div className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${isActive ? stageColors[stage] : isPast ? "text-green-600 bg-green-50/50" : "text-muted-foreground/50"}`}>
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <Circle className="h-5 w-5 fill-current" /> : <Circle className="h-5 w-5" />}
                    <span className="text-[10px] font-medium whitespace-nowrap">{stageLabel(stage)}</span>
                    {historyEntry && <span className="text-[9px]">{historyEntry.date}</span>}
                  </div>
                  {idx < stageOrder.length - 1 && <div className={`w-4 h-px ${isPast ? "bg-green-400" : "bg-border"}`} />}
                </div>
              );
            })}
            {isFallenThrough && (
              <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-red-600 bg-red-50 shrink-0 ml-2">
                <XCircle className="h-5 w-5" />
                <span className="text-[10px] font-medium">Fallen Through</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Commission Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-[13px] text-muted-foreground">Sale Price</span><span className="font-mono font-semibold">{formatCurrency(transaction.salePrice)}</span></div>
              <div className="flex items-center justify-between"><span className="text-[13px] text-muted-foreground">Commission Rate</span><span className="font-mono">{transaction.commissionRate}%</span></div>
              <div className="border-t pt-2" />
              <div className="flex items-center justify-between"><span className="text-[13px]">Gross Commission</span><span className="font-mono font-medium">{formatCurrency(commission.grossCommission)}</span></div>
              {transaction.vatIncluded && <div className="flex items-center justify-between"><span className="text-[13px] text-muted-foreground">VAT (15%)</span><span className="font-mono text-muted-foreground">+{formatCurrency(commission.vatAmount)}</span></div>}
              {(transaction.splits || []).length > 0 && (
                <>
                  <div className="border-t pt-2" />
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Splits</p>
                  {transaction.splits.map((split, i) => (
                    <div key={i} className="flex items-center justify-between"><span className="text-[13px] text-muted-foreground">{split.party} ({split.percentage}%)</span><span className="font-mono text-muted-foreground">-{formatCurrency(split.amount)}</span></div>
                  ))}
                </>
              )}
              <div className="border-t pt-2" />
              <div className="flex items-center justify-between font-bold"><span>Agent Net Commission</span><span className="font-mono text-green-600">{formatCurrency(commission.agentNetCommission)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>FICA Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <FileCheck className={`h-5 w-5 ${transaction.ficaBuyer ? "text-green-500" : "text-muted-foreground/30"}`} />
                <div>
                  <p className="text-[13px] font-medium">Buyer FICA</p>
                  <p className="text-[11px] text-muted-foreground">{transaction.ficaBuyer ? "Submitted & verified" : "Not yet submitted"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileCheck className={`h-5 w-5 ${transaction.ficaSeller ? "text-green-500" : "text-muted-foreground/30"}`} />
                <div>
                  <p className="text-[13px] font-medium">Seller FICA</p>
                  <p className="text-[11px] text-muted-foreground">{transaction.ficaSeller ? "Submitted & verified" : "Not yet submitted"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center + Right columns — Parties & Dates */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Parties</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground/60" /><div><p className="text-[11px] text-muted-foreground">Buyer</p><p className="text-[13px] font-medium">{transaction.buyerName || "—"}</p></div></div>
                  <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground/60" /><div><p className="text-[11px] text-muted-foreground">Seller</p><p className="text-[13px] font-medium">{transaction.sellerName || "—"}</p></div></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><Scale className="h-4 w-4 text-muted-foreground/60" /><div><p className="text-[11px] text-muted-foreground">Conveyancer</p><p className="text-[13px] font-medium">{transaction.conveyancer || "—"}</p></div></div>
                  <div className="flex items-center gap-3"><Landmark className="h-4 w-4 text-muted-foreground/60" /><div><p className="text-[11px] text-muted-foreground">Bond Originator</p><p className="text-[13px] font-medium">{transaction.bondOriginator || "—"}</p></div></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Key Dates</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "OTP Signed", value: transaction.dates?.otpSigned },
                  { label: "Bond Applied", value: transaction.dates?.bondApplied },
                  { label: "Bond Approved", value: transaction.dates?.bondApproved },
                  { label: "Transfer Lodged", value: transaction.dates?.transferLodged },
                  { label: "Transfer Registered", value: transaction.dates?.transferRegistered },
                  { label: "Commission Paid", value: transaction.dates?.commissionPaid },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground/60" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">{d.label}</p>
                      <p className="text-[13px] font-medium">{d.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {transaction.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{transaction.notes}</p></CardContent>
            </Card>
          )}

          {/* Stage History */}
          {(transaction.stageHistory || []).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Stage History</CardTitle></CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {transaction.stageHistory.map((entry, idx) => (
                      <div key={idx} className="relative flex gap-4 pl-1">
                        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${stageColors[entry.stage] || "bg-muted text-muted-foreground"}`}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{stageLabel(entry.stage)}</p>
                            <span className="text-xs text-muted-foreground">{entry.date}</span>
                          </div>
                          {entry.note && <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditTransactionSheet transaction={transaction} open={editOpen} onOpenChange={setEditOpen} onTransactionUpdated={fetchData} />
    </AppShell>
  );
}
