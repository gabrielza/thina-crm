"use client";

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Building2, Plus, Search, Pencil, Trash2, Home, Calendar, AlertTriangle,
} from "lucide-react";
import {
  getProperties, addProperty, updateProperty, deleteProperty,
  type Property, type MandateType,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format, differenceInDays } from "date-fns";

const PROPERTY_TYPES: Property["propertyType"][] = ["house", "apartment", "townhouse", "land", "commercial", "farm"];
const MANDATE_TYPES: MandateType[] = ["sole", "open", "dual", "auction"];
const STATUS_OPTIONS: Property["status"][] = ["active", "under_offer", "sold", "withdrawn", "expired"];

const statusColors: Record<Property["status"], "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  active: "success", under_offer: "warning", sold: "secondary", withdrawn: "destructive", expired: "outline",
};

const emptyForm = {
  address: "", suburb: "", city: "", province: "Gauteng",
  propertyType: "house" as Property["propertyType"],
  bedrooms: 3, bathrooms: 2, garages: 1, erfSize: 0, floorSize: 0,
  askingPrice: 0, mandateType: "sole" as MandateType,
  mandateStart: new Date().toISOString().split("T")[0],
  mandateEnd: "", status: "active" as Property["status"],
  description: "", features: [] as string[], featureInput: "",
  sellerName: "", sellerPhone: "", sellerEmail: "",
};

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const s = deferredSearch.toLowerCase();
    return properties.filter((p) =>
      p.address.toLowerCase().includes(s) ||
      p.suburb.toLowerCase().includes(s) ||
      p.city.toLowerCase().includes(s) ||
      p.sellerName.toLowerCase().includes(s)
    );
  }, [properties, deferredSearch]);

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter((p) => p.status === "active").length,
    totalValue: properties.filter((p) => p.status === "active").reduce((s, p) => s + p.askingPrice, 0),
    expiringSoon: properties.filter((p) => p.status === "active" && p.mandateEnd && differenceInDays(new Date(p.mandateEnd), new Date()) <= 30 && differenceInDays(new Date(p.mandateEnd), new Date()) >= 0).length,
  }), [properties]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (prop: Property) => {
    setEditId(prop.id!);
    setForm({
      ...prop,
      featureInput: "",
      province: prop.province || "Gauteng",
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.address) return;
    setSaving(true);
    try {
      const { featureInput, ...data } = form;
      if (editId) {
        await updateProperty(editId, data);
      } else {
        await addProperty({ ...data, ownerId: user.uid });
      }
      setSheetOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save property:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property?")) return;
    await deleteProperty(id);
    fetchData();
  };

  const addFeature = () => {
    if (form.featureInput.trim()) {
      setForm({ ...form, features: [...form.features, form.featureInput.trim()], featureInput: "" });
    }
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Properties</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Manage listings and mandate tracking</p>
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Property</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="pt-5"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Listings</p><p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active</p><p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{stats.active}</p></div><Building2 className="h-5 w-5 text-green-600/50" /></div></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Portfolio Value</p><p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(stats.totalValue)}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Expiring Soon</p><p className="text-2xl font-semibold tabular-nums mt-1 text-amber-600">{stats.expiringSoon}</p></div><AlertTriangle className={`h-5 w-5 ${stats.expiringSoon > 0 ? "text-amber-600/50" : "text-muted-foreground/50"}`} /></div></CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center"><p className="text-[13px] text-muted-foreground">{properties.length === 0 ? "No properties yet. Add one to get started!" : "No properties match your search."}</p></CardContent></Card>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Mandate</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((prop) => {
                  const daysToExpiry = prop.mandateEnd ? differenceInDays(new Date(prop.mandateEnd), new Date()) : null;
                  return (
                    <TableRow key={prop.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[13px]">{prop.address}</p>
                          <p className="text-[11px] text-muted-foreground">{prop.suburb}, {prop.city}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-[13px]">{prop.propertyType}</TableCell>
                      <TableCell className="font-mono text-[13px]">{formatCurrency(prop.askingPrice)}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-[10px]">{prop.mandateType}</Badge></TableCell>
                      <TableCell>
                        {prop.mandateEnd ? (
                          <span className={`text-[13px] ${daysToExpiry !== null && daysToExpiry <= 30 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                            {format(new Date(prop.mandateEnd), "dd MMM yyyy")}
                            {daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0 && ` (${daysToExpiry}d)`}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell><Badge variant={statusColors[prop.status]} className="capitalize text-[10px]">{prop.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(prop)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => prop.id && handleDelete(prop.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Property Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editId ? "Edit Property" : "Add Property"}</SheetTitle>
            <SheetDescription>Listing details and mandate information</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2"><Label>Address *</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 12 Oak Avenue" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Suburb</Label><Input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} placeholder="e.g. Sandton" /></div>
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Johannesburg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={form.propertyType} onValueChange={(v) => setForm({ ...form, propertyType: v as Property["propertyType"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Asking Price</Label><Input type="number" value={form.askingPrice || ""} onChange={(e) => setForm({ ...form, askingPrice: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Beds</Label><Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Baths</Label><Input type="number" min={0} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Garages</Label><Input type="number" min={0} value={form.garages} onChange={(e) => setForm({ ...form, garages: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Erf Size (sqm)</Label><Input type="number" value={form.erfSize || ""} onChange={(e) => setForm({ ...form, erfSize: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Floor Size (sqm)</Label><Input type="number" value={form.floorSize || ""} onChange={(e) => setForm({ ...form, floorSize: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mandate Type</Label>
                <Select value={form.mandateType} onValueChange={(v) => setForm({ ...form, mandateType: v as MandateType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MANDATE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Property["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Mandate Start</Label><Input type="date" value={form.mandateStart} onChange={(e) => setForm({ ...form, mandateStart: e.target.value })} /></div>
              <div className="space-y-2"><Label>Mandate End</Label><Input type="date" value={form.mandateEnd} onChange={(e) => setForm({ ...form, mandateEnd: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Property description" /></div>
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input value={form.featureInput} onChange={(e) => setForm({ ...form, featureInput: e.target.value })} placeholder="e.g. Pool, Garden" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} />
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, features: form.features.filter((_, j) => j !== i) })}>{f} ×</Badge>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seller Details</p>
              <div className="space-y-2"><Label>Seller Name</Label><Input value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Phone</Label><Input value={form.sellerPhone} onChange={(e) => setForm({ ...form, sellerPhone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={form.sellerEmail} onChange={(e) => setForm({ ...form, sellerEmail: e.target.value })} /></div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : editId ? "Update Property" : "Add Property"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
