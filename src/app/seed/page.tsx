"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { getFirebaseAuth } from "@/lib/firebase";

const COUNTS = { contacts: 200, leads: 500, activities: 300, tasks: 200 };
const TOTAL = COUNTS.contacts + COUNTS.leads + COUNTS.activities + COUNTS.tasks;

export default function SeedPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [phase, setPhase] = useState("");
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);

  async function getToken() {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Not authenticated");
    return currentUser.getIdToken();
  }

  const handleClear = async () => {
    if (!confirm("This will DELETE all existing data in Leads, Contacts, Activities, and Tasks. Are you sure?")) return;
    setClearing(true);
    setPhase("Clearing all data via server...");
    try {
      const token = await getToken();
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear");
      setPhase(`Cleared ${data.cleared} records.`);
    } catch (error) {
      setPhase(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setClearing(false);
    }
  };

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    setDone(false);
    setPhase("Seeding data via server...");
    const start = Date.now();
    try {
      const token = await getToken();
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed");
      const seconds = ((Date.now() - start) / 1000).toFixed(1);
      setElapsed(parseFloat(seconds));
      setStats(data.counts);
      setDone(true);
      setPhase(`Done in ${seconds}s!`);
    } catch (error) {
      setPhase(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto mt-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Seed Sample Data</CardTitle>
            <p className="text-[13px] text-muted-foreground mt-1">
              Generate {TOTAL.toLocaleString()} realistic records via server-side batch writes.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Counts preview */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(COUNTS).map(([key, count]) => (
                <div key={key} className="rounded-lg border border-border/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{key}</p>
                  <p className="text-xl font-semibold tabular-nums mt-0.5">{count}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            {(seeding || clearing) && (
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary animate-pulse" style={{ width: "100%" }} />
                </div>
                <p className="text-[13px] text-muted-foreground">{phase}</p>
              </div>
            )}

            {/* Success stats */}
            {done && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary text-sm">{TOTAL.toLocaleString()} records created in {elapsed}s</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {Object.entries(stats).map(([key, count]) => (
                    <span key={key} className="text-[13px] text-muted-foreground">{count} {key}</span>
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">Go to the Dashboard to see everything in action.</p>
              </div>
            )}

            {/* Phase message when not seeding but has message */}
            {!seeding && !clearing && !done && phase && (
              <p className="text-[13px] text-muted-foreground">{phase}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSeed} disabled={seeding || clearing} className="flex-1">
                {seeding ? "Seeding..." : done ? "Seed Again" : "Seed All Data"}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={seeding || clearing} className="text-destructive hover:text-destructive">
                {clearing ? "Clearing..." : "Clear All"}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Uses server-side Firebase Admin SDK with parallel batch writes for maximum speed.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
