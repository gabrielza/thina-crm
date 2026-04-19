"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  UserSearch, Plus, Trash2, CheckCircle2, Home, Users,
} from "lucide-react";
import {
  getBuyerProfiles, addBuyerProfile, updateBuyerProfile, deleteBuyerProfile,
  getProperties, getContacts,
  type BuyerProfile, type Property, type Contact,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";

const PROPERTY_TYPES: Property["propertyType"][] = ["house", "apartment", "townhouse", "land", "commercial", "farm"];

export default function BuyerMatchPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<BuyerProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contactId: "", contactName: "",
    minBudget: 0, maxBudget: 0,
    areas: [] as string[], areaInput: "",
    propertyTypes: [] as Property["propertyType"][],
    minBedrooms: 0, minBathrooms: 0,
    features: [] as string[], featureInput: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [bp, p, c] = await Promise.all([getBuyerProfiles(), getProperties(), getContacts()]);
      setProfiles(bp);
      setProperties(p);
      setContacts(c);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Matching Algorithm ───────────────────────────────
  const matches = useMemo(() => {
    const activeProps = properties.filter((p) => p.status === "active");
    return profiles.filter((p) => p.active).map((profile) => {
      const matched = activeProps.filter((prop) => {
        const inBudget = prop.askingPrice >= profile.minBudget && prop.askingPrice <= profile.maxBudget;
        const inArea = profile.areas.length === 0 || profile.areas.some((a) =>
          prop.suburb.toLowerCase().includes(a.toLowerCase()) || prop.city.toLowerCase().includes(a.toLowerCase())
        );
        const rightType = profile.propertyTypes.length === 0 || profile.propertyTypes.includes(prop.propertyType);
        const enoughBeds = prop.bedrooms >= profile.minBedrooms;
        const enoughBaths = prop.bathrooms >= profile.minBathrooms;
        return inBudget && inArea && rightType && enoughBeds && enoughBaths;
      });
      return { profile, matches: matched };
    });
  }, [profiles, properties]);

  const totalMatches = matches.reduce((s, m) => s + m.matches.length, 0);

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setForm({ ...form, contactId: contact.id!, contactName: contact.name });
    }
  };

  const handleCreate = async () => {
    if (!user || !form.contactId) return;
    setSaving(true);
    try {
      const { areaInput, featureInput, ...data } = form;
      await addBuyerProfile({ ...data, active: true, ownerId: user.uid });
      setForm({
        contactId: "", contactName: "", minBudget: 0, maxBudget: 0,
        areas: [], areaInput: "", propertyTypes: [], minBedrooms: 0, minBathrooms: 0,
        features: [], featureInput: "", notes: "",
      });
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this buyer profile?")) return;
    await deleteBuyerProfile(id);
    fetchData();
  };

  const addArea = () => {
    if (form.areaInput.trim()) {
      setForm({ ...form, areas: [...form.areas, form.areaInput.trim()], areaInput: "" });
    }
  };

  const addFeature = () => {
    if (form.featureInput.trim()) {
      setForm({ ...form, features: [...form.features, form.featureInput.trim()], featureInput: "" });
    }
  };

  const togglePropertyType = (type: Property["propertyType"]) => {
    setForm({
      ...form,
      propertyTypes: form.propertyTypes.includes(type)
        ? form.propertyTypes.filter((t) => t !== type)
        : [...form.propertyTypes, type],
    });
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Buyer-Property Matching</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Match buyer profiles to available listings</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Buyer Profile
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-3">
          <Card><CardContent className="pt-5"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Buyer Profiles</p><p className="text-2xl font-semibold tabular-nums mt-1">{profiles.length}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active Listings</p><p className="text-2xl font-semibold tabular-nums mt-1">{properties.filter((p) => p.status === "active").length}</p></div><Home className="h-5 w-5 text-muted-foreground/50" /></div></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Matches</p><p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{totalMatches}</p></div><CheckCircle2 className="h-5 w-5 text-green-600/50" /></div></CardContent></Card>
        </div>

        {/* Matches */}
        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <UserSearch className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] text-muted-foreground">No buyer profiles yet. Create one to start matching buyers to listings!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map(({ profile, matches: matchedProps }) => (
              <Card key={profile.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary text-xs font-semibold">{profile.contactName.charAt(0)}</div>
                        <div>
                          <h3 className="font-medium text-sm">{profile.contactName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(profile.minBudget)} – {formatCurrency(profile.maxBudget)}
                            {profile.minBedrooms > 0 && ` · ${profile.minBedrooms}+ beds`}
                            {profile.areas.length > 0 && ` · ${profile.areas.join(", ")}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={matchedProps.length > 0 ? "success" : "outline"}>
                        {matchedProps.length} match{matchedProps.length !== 1 ? "es" : ""}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => profile.id && handleDelete(profile.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {matchedProps.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-border/30">
                      {matchedProps.map((prop) => (
                        <div key={prop.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">{prop.address}</p>
                            <p className="text-xs text-muted-foreground">{prop.suburb}, {prop.city} · {prop.bedrooms} bed · {prop.bathrooms} bath</p>
                          </div>
                          <p className="font-mono text-sm font-semibold">{formatCurrency(prop.askingPrice)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedProps.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2 italic">No matching properties currently available.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Buyer Profile Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Buyer Profile</SheetTitle>
            <SheetDescription>Define buyer requirements to match against listings</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.contactId}
                onChange={(e) => handleContactSelect(e.target.value)}
              >
                <option value="">Select a contact...</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Min Budget</Label><Input type="number" value={form.minBudget || ""} onChange={(e) => setForm({ ...form, minBudget: parseFloat(e.target.value) || 0 })} placeholder="e.g. 1500000" /></div>
              <div className="space-y-2"><Label>Max Budget</Label><Input type="number" value={form.maxBudget || ""} onChange={(e) => setForm({ ...form, maxBudget: parseFloat(e.target.value) || 0 })} placeholder="e.g. 2500000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Min Bedrooms</Label><Input type="number" min={0} value={form.minBedrooms} onChange={(e) => setForm({ ...form, minBedrooms: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Min Bathrooms</Label><Input type="number" min={0} value={form.minBathrooms} onChange={(e) => setForm({ ...form, minBathrooms: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Property Types</Label>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={form.propertyTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => togglePropertyType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred Areas</Label>
              <div className="flex gap-2">
                <Input value={form.areaInput} onChange={(e) => setForm({ ...form, areaInput: e.target.value })} placeholder="e.g. Sandton, Midrand" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArea())} />
                <Button type="button" variant="outline" size="sm" onClick={addArea}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.areas.map((a, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, areas: form.areas.filter((_, j) => j !== i) })}>{a} ×</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Must-Have Features</Label>
              <div className="flex gap-2">
                <Input value={form.featureInput} onChange={(e) => setForm({ ...form, featureInput: e.target.value })} placeholder="e.g. Pool, Garden, Security" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} />
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, features: form.features.filter((_, j) => j !== i) })}>{f} ×</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional requirements" /></div>
            <Button onClick={handleCreate} disabled={saving || !form.contactId} className="w-full">{saving ? "Creating..." : "Create Profile"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
