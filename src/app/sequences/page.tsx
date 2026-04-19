"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Zap, Plus, Play, Pause, Trash2, Clock, MessageSquare, Mail, ArrowRight,
} from "lucide-react";
import {
  getSequences, addSequence, updateSequence, deleteSequence,
  getEnrollments,
  type FollowUpSequence, type SequenceStep, type SequenceEnrollment,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";

export default function SequencesPage() {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "new_lead" as FollowUpSequence["trigger"],
    steps: [{ day: 0, channel: "sms", template: "" }] as SequenceStep[],
  });

  const fetchData = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([getSequences(), getEnrollments()]);
      setSequences(s);
      setEnrollments(e);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!user || !form.name || form.steps.length === 0) return;
    setSaving(true);
    try {
      await addSequence({
        name: form.name,
        trigger: form.trigger,
        steps: form.steps,
        active: true,
        ownerId: user.uid,
      });
      setForm({ name: "", trigger: "new_lead", steps: [{ day: 0, channel: "sms", template: "" }] });
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create sequence:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (seq: FollowUpSequence) => {
    if (!seq.id) return;
    await updateSequence(seq.id, { active: !seq.active });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sequence?")) return;
    await deleteSequence(id);
    fetchData();
  };

  const addStep = () => {
    const lastDay = form.steps.length > 0 ? form.steps[form.steps.length - 1].day : 0;
    setForm({ ...form, steps: [...form.steps, { day: lastDay + 3, channel: "sms", template: "" }] });
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: string | number) => {
    const steps = [...form.steps];
    steps[index] = { ...steps[index], [field]: value };
    setForm({ ...form, steps });
  };

  const removeStep = (index: number) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const channelIcon = (channel: string) => {
    switch (channel) {
      case "sms": return <MessageSquare className="h-3 w-3" />;
      case "email": return <Mail className="h-3 w-3" />;
      case "whatsapp": return <MessageSquare className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const triggerLabels: Record<FollowUpSequence["trigger"], string> = {
    new_lead: "New Lead Created",
    show_day: "Show Day Registration",
    proposal: "Proposal Sent",
    manual: "Manual Enrollment",
  };

  const activeEnrollments = enrollments.filter((e) => e.status === "active").length;

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Follow-up Sequences</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Automated drip campaigns for lead nurturing</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Sequence
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sequences</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">{sequences.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{sequences.filter((s) => s.active).length}</p>
                </div>
                <Zap className="h-5 w-5 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active Enrollments</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">{activeEnrollments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sequences List */}
        {sequences.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] text-muted-foreground">No sequences yet. Create one to automate your follow-ups!</p>
              <p className="text-[12px] text-muted-foreground mt-1">Example: Day 0 — &quot;Thanks for viewing!&quot;, Day 3 — &quot;Similar listings&quot;, Day 7 — &quot;Price update&quot;</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sequences.map((seq) => {
              const enrolled = enrollments.filter((e) => e.sequenceId === seq.id);
              return (
                <Card key={seq.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{seq.name}</h3>
                          <Badge variant={seq.active ? "success" : "secondary"} className="text-[10px]">
                            {seq.active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Trigger: {triggerLabels[seq.trigger]} · {seq.steps.length} steps · {enrolled.length} enrolled
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(seq)}>
                          {seq.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => seq.id && handleDelete(seq.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Steps timeline */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {seq.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs whitespace-nowrap">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Day {step.day}</span>
                            {channelIcon(step.channel)}
                            <span className="font-medium capitalize">{step.channel}</span>
                          </div>
                          {i < seq.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Sequence</SheetTitle>
            <SheetDescription>Create an automated follow-up campaign</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Sequence Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Show Day Follow-up" />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v as FollowUpSequence["trigger"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead Created</SelectItem>
                  <SelectItem value="show_day">Show Day Registration</SelectItem>
                  <SelectItem value="proposal">Proposal Sent</SelectItem>
                  <SelectItem value="manual">Manual Enrollment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button type="button" variant="outline" size="sm" onClick={addStep} className="text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Step
                </Button>
              </div>
              {form.steps.map((step, i) => (
                <div key={i} className="rounded-lg border border-border/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                    {form.steps.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeStep(i)}>
                        <span className="text-sm">×</span>
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Day</Label>
                      <Input type="number" min={0} value={step.day} onChange={(e) => updateStep(i, "day", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Channel</Label>
                      <Select value={step.channel} onValueChange={(v) => updateStep(i, "channel", v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Message Template</Label>
                    <textarea
                      value={step.template}
                      onChange={(e) => updateStep(i, "template", e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Hi {name}, thanks for visiting {property}..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving ? "Creating..." : "Create Sequence"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
