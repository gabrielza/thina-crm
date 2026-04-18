"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import type { Lead } from "@/lib/firestore";

interface DashboardChartsProps {
  leads: Lead[];
}

const STATUS_ORDER: Lead["status"][] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
const STATUS_LABELS: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const PIPELINE_COLORS: Record<string, string> = {
  New: "#3b82f6",
  Contacted: "#8b5cf6",
  Qualified: "#10b981",
  Proposal: "#f59e0b",
  Won: "#22c55e",
  Lost: "#ef4444",
};

const SOURCE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0, notation: "compact" }).format(value);

export function DashboardCharts({ leads }: DashboardChartsProps) {
  // Pipeline funnel data
  const pipelineData = STATUS_ORDER.filter((s) => s !== "lost").map((status) => {
    const count = leads.filter((l) => l.status === status).length;
    const value = leads.filter((l) => l.status === status).reduce((sum, l) => sum + (l.value || 0), 0);
    return {
      name: STATUS_LABELS[status],
      count,
      value,
      fill: PIPELINE_COLORS[STATUS_LABELS[status]],
    };
  });

  // Status distribution for donut
  const statusData = STATUS_ORDER.map((status) => ({
    name: STATUS_LABELS[status],
    value: leads.filter((l) => l.status === status).length,
    fill: PIPELINE_COLORS[STATUS_LABELS[status]],
  })).filter((d) => d.value > 0);

  // Revenue by source
  const sourceMap = new Map<string, { total: number; won: number; count: number }>();
  leads.forEach((lead) => {
    const source = lead.source || "Unknown";
    const current = sourceMap.get(source) || { total: 0, won: 0, count: 0 };
    current.total += lead.value || 0;
    current.count += 1;
    if (lead.status === "won") current.won += lead.value || 0;
    sourceMap.set(source, current);
  });
  const sourceData = Array.from(sourceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  // Value by status (bar chart)
  const valueByStatus = STATUS_ORDER.map((status) => ({
    name: STATUS_LABELS[status],
    value: leads.filter((l) => l.status === status).reduce((sum, l) => sum + (l.value || 0), 0),
    fill: PIPELINE_COLORS[STATUS_LABELS[status]],
  }));

  // Top deals
  const topDeals = [...leads]
    .filter((l) => l.status !== "lost")
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5);

  const fullFormatCurrency = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);

  return (
    <>
      {/* Row 1: Pipeline Funnel + Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Pipeline</CardTitle>
            <CardDescription>Lead progression through stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip formatter={(value) => [value, "Leads"]} />
                <Funnel dataKey="count" data={pipelineData} isAnimationActive>
                  <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="count" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Distribution</CardTitle>
            <CardDescription>Breakdown by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue by Status + Revenue by Source */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Deal Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal Value by Stage</CardTitle>
            <CardDescription>Total value at each pipeline stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [fullFormatCurrency(Number(value)), "Value"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {valueByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Source</CardTitle>
            <CardDescription>Where your best leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  formatter={(value, name) => [
                    fullFormatCurrency(Number(value)),
                    name === "total" ? "Total Value" : "Won Revenue",
                  ]}
                />
                <Legend />
                <Bar dataKey="total" name="Total Value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="won" name="Won Revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Deals + Conversion Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Deals</CardTitle>
            <CardDescription>Highest value active opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDeals.map((lead, i) => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{fullFormatCurrency(lead.value || 0)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{lead.status}</p>
                  </div>
                </div>
              ))}
              {topDeals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No active deals yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Insights</CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(() => {
                const total = leads.length;
                const won = leads.filter((l) => l.status === "won").length;
                const lost = leads.filter((l) => l.status === "lost").length;
                const active = total - won - lost;
                const avgDealSize = won > 0
                  ? leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.value || 0), 0) / won
                  : 0;
                const avgPipelineDeal = active > 0
                  ? leads.filter((l) => !["won", "lost"].includes(l.status)).reduce((s, l) => s + (l.value || 0), 0) / active
                  : 0;
                const winRate = won + lost > 0 ? ((won / (won + lost)) * 100).toFixed(1) : "0";

                const metrics = [
                  { label: "Win Rate", value: `${winRate}%`, sub: `${won} won / ${won + lost} decided` },
                  { label: "Avg Won Deal", value: fullFormatCurrency(avgDealSize), sub: `From ${won} closed deals` },
                  { label: "Avg Pipeline Deal", value: fullFormatCurrency(avgPipelineDeal), sub: `From ${active} active leads` },
                  { label: "Active Pipeline", value: active.toString(), sub: `${total} total / ${lost} lost` },
                ];

                return metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </div>
                    <p className="text-lg font-bold">{m.value}</p>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
