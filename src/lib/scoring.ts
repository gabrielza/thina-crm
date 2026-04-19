import type { Lead, Activity, Task, Transaction, TransactionStage, CommissionSplit } from "./firestore";

/**
 * Lead scoring algorithm — scores leads from 0–100 based on:
 * - Deal value (up to 25 pts)
 * - Pipeline stage (up to 25 pts)
 * - Activity engagement (up to 25 pts)
 * - Task completion (up to 15 pts)
 * - Data completeness (up to 10 pts)
 */

const STAGE_SCORES: Record<Lead["status"], number> = {
  new: 5,
  contacted: 10,
  qualified: 15,
  proposal: 22,
  won: 25,
  lost: 0,
};

export function calculateLeadScore(
  lead: Lead,
  activities: Activity[],
  tasks: Task[]
): number {
  let score = 0;

  // 1. Deal Value (0–25 pts): higher value = higher score (log scale, capped at R1M)
  if (lead.value > 0) {
    const valueScore = Math.min(25, Math.round((Math.log10(lead.value + 1) / 6) * 25));
    score += valueScore;
  }

  // 2. Pipeline Stage (0–25 pts)
  score += STAGE_SCORES[lead.status] || 0;

  // 3. Activity Engagement (0–25 pts): more recent activities = higher score
  const activityCount = activities.length;
  if (activityCount > 0) {
    const activityScore = Math.min(25, activityCount * 5);
    score += activityScore;

    // Bonus for activity diversity
    const types = new Set(activities.map((a) => a.type));
    if (types.size >= 3) score += 3;
  }

  // 4. Task Completion (0–15 pts)
  if (tasks.length > 0) {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const completionRate = completed / tasks.length;
    score += Math.round(completionRate * 12);
    // Bonus for having follow-up tasks
    if (tasks.some((t) => t.status === "pending")) score += 3;
  }

  // 5. Data Completeness (0–10 pts)
  if (lead.email) score += 2;
  if (lead.phone) score += 2;
  if (lead.company) score += 2;
  if (lead.source) score += 2;
  if (lead.notes) score += 2;

  return Math.min(100, Math.max(0, score));
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Hot", color: "text-red-600 bg-red-100" };
  if (score >= 60) return { label: "Warm", color: "text-orange-600 bg-orange-100" };
  if (score >= 40) return { label: "Interested", color: "text-amber-600 bg-amber-100" };
  if (score >= 20) return { label: "Cool", color: "text-blue-600 bg-blue-100" };
  return { label: "Cold", color: "text-slate-600 bg-slate-100" };
}

/**
 * Pipeline forecasting — weighted pipeline by stage probability
 */
const STAGE_PROBABILITY: Record<Lead["status"], number> = {
  new: 0.1,
  contacted: 0.2,
  qualified: 0.4,
  proposal: 0.65,
  won: 1.0,
  lost: 0.0,
};

export interface ForecastData {
  stage: string;
  count: number;
  totalValue: number;
  weightedValue: number;
  probability: number;
}

export function calculateForecast(leads: Lead[]): {
  stages: ForecastData[];
  totalPipeline: number;
  weightedPipeline: number;
  wonRevenue: number;
  expectedClose: number;
} {
  const openStatuses: Lead["status"][] = ["new", "contacted", "qualified", "proposal"];
  const stages: ForecastData[] = openStatuses.map((status) => {
    const stageLeads = leads.filter((l) => l.status === status);
    const totalValue = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
    const probability = STAGE_PROBABILITY[status];
    return {
      stage: status.charAt(0).toUpperCase() + status.slice(1),
      count: stageLeads.length,
      totalValue,
      weightedValue: Math.round(totalValue * probability),
      probability,
    };
  });

  const totalPipeline = stages.reduce((s, st) => s + st.totalValue, 0);
  const weightedPipeline = stages.reduce((s, st) => s + st.weightedValue, 0);
  const wonRevenue = leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.value || 0), 0);

  return {
    stages,
    totalPipeline,
    weightedPipeline,
    wonRevenue,
    expectedClose: wonRevenue + weightedPipeline,
  };
}

// ─── Commission Calculator ──────────────────────────────

const SA_VAT_RATE = 0.15;

export function calculateCommission(
  salePrice: number,
  commissionRate: number,
  vatIncluded: boolean,
  splits: CommissionSplit[]
): {
  grossCommission: number;
  vatAmount: number;
  totalSplits: number;
  agentNetCommission: number;
} {
  const grossCommission = Math.round(salePrice * (commissionRate / 100));
  const vatAmount = vatIncluded ? Math.round(grossCommission * SA_VAT_RATE) : 0;
  const afterVat = grossCommission + vatAmount;

  // Calculate splits as percentages of gross commission
  const splitAmounts = splits.map((s) => ({
    ...s,
    amount: Math.round(grossCommission * (s.percentage / 100)),
  }));
  const totalSplits = splitAmounts.reduce((sum, s) => sum + s.amount, 0);
  const agentNetCommission = grossCommission - totalSplits;

  return {
    grossCommission,
    vatAmount,
    totalSplits,
    agentNetCommission,
  };
}

// ─── Transaction Forecasting ────────────────────────────

const TRANSACTION_STAGE_PROBABILITY: Record<TransactionStage, number> = {
  otp_signed: 0.3,
  fica_submitted: 0.4,
  fica_verified: 0.55,
  bond_applied: 0.65,
  bond_approved: 0.8,
  transfer_lodged: 0.9,
  transfer_registered: 0.95,
  commission_paid: 1.0,
  fallen_through: 0.0,
};

export interface TransactionForecastData {
  stage: string;
  count: number;
  totalCommission: number;
  weightedCommission: number;
  probability: number;
}

export function calculateTransactionForecast(transactions: Transaction[]): {
  stages: TransactionForecastData[];
  totalPendingCommission: number;
  weightedPendingCommission: number;
  earnedCommission: number;
  activeTransactions: number;
} {
  const activeStages: TransactionStage[] = [
    "otp_signed", "fica_submitted", "fica_verified",
    "bond_applied", "bond_approved", "transfer_lodged", "transfer_registered",
  ];

  const stages: TransactionForecastData[] = activeStages.map((stage) => {
    const stageTransactions = transactions.filter((t) => t.stage === stage);
    const totalCommission = stageTransactions.reduce((s, t) => s + (t.agentNetCommission || 0), 0);
    const probability = TRANSACTION_STAGE_PROBABILITY[stage];
    return {
      stage: stage.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      count: stageTransactions.length,
      totalCommission,
      weightedCommission: Math.round(totalCommission * probability),
      probability,
    };
  });

  const totalPendingCommission = stages.reduce((s, st) => s + st.totalCommission, 0);
  const weightedPendingCommission = stages.reduce((s, st) => s + st.weightedCommission, 0);
  const earnedCommission = transactions
    .filter((t) => t.stage === "commission_paid")
    .reduce((s, t) => s + (t.agentNetCommission || 0), 0);
  const activeTransactions = transactions.filter((t) => t.stage !== "fallen_through" && t.stage !== "commission_paid").length;

  return {
    stages,
    totalPendingCommission,
    weightedPendingCommission,
    earnedCommission,
    activeTransactions,
  };
}
