"use client";

import { useMemo } from "react";
import { Users, UserCheck, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Lead } from "@/lib/firestore";

interface DashboardCardsProps {
  leads: Lead[];
}

export function DashboardCards({ leads }: DashboardCardsProps) {
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.status)).length;
    const wonLeads = leads.filter((l) => l.status === "won").length;
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";
    const totalPipelineValue = leads
      .filter((l) => !["won", "lost"].includes(l.status))
      .reduce((sum, l) => sum + (l.value || 0), 0);
    const wonRevenue = leads
      .filter((l) => l.status === "won")
      .reduce((sum, l) => sum + (l.value || 0), 0);

    return [
      {
        title: "Total Leads",
        value: totalLeads.toString(),
        description: `${activeLeads} active in pipeline`,
        icon: Users,
        color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Won Deals",
      value: wonLeads.toString(),
      description: `${conversionRate}% conversion rate`,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Won Revenue",
      value: formatCurrency(wonRevenue),
      description: "Total closed revenue",
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(totalPipelineValue),
      description: "Active deal value",
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];
  }, [leads]);

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">{stat.value}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
