"use client";

import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateTransaction, type Transaction, type TransactionStage, TRANSACTION_STAGES } from "@/lib/firestore";
import { calculateCommission } from "@/lib/scoring";

interface EditTransactionSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated: () => void;
}

export function EditTransactionSheet({ transaction, open, onOpenChange, onTransactionUpdated }: EditTransactionSheetProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    propertyAddress: "",
    salePrice: 0,
    commissionRate: 5,
    vatIncluded: true,
    buyerName: "",
    sellerName: "",
    conveyancer: "",
    bondOriginator: "",
    notes: "",
    stage: "otp_signed" as TransactionStage,
    ficaBuyer: false,
    ficaSeller: false,
  });

  useEffect(() => {
    if (transaction) {
      setForm({
        propertyAddress: transaction.propertyAddress,
        salePrice: transaction.salePrice,
        commissionRate: transaction.commissionRate,
        vatIncluded: transaction.vatIncluded,
        buyerName: transaction.buyerName,
        sellerName: transaction.sellerName,
        conveyancer: transaction.conveyancer,
        bondOriginator: transaction.bondOriginator,
        notes: transaction.notes,
        stage: transaction.stage,
        ficaBuyer: transaction.ficaBuyer,
        ficaSeller: transaction.ficaSeller,
      });
    }
  }, [transaction]);

  const commission = calculateCommission(form.salePrice, form.commissionRate, form.vatIncluded, transaction?.splits || []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction?.id) return;

    setSaving(true);
    try {
      const now = new Date().toISOString().split("T")[0];
      const stageChanged = form.stage !== transaction.stage;
      const stageHistory = stageChanged
        ? [...(transaction.stageHistory || []), { stage: form.stage, date: now }]
        : transaction.stageHistory;

      // Update dates based on stage change
      const dates = { ...transaction.dates };
      if (stageChanged) {
        const dateMap: Partial<Record<TransactionStage, keyof typeof dates>> = {
          bond_applied: "bondApplied",
          bond_approved: "bondApproved",
          transfer_lodged: "transferLodged",
          transfer_registered: "transferRegistered",
          commission_paid: "commissionPaid",
        };
        const dateKey = dateMap[form.stage];
        if (dateKey) dates[dateKey] = now;
      }

      await updateTransaction(transaction.id, {
        ...form,
        commissionAmount: commission.grossCommission,
        vatAmount: commission.vatAmount,
        agentNetCommission: commission.agentNetCommission,
        stageHistory,
        dates,
      });
      onOpenChange(false);
      onTransactionUpdated();
    } catch (error) {
      console.error("Failed to update transaction:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>Update transaction details.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="edit-propertyAddress">Property Address *</Label>
            <Input id="edit-propertyAddress" required value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-buyerName">Buyer Name *</Label>
              <Input id="edit-buyerName" required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sellerName">Seller Name *</Label>
              <Input id="edit-sellerName" required value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-salePrice">Sale Price (R) *</Label>
            <Input id="edit-salePrice" type="number" min={0} required value={form.salePrice || ""} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-commissionRate">Commission Rate (%)</Label>
              <Input id="edit-commissionRate" type="number" min={0} max={100} step={0.1} value={form.commissionRate || ""} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vatIncluded">VAT (15%)</Label>
              <Select value={form.vatIncluded ? "yes" : "no"} onValueChange={(v) => setForm({ ...form, vatIncluded: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Include VAT</SelectItem>
                  <SelectItem value="no">Exclude VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commission Preview */}
          {form.salePrice > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Commission</p>
              <div className="flex justify-between text-sm"><span>Gross</span><span className="font-mono font-medium">{formatCurrency(commission.grossCommission)}</span></div>
              {form.vatIncluded && <div className="flex justify-between text-sm"><span>VAT (15%)</span><span className="font-mono text-muted-foreground">+{formatCurrency(commission.vatAmount)}</span></div>}
              {commission.totalSplits > 0 && <div className="flex justify-between text-sm"><span>Splits</span><span className="font-mono text-muted-foreground">-{formatCurrency(commission.totalSplits)}</span></div>}
              <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Agent Net</span><span className="font-mono text-green-600">{formatCurrency(commission.agentNetCommission)}</span></div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-stage">Transaction Stage</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as TransactionStage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSACTION_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>FICA — Buyer</Label>
              <Select value={form.ficaBuyer ? "yes" : "no"} onValueChange={(v) => setForm({ ...form, ficaBuyer: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Not Submitted</SelectItem>
                  <SelectItem value="yes">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>FICA — Seller</Label>
              <Select value={form.ficaSeller ? "yes" : "no"} onValueChange={(v) => setForm({ ...form, ficaSeller: v === "yes" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Not Submitted</SelectItem>
                  <SelectItem value="yes">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-conveyancer">Conveyancer</Label>
              <Input id="edit-conveyancer" value={form.conveyancer} onChange={(e) => setForm({ ...form, conveyancer: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bondOriginator">Bond Originator</Label>
              <Input id="edit-bondOriginator" value={form.bondOriginator} onChange={(e) => setForm({ ...form, bondOriginator: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea id="edit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving..." : "Update Transaction"}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
