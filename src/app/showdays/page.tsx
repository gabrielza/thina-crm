"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Home, QrCode, Plus, Users, Calendar, Copy, ExternalLink, Trash2,
} from "lucide-react";
import {
  getShowDays, addShowDay, deleteShowDay, getShowDayLeads,
  getProperties,
  type ShowDay, type ShowDayLead, type Property,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";

export default function ShowDaysPage() {
  const { user } = useAuth();
  const [showDays, setShowDays] = useState<ShowDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<ShowDay | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<ShowDayLead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ propertyAddress: "", date: "", timeSlot: "", notes: "", propertyId: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchShowDays = useCallback(async () => {
    try {
      const [dayData, propData] = await Promise.all([getShowDays(), getProperties()]);
      setShowDays(dayData);
      setProperties(propData);
    } catch (error) {
      console.error("Failed to fetch show days:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShowDays(); }, [fetchShowDays]);

  const handleCreate = async () => {
    if (!user || !form.propertyAddress || !form.date) return;
    setSaving(true);
    try {
      await addShowDay({
        propertyAddress: form.propertyAddress,
        propertyId: form.propertyId || undefined,
        date: form.date,
        timeSlot: form.timeSlot,
        notes: form.notes,
        ownerId: user.uid,
        active: true,
      });
      setForm({ propertyAddress: "", date: "", timeSlot: "", notes: "", propertyId: "" });
      setCreateOpen(false);
      fetchShowDays();
    } catch (error) {
      console.error("Failed to create show day:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this show day?")) return;
    await deleteShowDay(id);
    fetchShowDays();
  };

  const openDetail = async (day: ShowDay) => {
    setSelectedDay(day);
    setDetailOpen(true);
    try {
      const leads = await getShowDayLeads(day.id!);
      setSelectedLeads(leads);
    } catch {
      setSelectedLeads([]);
    }
  };

  const getFormUrl = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/showday/${id}`;
  };

  const getQrUrl = (id: string) => {
    const formUrl = getFormUrl(id);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formUrl)}`;
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(getFormUrl(id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = useMemo(() => {
    const active = showDays.filter((d) => d.active).length;
    const past = showDays.filter((d) => new Date(d.date) < new Date()).length;
    return { total: showDays.length, active, past };
  }, [showDays]);

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Show Days</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage open house events and capture buyer leads via QR code</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Show Day
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Events</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{stats.active}</p>
                </div>
                <Home className="h-5 w-5 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Past Events</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-muted-foreground">{stats.past}</p>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Show Days List */}
        {showDays.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Home className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] text-muted-foreground">No show days yet. Create one to get started!</p>
              <p className="text-[12px] text-muted-foreground mt-1">Buyers scan the QR code at the door to register their details.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {showDays.map((day) => (
              <Card key={day.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(day)}>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{day.propertyAddress}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(day.date), "EEEE, dd MMM yyyy")}
                        {day.timeSlot && ` · ${day.timeSlot}`}
                      </p>
                    </div>
                    <Badge variant={day.active ? "success" : "secondary"}>
                      {day.active ? "Active" : "Closed"}
                    </Badge>
                  </div>

                  {/* QR code preview */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getQrUrl(day.id!)}
                      alt="QR Code"
                      className="h-16 w-16 rounded"
                      width={64}
                      height={64}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Scan to register</p>
                      <p className="text-[10px] text-muted-foreground truncate">{getFormUrl(day.id!)}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); copyLink(day.id!); }}>
                          <Copy className="h-2.5 w-2.5 mr-1" /> {copied ? "Copied!" : "Copy Link"}
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); window.open(getQrUrl(day.id!), "_blank"); }}>
                          <QrCode className="h-2.5 w-2.5 mr-1" /> Print QR
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Registrations</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (day.id) handleDelete(day.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Show Day Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New Show Day</SheetTitle>
            <SheetDescription>Create an open house event with a QR code for lead capture</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            {properties.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Property Listing</Label>
                <Select value={form.propertyId || "none"} onValueChange={(v) => {
                  const pid = v === "none" ? "" : v;
                  const prop = properties.find((p) => p.id === pid);
                  setForm({
                    ...form,
                    propertyId: pid,
                    propertyAddress: prop ? `${prop.address}, ${prop.suburb}, ${prop.city}` : form.propertyAddress,
                  });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select a property..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Enter address manually —</SelectItem>
                    {properties.filter((p) => p.status === "active").map((p) => (
                      <SelectItem key={p.id} value={p.id!}>{p.address}, {p.suburb}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Property Address *</Label>
              <Input value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} placeholder="e.g. 12 Oak Avenue, Sandton" />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Input value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} placeholder="e.g. 10:00 – 14:00" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes for this show day" />
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving ? "Creating..." : "Create Show Day"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedDay?.propertyAddress}</SheetTitle>
            <SheetDescription>
              {selectedDay && format(new Date(selectedDay.date), "EEEE, dd MMM yyyy")}
              {selectedDay?.timeSlot && ` · ${selectedDay.timeSlot}`}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            {/* Large QR */}
            {selectedDay && (
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getQrUrl(selectedDay.id!)}
                  alt="QR Code"
                  className="h-48 w-48 rounded-lg"
                  width={192}
                  height={192}
                />
                <p className="text-xs text-muted-foreground">Buyers scan this code at the door to register</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyLink(selectedDay.id!)}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(getFormUrl(selectedDay.id!), "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Form
                  </Button>
                </div>
              </div>
            )}

            {/* Registrations */}
            <div>
              <h3 className="font-medium text-sm mb-3">Registrations ({selectedLeads.length})</h3>
              {selectedLeads.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No registrations yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/30">
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email} · {lead.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">
                          {lead.createdAt ? format(lead.createdAt.toDate(), "HH:mm") : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
