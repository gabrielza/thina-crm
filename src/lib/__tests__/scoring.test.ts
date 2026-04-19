import { describe, it, expect } from "vitest";
import { calculateLeadScore, getScoreLabel, calculateForecast, calculateCommission, calculateTransactionForecast } from "@/lib/scoring";
import type { Lead, Activity, Task, Transaction, TransactionStage } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";

// ─── Factories ───────────────────────────────────────────

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    name: "Test Lead",
    email: "test@example.com",
    phone: "0821234567",
    company: "Acme Corp",
    status: "new",
    source: "Website",
    notes: "Some notes",
    value: 50000,
    ownerId: "user-1",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "act-1",
    type: "call",
    subject: "Follow-up call",
    description: "Discussed proposal",
    leadId: "lead-1",
    ownerId: "user-1",
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Send proposal",
    description: "Draft and send",
    dueDate: "2026-04-25",
    status: "pending",
    priority: "medium",
    leadId: "lead-1",
    ownerId: "user-1",
    ...overrides,
  };
}

// ─── calculateLeadScore ─────────────────────────────────

describe("calculateLeadScore", () => {
  it("returns 0 for a minimal lead with no data", () => {
    const lead = makeLead({
      email: "",
      phone: "",
      company: "",
      source: "",
      notes: "",
      value: 0,
      status: "lost",
    });
    expect(calculateLeadScore(lead, [], [])).toBe(0);
  });

  it("scores deal value on a log scale (up to 25 pts)", () => {
    const small = makeLead({ value: 100, email: "", phone: "", company: "", source: "", notes: "", status: "lost" });
    const large = makeLead({ value: 500000, email: "", phone: "", company: "", source: "", notes: "", status: "lost" });
    const scoreSmall = calculateLeadScore(small, [], []);
    const scoreLarge = calculateLeadScore(large, [], []);
    expect(scoreLarge).toBeGreaterThan(scoreSmall);
    expect(scoreLarge).toBeLessThanOrEqual(25);
  });

  it("awards stage points based on pipeline stage", () => {
    const newLead = makeLead({ status: "new", value: 0, email: "", phone: "", company: "", source: "", notes: "" });
    const proposalLead = makeLead({ status: "proposal", value: 0, email: "", phone: "", company: "", source: "", notes: "" });
    const wonLead = makeLead({ status: "won", value: 0, email: "", phone: "", company: "", source: "", notes: "" });
    expect(calculateLeadScore(newLead, [], [])).toBe(5);
    expect(calculateLeadScore(proposalLead, [], [])).toBe(22);
    expect(calculateLeadScore(wonLead, [], [])).toBe(25);
  });

  it("awards activity engagement points (up to 25 pts + 3 diversity bonus)", () => {
    const lead = makeLead({ value: 0, status: "lost", email: "", phone: "", company: "", source: "", notes: "" });
    const activities = [
      makeActivity({ type: "call" }),
      makeActivity({ type: "email" }),
      makeActivity({ type: "meeting" }),
    ];
    const score = calculateLeadScore(lead, activities, []);
    // 3 activities × 5 = 15, + 3 diversity bonus = 18
    expect(score).toBe(18);
  });

  it("caps activity score at 25 plus diversity", () => {
    const lead = makeLead({ value: 0, status: "lost", email: "", phone: "", company: "", source: "", notes: "" });
    const activities = Array.from({ length: 10 }, () => makeActivity());
    const score = calculateLeadScore(lead, activities, []);
    // 10 × 5 = 50, capped at 25; only 1 type so no diversity bonus
    expect(score).toBe(25);
  });

  it("awards task completion points", () => {
    const lead = makeLead({ value: 0, status: "lost", email: "", phone: "", company: "", source: "", notes: "" });
    const tasks = [
      makeTask({ status: "completed" }),
      makeTask({ status: "completed" }),
      makeTask({ status: "pending" }),
    ];
    // completion rate = 2/3 ≈ 0.667 → round(0.667 * 12) = 8
    // + 3 bonus for pending follow-up = 11
    const score = calculateLeadScore(lead, [], tasks);
    expect(score).toBe(11);
  });

  it("awards data completeness points (2 per field, 5 fields = 10)", () => {
    const full = makeLead({ value: 0, status: "lost" });
    const empty = makeLead({ value: 0, status: "lost", email: "", phone: "", company: "", source: "", notes: "" });
    expect(calculateLeadScore(full, [], [])).toBe(10);
    expect(calculateLeadScore(empty, [], [])).toBe(0);
  });

  it("never exceeds 100", () => {
    const lead = makeLead({ value: 999999, status: "won" });
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ type: (["call", "email", "meeting", "note"] as const)[i % 4] })
    );
    const tasks = [makeTask({ status: "completed" }), makeTask({ status: "pending" })];
    const score = calculateLeadScore(lead, activities, tasks);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("never goes below 0", () => {
    const lead = makeLead({ value: -100, status: "lost", email: "", phone: "", company: "", source: "", notes: "" });
    expect(calculateLeadScore(lead, [], [])).toBe(0);
  });
});

// ─── getScoreLabel ──────────────────────────────────────

describe("getScoreLabel", () => {
  it("returns Hot for score >= 80", () => {
    expect(getScoreLabel(80).label).toBe("Hot");
    expect(getScoreLabel(100).label).toBe("Hot");
  });

  it("returns Warm for score 60-79", () => {
    expect(getScoreLabel(60).label).toBe("Warm");
    expect(getScoreLabel(79).label).toBe("Warm");
  });

  it("returns Interested for score 40-59", () => {
    expect(getScoreLabel(40).label).toBe("Interested");
    expect(getScoreLabel(59).label).toBe("Interested");
  });

  it("returns Cool for score 20-39", () => {
    expect(getScoreLabel(20).label).toBe("Cool");
    expect(getScoreLabel(39).label).toBe("Cool");
  });

  it("returns Cold for score < 20", () => {
    expect(getScoreLabel(0).label).toBe("Cold");
    expect(getScoreLabel(19).label).toBe("Cold");
  });

  it("always includes a color string", () => {
    for (const score of [0, 20, 40, 60, 80]) {
      expect(getScoreLabel(score).color).toBeTruthy();
    }
  });
});

// ─── calculateForecast ──────────────────────────────────

describe("calculateForecast", () => {
  it("returns zero totals for empty leads", () => {
    const result = calculateForecast([]);
    expect(result.totalPipeline).toBe(0);
    expect(result.weightedPipeline).toBe(0);
    expect(result.wonRevenue).toBe(0);
    expect(result.expectedClose).toBe(0);
    expect(result.stages).toHaveLength(4); // new, contacted, qualified, proposal
  });

  it("calculates weighted pipeline by stage probability", () => {
    const leads = [
      makeLead({ status: "new", value: 100000 }),
      makeLead({ status: "proposal", value: 200000 }),
    ];
    const result = calculateForecast(leads);
    // new: 100000 * 0.1 = 10000, proposal: 200000 * 0.65 = 130000
    expect(result.weightedPipeline).toBe(140000);
    expect(result.totalPipeline).toBe(300000);
  });

  it("counts won revenue separately from pipeline", () => {
    const leads = [
      makeLead({ status: "won", value: 500000 }),
      makeLead({ status: "qualified", value: 100000 }),
    ];
    const result = calculateForecast(leads);
    expect(result.wonRevenue).toBe(500000);
    // qualified: 100000 * 0.4 = 40000
    expect(result.weightedPipeline).toBe(40000);
    expect(result.expectedClose).toBe(540000);
  });

  it("excludes lost leads from pipeline", () => {
    const leads = [
      makeLead({ status: "lost", value: 1000000 }),
      makeLead({ status: "new", value: 50000 }),
    ];
    const result = calculateForecast(leads);
    expect(result.totalPipeline).toBe(50000);
    expect(result.wonRevenue).toBe(0);
  });

  it("returns 4 open stages", () => {
    const result = calculateForecast([]);
    const stageNames = result.stages.map((s) => s.stage.toLowerCase());
    expect(stageNames).toEqual(["new", "contacted", "qualified", "proposal"]);
  });
});

// ─── calculateCommission ────────────────────────────────

describe("calculateCommission", () => {
  it("calculates gross commission from sale price and rate", () => {
    const result = calculateCommission(2000000, 5, false, []);
    expect(result.grossCommission).toBe(100000);
    expect(result.vatAmount).toBe(0);
    expect(result.agentNetCommission).toBe(100000);
  });

  it("adds 15% VAT when vatIncluded is true", () => {
    const result = calculateCommission(2000000, 5, true, []);
    expect(result.grossCommission).toBe(100000);
    expect(result.vatAmount).toBe(15000); // 15% of 100000
    expect(result.agentNetCommission).toBe(100000); // no splits, agent keeps gross
  });

  it("subtracts commission splits from agent net", () => {
    const splits = [
      { party: "Agency", percentage: 50, amount: 0 },
      { party: "Referrer", percentage: 10, amount: 0 },
    ];
    const result = calculateCommission(2000000, 5, false, splits);
    // grossCommission = 100000
    // Agency split: 50000, Referrer split: 10000 → totalSplits: 60000
    expect(result.totalSplits).toBe(60000);
    expect(result.agentNetCommission).toBe(40000);
  });

  it("returns zero for zero sale price", () => {
    const result = calculateCommission(0, 5, true, []);
    expect(result.grossCommission).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.agentNetCommission).toBe(0);
  });

  it("handles high commission rates", () => {
    const result = calculateCommission(1000000, 7.5, false, []);
    expect(result.grossCommission).toBe(75000);
  });
});

// ─── calculateTransactionForecast ───────────────────────

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    propertyAddress: "123 Main St, Sandton",
    salePrice: 2000000,
    commissionRate: 5,
    commissionAmount: 100000,
    vatIncluded: true,
    vatAmount: 15000,
    splits: [],
    agentNetCommission: 100000,
    stage: "otp_signed" as TransactionStage,
    stageHistory: [{ stage: "otp_signed" as TransactionStage, date: "2025-01-01" }],
    ficaBuyer: false,
    ficaSeller: false,
    conveyancer: "",
    bondOriginator: "",
    buyerName: "John Doe",
    sellerName: "Jane Smith",
    notes: "",
    dates: {},
    ownerId: "user-1",
    ...overrides,
  };
}

describe("calculateTransactionForecast", () => {
  it("returns zero totals for empty transactions", () => {
    const result = calculateTransactionForecast([]);
    expect(result.totalPendingCommission).toBe(0);
    expect(result.weightedPendingCommission).toBe(0);
    expect(result.earnedCommission).toBe(0);
    expect(result.activeTransactions).toBe(0);
  });

  it("counts active transactions (excludes commission_paid and fallen_through)", () => {
    const txs = [
      makeTransaction({ stage: "otp_signed" as TransactionStage }),
      makeTransaction({ stage: "bond_applied" as TransactionStage }),
      makeTransaction({ stage: "commission_paid" as TransactionStage }),
      makeTransaction({ stage: "fallen_through" as TransactionStage }),
    ];
    const result = calculateTransactionForecast(txs);
    expect(result.activeTransactions).toBe(2);
  });

  it("separates earned commission from pending", () => {
    const txs = [
      makeTransaction({ stage: "commission_paid" as TransactionStage, agentNetCommission: 100000 }),
      makeTransaction({ stage: "otp_signed" as TransactionStage, agentNetCommission: 80000 }),
    ];
    const result = calculateTransactionForecast(txs);
    expect(result.earnedCommission).toBe(100000);
    expect(result.totalPendingCommission).toBe(80000);
  });

  it("excludes fallen_through from all totals", () => {
    const txs = [
      makeTransaction({ stage: "fallen_through" as TransactionStage, agentNetCommission: 200000 }),
    ];
    const result = calculateTransactionForecast(txs);
    expect(result.totalPendingCommission).toBe(0);
    expect(result.weightedPendingCommission).toBe(0);
    expect(result.earnedCommission).toBe(0);
  });

  it("applies probability weighting to pending commission", () => {
    const txs = [
      makeTransaction({ stage: "otp_signed" as TransactionStage, agentNetCommission: 100000 }),
    ];
    const result = calculateTransactionForecast(txs);
    // otp_signed probability = 0.3, so weighted = 30000
    expect(result.weightedPendingCommission).toBe(30000);
  });

  it("returns stages breakdown", () => {
    const txs = [
      makeTransaction({ stage: "otp_signed" as TransactionStage, agentNetCommission: 100000 }),
      makeTransaction({ stage: "bond_approved" as TransactionStage, agentNetCommission: 80000 }),
    ];
    const result = calculateTransactionForecast(txs);
    expect(result.stages.length).toBeGreaterThan(0);
    const otpStage = result.stages.find((s) => s.stage === "Otp Signed");
    expect(otpStage).toBeDefined();
    expect(otpStage!.count).toBe(1);
    expect(otpStage!.totalCommission).toBe(100000);
  });
});
