"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";

type RoiRow = { name: string; roi: number; revenue: number; cost: number };

export function LeadRoiChart({ data }: { data: RoiRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
        <Tooltip
          formatter={(value, name) => [
            name === "roi" ? `${value}%` : formatCurrency(Number(value)),
            name === "roi" ? "ROI" : name === "revenue" ? "Revenue" : "Cost",
          ]}
        />
        <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.roi >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
