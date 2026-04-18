"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { ContactsTable } from "@/components/contacts-table";
import { NewContactSheet } from "@/components/new-contact-sheet";

export default function ContactsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleContactAdded = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground mt-1">Manage your contacts and customer relationships.</p>
          </div>
          <NewContactSheet onContactAdded={handleContactAdded} />
        </div>
        <ContactsTable refreshKey={refreshKey} />
      </div>
    </AppShell>
  );
}
