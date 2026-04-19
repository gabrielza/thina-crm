"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, CheckCircle2 } from "lucide-react";
import { getShowDayById, addShowDayLead, type ShowDay } from "@/lib/firestore";
import { format } from "date-fns";

export default function ShowDayFormPage() {
  const params = useParams();
  const [showDay, setShowDay] = useState<ShowDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    budget: "",
    bedrooms: "",
    notes: "",
    marketingConsent: false,
  });

  useEffect(() => {
    async function fetchShowDay() {
      try {
        const id = params.id as string;
        const sd = await getShowDayById(id);
        setShowDay(sd);
      } catch (error) {
        console.error("Failed to fetch show day:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShowDay();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDay?.id) return;
    setSaving(true);
    try {
      await addShowDayLead({
        showDayId: showDay.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        budget: form.budget,
        bedrooms: form.bedrooms,
        notes: form.notes,
        marketingConsent: form.marketingConsent,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!showDay) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-16 text-center">
            <Home className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="text-lg font-semibold">Show Day Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1">This show day may have ended or the link is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showDay.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-16 text-center">
            <Home className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="text-lg font-semibold">Show Day Closed</h2>
            <p className="text-sm text-muted-foreground mt-1">Registration for this show day has ended.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-3" />
            <h2 className="text-lg font-semibold">Thank You!</h2>
            <p className="text-sm text-muted-foreground mt-1">Your details have been recorded. The agent will be in touch.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Home className="h-5 w-5" />
          </div>
          <CardTitle>Open House Registration</CardTitle>
          <CardDescription>
            {showDay.propertyAddress}
            <br />
            {format(new Date(showDay.date), "EEEE, dd MMMM yyyy")}
            {showDay.timeSlot && ` · ${showDay.timeSlot}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sd-name">Full Name *</Label>
              <Input id="sd-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-email">Email *</Label>
              <Input id="sd-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-phone">Phone *</Label>
              <Input id="sd-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 082 123 4567" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sd-budget">Budget Range</Label>
                <Input id="sd-budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="e.g. R1.5M - R2M" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sd-beds">Bedrooms Needed</Label>
                <Input id="sd-beds" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="e.g. 3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-notes">Any Questions?</Label>
              <Input id="sd-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.marketingConsent} onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })} className="rounded border-border mt-0.5" />
              <span className="text-xs text-muted-foreground">I consent to receiving property updates and marketing communications (POPIA compliant)</span>
            </label>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Submitting..." : "Register"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">Powered by Thina CRM</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
