"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { DollarSign, TrendingUp, Target, Plus, Trash2 } from "lucide-react";
import { getLeads, type Lead } from "@/lib/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SourceCost {
  source: string;
  monthlyCost: number;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#14b8a6"];

export default function LeadRoiPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceCosts, setSourceCosts] = useState<SourceCost[]>([]);
  const [costOpen, setCostOpen] = useState(false);
  const [costForm, setCostForm] = useState({ source: "", monthlyCost: 0 });

  const fetchData = useCallback(async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load costs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("thina-source-costs");
    if (saved) setSourceCosts(JSON.parse(saved));
  }, []);

  const saveCosts = (costs: SourceCost[]) => {
    setSourceCosts(costs);
    localStorage.setItem("thina-source-costs", JSON.stringify(costs));
  };

  const roiData = useMemo(() => {
    const sources = new Map<string, { total: number; won: number; wonValue: number; lost: number; open: number }>();

    leads.forEach((lead) => {
      const src = lead.source || "Unknown";
      const entry = sources.get(src) || { total: 0, won: 0, wonValue: 0, lost: 0, open: 0 };
      entry.total++;
      if (lead.status === "won") { entry.won++; entry.wonValue += lead.value || 0; }
      else if (lead.status === "lost") entry.lost++;
      else entry.open++;
      sources.set(src, entry);
    });

    return Array.from(sources.entries()).map(([source, data]) => {
      const costEntry = sourceCosts.find((c) => c.source.toLowerCase() === source.toLowerCase());
      const monthlyCost = costEntry?.monthlyCost || 0;
      const annualCost = monthlyCost * 12;
      const costPerLead = data.total > 0 && monthlyCost > 0 ? annualCost / data.total : 0;
      const costPerDeal = data.won > 0 && monthlyCost > 0 ? annualCost / data.won : 0;
      const roi = annualCost > 0 ? ((data.wonValue - annualCost) / annualCost) * 100 : 0;
      const conversionRate = data.total > 0 ? (data.won / data.total) * 100 : 0;

      return {
        source, ...data, monthlyCost, annualCost, costPerLead, costPerDeal, roi, conversionRate,
      };
    }).sort((a, b) => b.wonValue - a.wonValue);
  }, [leads, sourceCosts]);

  const totals = useMemo(() => ({
    leads: roiData.reduce((s, d) => s + d.total, 0),
    won: roiData.reduce((s, d) => s + d.won, 0),
    revenue: roiData.reduce((s, d) => s + d.wonValue, 0),
    spend: roiData.reduce((s, d) => s + d.annualCost, 0),
  }), [roiData]);

  const chartData = useMemo(() =>
    roiData.filter((d) => d.annualCost > 0).map((d) => ({
      name: d.source,
      roi: parseFloat(d.roi.toFixed(0)),
      revenue: d.wonValue,
      cost: d.annualCost,
    })),
  [roiData]);

  const addCost = () => {
    if (!costForm.source || costForm.monthlyCost <= 0) return;
    const existing = sourceCosts.findIndex((c) => c.source.toLowerCase() === costForm.source.toLowerCase());
    if (existing >= 0) {
      const updated = [...sourceCosts];
      updated[existing] = costForm;
      saveCosts(updated);
    } else {
      saveCosts([...sourceCosts, costForm]);
    }
    setCostForm({ source: "", monthlyCost: 0 });
    setCostOpen(false);
  };

  const deleteCost = (source: string) => {
    saveCosts(sourceCosts.filter((c) => c.source !== source));
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Lead Source ROI</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Track cost-per-lead and return on investment by source</p>
          </div>
          <Button size="sm" onClick={() => setCostOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Set Source Cost
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{totals.leads}</p>
                </div>
                <Target className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Won Revenue</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(totals.revenue)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Annual Spend</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(totals.spend)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Overall ROI</p>
                  <p className={`text-2xl font-semibold tabular-nums mt-1 font-mono ${totals.spend > 0 ? (((totals.revenue - totals.spend) / totals.spend) > 0 ? "text-green-600" : "text-red-600") : ""}`}>
                    {totals.spend > 0 ? `${(((totals.revenue - totals.spend) / totals.spend) * 100).toFixed(0)}%` : "—"}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ROI by Source</CardTitle>
              <CardDescription>Return on investment percentage for sources with tracked costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value, name) => [
                    name === "roi" ? `${value}%` : formatCurrency(Number(value)),
                    name === "roi" ? "ROI" : name === "revenue" ? "Revenue" : "Cost",
                  ]} />
                  <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.roi >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Source costs table */}
        {sourceCosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Source Costs</CardTitle>
              <CardDescription>Monthly spend per lead source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sourceCosts.map((cost) => (
                  <div key={cost.source} className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5">
                    <span className="text-sm font-medium">{cost.source}</span>
                    <span className="text-sm text-muted-foreground font-mono">{formatCurrency(cost.monthlyCost)}/mo</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteCost(cost.source)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROI Table */}
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost/Lead</TableHead>
                <TableHead className="text-right">Cost/Deal</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roiData.map((row, i) => (
                <TableRow key={row.source}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium text-[13px]">{row.source}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">{row.total}</TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">{row.won}</TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">{row.conversionRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-right text-[13px] font-mono">{formatCurrency(row.wonValue)}</TableCell>
                  <TableCell className="text-right text-[13px] font-mono text-muted-foreground">{row.costPerLead > 0 ? formatCurrency(row.costPerLead) : "—"}</TableCell>
                  <TableCell className="text-right text-[13px] font-mono text-muted-foreground">{row.costPerDeal > 0 ? formatCurrency(row.costPerDeal) : "—"}</TableCell>
                  <TableCell className="text-right">
                    {row.annualCost > 0 ? (
                      <Badge variant={row.roi >= 0 ? "success" : "destructive"}>{row.roi.toFixed(0)}%</Badge>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {roiData.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No leads yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Set Source Cost Sheet */}
      <Sheet open={costOpen} onOpenChange={setCostOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Set Source Cost</SheetTitle>
            <SheetDescription>Track how much you spend on each lead source per month</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Source Name *</Label>
              <Input value={costForm.source} onChange={(e) => setCostForm({ ...costForm, source: e.target.value })} placeholder="e.g. Property24, Private Property, Facebook Ads" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Cost (ZAR) *</Label>
              <Input type="number" min={0} value={costForm.monthlyCost || ""} onChange={(e) => setCostForm({ ...costForm, monthlyCost: parseFloat(e.target.value) || 0 })} placeholder="e.g. 5000" />
            </div>
            <Button onClick={addCost} className="w-full">Save Cost</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
