"use client";

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileBarChart, Plus, Search, Pencil, Trash2, TrendingUp, BarChart3, Target,
} from "lucide-react";
import {
  getCmaReports, addCmaReport, updateCmaReport, deleteCmaReport,
  type CmaReport, type CmaComparable, type Property,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";

const PROPERTY_TYPES: Property["propertyType"][] = ["house", "apartment", "townhouse", "land", "commercial", "farm"];
const STATUS_OPTIONS: CmaReport["status"][] = ["draft", "final", "presented"];
const CONFIDENCE_OPTIONS: CmaReport["confidenceLevel"][] = ["low", "medium", "high"];

const statusColors: Record<CmaReport["status"], "secondary" | "success" | "warning"> = {
  draft: "secondary",
  final: "success",
  presented: "warning",
};

const confidenceColors: Record<CmaReport["confidenceLevel"], "destructive" | "warning" | "success"> = {
  low: "destructive",
  medium: "warning",
  high: "success",
};

const emptyComparable: CmaComparable = {
  address: "", suburb: "", salePrice: 0, saleDate: new Date().toISOString().split("T")[0],
  bedrooms: 3, bathrooms: 2, erfSize: 0, floorSize: 0,
  propertyType: "house", daysOnMarket: 0, notes: "",
};

const emptyForm = {
  title: "", subjectAddress: "", subjectSuburb: "", subjectCity: "",
  subjectType: "house" as Property["propertyType"],
  subjectBedrooms: 3, subjectBathrooms: 2, subjectErfSize: 0, subjectFloorSize: 0,
  comparables: [{ ...emptyComparable }] as CmaComparable[],
  estimatedValue: 0, pricePerSqm: 0,
  confidenceLevel: "medium" as CmaReport["confidenceLevel"],
  status: "draft" as CmaReport["status"],
  contactName: "", notes: "",
};

export default function CmaPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CmaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const data = await getCmaReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch CMA reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const s = deferredSearch.toLowerCase();
    return reports.filter((r) =>
      r.title.toLowerCase().includes(s) ||
      r.subjectAddress.toLowerCase().includes(s) ||
      r.subjectSuburb.toLowerCase().includes(s) ||
      r.contactName?.toLowerCase().includes(s)
    );
  }, [reports, deferredSearch]);

  // KPIs
  const totalReports = reports.length;
  const avgValue = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.estimatedValue, 0) / reports.length
    : 0;
  const avgPricePerSqm = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.pricePerSqm, 0) / reports.length
    : 0;
  const finalReports = reports.filter((r) => r.status === "final" || r.status === "presented").length;

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  }

  function openEdit(report: CmaReport) {
    setEditId(report.id!);
    setForm({
      title: report.title,
      subjectAddress: report.subjectAddress,
      subjectSuburb: report.subjectSuburb,
      subjectCity: report.subjectCity,
      subjectType: report.subjectType,
      subjectBedrooms: report.subjectBedrooms,
      subjectBathrooms: report.subjectBathrooms,
      subjectErfSize: report.subjectErfSize,
      subjectFloorSize: report.subjectFloorSize,
      comparables: report.comparables.length > 0 ? report.comparables : [{ ...emptyComparable }],
      estimatedValue: report.estimatedValue,
      pricePerSqm: report.pricePerSqm,
      confidenceLevel: report.confidenceLevel,
      status: report.status,
      contactName: report.contactName || "",
      notes: report.notes || "",
    });
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title || `CMA - ${form.subjectAddress}`,
        subjectAddress: form.subjectAddress,
        subjectSuburb: form.subjectSuburb,
        subjectCity: form.subjectCity,
        subjectType: form.subjectType,
        subjectBedrooms: form.subjectBedrooms,
        subjectBathrooms: form.subjectBathrooms,
        subjectErfSize: form.subjectErfSize,
        subjectFloorSize: form.subjectFloorSize,
        comparables: form.comparables,
        estimatedValue: form.estimatedValue,
        pricePerSqm: form.pricePerSqm,
        confidenceLevel: form.confidenceLevel,
        status: form.status,
        contactName: form.contactName,
        notes: form.notes,
        ownerId: user.uid,
      };
      if (editId) {
        await updateCmaReport(editId, payload);
      } else {
        await addCmaReport(payload);
      }
      setSheetOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save CMA report:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCmaReport(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete CMA report:", error);
    }
  }

  function addComparable() {
    setForm((f) => ({ ...f, comparables: [...f.comparables, { ...emptyComparable }] }));
  }

  function removeComparable(index: number) {
    setForm((f) => ({
      ...f,
      comparables: f.comparables.filter((_, i) => i !== index),
    }));
  }

  function updateComparable(index: number, field: keyof CmaComparable, value: string | number) {
    setForm((f) => ({
      ...f,
      comparables: f.comparables.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  }

  function recalculate() {
    const comps = form.comparables.filter((c) => c.salePrice > 0);
    if (comps.length === 0) return;
    const avgPrice = comps.reduce((sum, c) => sum + c.salePrice, 0) / comps.length;
    const avgSqm = comps
      .filter((c) => c.floorSize > 0)
      .reduce((sum, c, _, arr) => sum + c.salePrice / c.floorSize / arr.length, 0);
    const estimated = form.subjectFloorSize > 0 ? avgSqm * form.subjectFloorSize : avgPrice;
    setForm((f) => ({
      ...f,
      estimatedValue: Math.round(estimated),
      pricePerSqm: Math.round(avgSqm),
      confidenceLevel: comps.length >= 5 ? "high" : comps.length >= 3 ? "medium" : "low",
    }));
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileBarChart className="h-6 w-6" /> CMA Reports
            </h1>
            <p className="text-muted-foreground">Comparative Market Analysis for property valuations</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New CMA Report</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalReports}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg. Valuation</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{formatCurrency(avgValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg. R/m²</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{formatCurrency(avgPricePerSqm)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Finalised</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <p className="text-2xl font-bold">{finalReports}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Suburb</TableHead>
                  <TableHead className="text-right">Estimated Value</TableHead>
                  <TableHead className="text-right">R/m²</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Comps</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No CMA reports found</TableCell></TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.subjectAddress}</TableCell>
                      <TableCell>{r.subjectSuburb}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.estimatedValue)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(r.pricePerSqm)}</TableCell>
                      <TableCell><Badge variant={confidenceColors[r.confidenceLevel]}>{r.confidenceLevel}</Badge></TableCell>
                      <TableCell><Badge variant={statusColors[r.status]}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">{r.comparables.length}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.id!)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* CMA Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editId ? "Edit CMA Report" : "New CMA Report"}</SheetTitle>
            <SheetDescription>
              {editId ? "Update your comparative market analysis." : "Create a new comparative market analysis report."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Report Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Report Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. CMA - 12 Main Rd, Sandton" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CmaReport["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Subject Property */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Subject Property</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Address</Label><Input value={form.subjectAddress} onChange={(e) => setForm({ ...form, subjectAddress: e.target.value })} /></div>
                <div><Label>Suburb</Label><Input value={form.subjectSuburb} onChange={(e) => setForm({ ...form, subjectSuburb: e.target.value })} /></div>
                <div><Label>City</Label><Input value={form.subjectCity} onChange={(e) => setForm({ ...form, subjectCity: e.target.value })} /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.subjectType} onValueChange={(v) => setForm({ ...form, subjectType: v as Property["propertyType"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Bedrooms</Label><Input type="number" value={form.subjectBedrooms} onChange={(e) => setForm({ ...form, subjectBedrooms: +e.target.value })} /></div>
                <div><Label>Bathrooms</Label><Input type="number" value={form.subjectBathrooms} onChange={(e) => setForm({ ...form, subjectBathrooms: +e.target.value })} /></div>
                <div><Label>Erf Size (m²)</Label><Input type="number" value={form.subjectErfSize} onChange={(e) => setForm({ ...form, subjectErfSize: +e.target.value })} /></div>
                <div><Label>Floor Size (m²)</Label><Input type="number" value={form.subjectFloorSize} onChange={(e) => setForm({ ...form, subjectFloorSize: +e.target.value })} /></div>
              </div>
            </div>

            {/* Comparables */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Comparable Sales</h3>
                <Button size="sm" variant="outline" onClick={addComparable}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
              {form.comparables.map((comp, idx) => (
                <Card key={idx} className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Comparable {idx + 1}</span>
                    {form.comparables.length > 1 && (
                      <Button size="sm" variant="ghost" className="text-destructive h-6 px-2" onClick={() => removeComparable(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2"><Label className="text-xs">Address</Label><Input className="h-8 text-sm" value={comp.address} onChange={(e) => updateComparable(idx, "address", e.target.value)} /></div>
                    <div><Label className="text-xs">Suburb</Label><Input className="h-8 text-sm" value={comp.suburb} onChange={(e) => updateComparable(idx, "suburb", e.target.value)} /></div>
                    <div><Label className="text-xs">Sale Price</Label><Input className="h-8 text-sm" type="number" value={comp.salePrice} onChange={(e) => updateComparable(idx, "salePrice", +e.target.value)} /></div>
                    <div><Label className="text-xs">Sale Date</Label><Input className="h-8 text-sm" type="date" value={comp.saleDate} onChange={(e) => updateComparable(idx, "saleDate", e.target.value)} /></div>
                    <div><Label className="text-xs">Beds</Label><Input className="h-8 text-sm" type="number" value={comp.bedrooms} onChange={(e) => updateComparable(idx, "bedrooms", +e.target.value)} /></div>
                    <div><Label className="text-xs">Baths</Label><Input className="h-8 text-sm" type="number" value={comp.bathrooms} onChange={(e) => updateComparable(idx, "bathrooms", +e.target.value)} /></div>
                    <div><Label className="text-xs">Floor (m²)</Label><Input className="h-8 text-sm" type="number" value={comp.floorSize} onChange={(e) => updateComparable(idx, "floorSize", +e.target.value)} /></div>
                    <div><Label className="text-xs">Erf (m²)</Label><Input className="h-8 text-sm" type="number" value={comp.erfSize} onChange={(e) => updateComparable(idx, "erfSize", +e.target.value)} /></div>
                    <div><Label className="text-xs">Days on Market</Label><Input className="h-8 text-sm" type="number" value={comp.daysOnMarket} onChange={(e) => updateComparable(idx, "daysOnMarket", +e.target.value)} /></div>
                    <div><Label className="text-xs">Notes</Label><Input className="h-8 text-sm" value={comp.notes} onChange={(e) => updateComparable(idx, "notes", e.target.value)} /></div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Valuation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Valuation</h3>
                <Button size="sm" variant="outline" onClick={recalculate}><BarChart3 className="h-3 w-3 mr-1" /> Auto-calculate</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Estimated Value (R)</Label><Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: +e.target.value })} /></div>
                <div><Label>Price/m² (R)</Label><Input type="number" value={form.pricePerSqm} onChange={(e) => setForm({ ...form, pricePerSqm: +e.target.value })} /></div>
                <div>
                  <Label>Confidence</Label>
                  <Select value={form.confidenceLevel} onValueChange={(v) => setForm({ ...form, confidenceLevel: v as CmaReport["confidenceLevel"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONFIDENCE_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes or observations..."
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving || !form.subjectAddress}>
              {saving ? "Saving..." : editId ? "Update Report" : "Create Report"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
