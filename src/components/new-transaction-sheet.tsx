"use client";

import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { addTransaction, type TransactionStage, TRANSACTION_STAGES } from "@/lib/firestore";
import { calculateCommission } from "@/lib/scoring";
import { useAuth } from "@/lib/hooks/use-auth";

interface NewTransactionSheetProps {
  onTransactionAdded: () => void;
  defaultLeadId?: string;
  defaultBuyerName?: string;
  defaultSellerName?: string;
  autoOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewTransactionSheet({ onTransactionAdded, defaultLeadId, defaultBuyerName, defaultSellerName, autoOpen, onOpenChange }: NewTransactionSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    propertyAddress: "",
    salePrice: 0,
    commissionRate: 5,
    vatIncluded: true,
    buyerName: defaultBuyerName || "",
    sellerName: defaultSellerName || "",
    conveyancer: "",
    bondOriginator: "",
    notes: "",
    leadId: defaultLeadId || "",
  });

  useEffect(() => {
    if (defaultBuyerName) setForm((f) => ({ ...f, buyerName: defaultBuyerName }));
    if (defaultSellerName) setForm((f) => ({ ...f, sellerName: defaultSellerName }));
    if (defaultLeadId) setForm((f) => ({ ...f, leadId: defaultLeadId }));
  }, [defaultBuyerName, defaultSellerName, defaultLeadId]);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  const commission = calculateCommission(form.salePrice, form.commissionRate, form.vatIncluded, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const now = new Date().toISOString().split("T")[0];
      await addTransaction({
        propertyAddress: form.propertyAddress,
        salePrice: form.salePrice,
        commissionRate: form.commissionRate,
        commissionAmount: commission.grossCommission,
        vatIncluded: form.vatIncluded,
        vatAmount: commission.vatAmount,
        splits: [],
        agentNetCommission: commission.agentNetCommission,
        stage: "otp_signed" as TransactionStage,
        stageHistory: [{ stage: "otp_signed" as TransactionStage, date: now }],
        ficaBuyer: false,
        ficaSeller: false,
        conveyancer: form.conveyancer,
        bondOriginator: form.bondOriginator,
        buyerName: form.buyerName,
        sellerName: form.sellerName,
        leadId: form.leadId,
        notes: form.notes,
        dates: { otpSigned: now },
        ownerId: user.uid,
      });
      setForm({
        propertyAddress: "",
        salePrice: 0,
        commissionRate: 5,
        vatIncluded: true,
        buyerName: "",
        sellerName: "",
        conveyancer: "",
        bondOriginator: "",
        notes: "",
        leadId: "",
      });
      setOpen(false);
      onTransactionAdded();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Transaction</SheetTitle>
          <SheetDescription>Record a new property sale transaction.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="propertyAddress">Property Address *</Label>
            <Input id="propertyAddress" required value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} placeholder="123 Main Road, Sandton, Gauteng" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="buyerName">Buyer Name *</Label>
              <Input id="buyerName" required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} placeholder="Buyer name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerName">Seller Name *</Label>
              <Input id="sellerName" required value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })} placeholder="Seller name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salePrice">Sale Price (R) *</Label>
            <Input id="salePrice" type="number" min={0} required value={form.salePrice || ""} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) || 0 })} placeholder="2500000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
              <Input id="commissionRate" type="number" min={0} max={100} step={0.1} required value={form.commissionRate || ""} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatIncluded">VAT (15%)</Label>
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
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Commission Preview</p>
              <div className="flex justify-between text-sm"><span>Gross Commission</span><span className="font-mono font-medium">{formatCurrency(commission.grossCommission)}</span></div>
              {form.vatIncluded && <div className="flex justify-between text-sm"><span>VAT (15%)</span><span className="font-mono text-muted-foreground">+{formatCurrency(commission.vatAmount)}</span></div>}
              <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Agent Net</span><span className="font-mono text-green-600">{formatCurrency(commission.agentNetCommission)}</span></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="conveyancer">Conveyancer</Label>
              <Input id="conveyancer" value={form.conveyancer} onChange={(e) => setForm({ ...form, conveyancer: e.target.value })} placeholder="Attorney name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bondOriginator">Bond Originator</Label>
              <Input id="bondOriginator" value={form.bondOriginator} onChange={(e) => setForm({ ...form, bondOriginator: e.target.value })} placeholder="Originator name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any extra details..." rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Transaction"}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
