import { describe, it, expect } from "vitest";
import { calculateLeadScore, getScoreLabel, calculateForecast } from "@/lib/scoring";
import type { Lead, Activity, Task } from "@/lib/firestore";
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
