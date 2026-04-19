"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ForecastStage {
  stage: string;
  count: number;
  probability: number;
  totalValue: number;
  weightedValue: number;
}

interface ForecastChartProps {
  stages: ForecastStage[];
  wonRevenue: number;
  weightedPipeline: number;
  expectedClose: number;
}

export function ForecastChart({ stages, wonRevenue, weightedPipeline, expectedClose }: ForecastChartProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stages}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} width={55} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="totalValue" fill="#93c5fd" name="Total Value" radius={[4, 4, 0, 0]} />
            <Bar dataKey="weightedValue" fill="#3b82f6" name="Weighted Value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {stages.map((s) => (
          <div key={s.stage} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{s.stage}</span>
              <span className="text-muted-foreground ml-2">({s.count} deals, {(s.probability * 100).toFixed(0)}%)</span>
            </div>
            <span className="font-mono">{formatCurrency(s.weightedValue)}</span>
          </div>
        ))}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm"><span>Won Revenue</span><span className="font-mono font-semibold text-green-600">{formatCurrency(wonRevenue)}</span></div>
          <div className="flex justify-between text-sm"><span>Weighted Pipeline</span><span className="font-mono font-semibold text-blue-600">{formatCurrency(weightedPipeline)}</span></div>
          <div className="flex justify-between text-sm font-bold"><span>Expected Total</span><span className="font-mono">{formatCurrency(expectedClose)}</span></div>
        </div>
      </div>
    </div>
  );
}
