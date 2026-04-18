"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "@/components/leads-table";
import { NewLeadSheet } from "@/components/new-lead-sheet";

export default function LeadsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLeadAdded = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Manage your contacts and track your pipeline.
            </p>
          </div>
          <NewLeadSheet onLeadAdded={handleLeadAdded} />
        </div>

        {/* Table */}
        <LeadsTable refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
