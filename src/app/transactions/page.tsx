"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TransactionsTable } from "@/components/transactions-table";
import { NewTransactionSheet } from "@/components/new-transaction-sheet";

function TransactionsContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const newFromLead = searchParams.get("newFromLead");
  const buyerName = searchParams.get("buyerName");
  const actionNew = searchParams.get("action") === "new";
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    if (newFromLead || actionNew) setAutoOpen(true);
  }, [newFromLead, actionNew]);

  const handleTransactionAdded = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setAutoOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Track property sales, commissions, and FICA compliance.
          </p>
        </div>
        <NewTransactionSheet
          onTransactionAdded={handleTransactionAdded}
          defaultLeadId={newFromLead || undefined}
          defaultBuyerName={buyerName || undefined}
          autoOpen={autoOpen}
          onOpenChange={(open) => { if (!open) setAutoOpen(false); }}
        />
      </div>
      <TransactionsTable refreshKey={refreshKey} />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
        <TransactionsContent />
      </Suspense>
    </AppShell>
  );
}
