"use client";

import { Users, UserCheck, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Total Leads",
    value: "0",
    description: "All leads in pipeline",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Qualified",
    value: "0",
    description: "Ready for proposal",
    icon: UserCheck,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Conversion Rate",
    value: "0%",
    description: "Won / Total leads",
    icon: TrendingUp,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Follow-ups Due",
    value: "0",
    description: "Needs attention today",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

export function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`rounded-md p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
