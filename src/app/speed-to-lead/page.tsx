"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Zap, Plus, Trash2, Pencil, Clock, MessageSquare, Activity } from "lucide-react";
import {
  addAutoResponseRule, getAutoResponseRules, updateAutoResponseRule, deleteAutoResponseRule,
  type AutoResponseRule,
} from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";

const TRIGGERS: { value: AutoResponseRule["trigger"]; label: string; description: string }[] = [
  { value: "new_lead", label: "New Lead Created", description: "When a lead is added manually or via import" },
  { value: "inbound_portal", label: "Portal Lead Received", description: "When a Property24/Private Property lead arrives" },
  { value: "show_day_registration", label: "Show Day Registration", description: "When someone registers for a show day" },
];

const DEFAULT_TEMPLATES: Record<AutoResponseRule["trigger"], string> = {
  new_lead: "Hi {{name}}, thanks for your interest! I'm {{agent_name}}, your dedicated property consultant. I'll be in touch shortly. Call me on {{agent_phone}} if you need anything.",
  inbound_portal: "Hi {{name}}, thank you for your enquiry about {{property}}. I'm {{agent_name}} and I'd love to help. I'll call you within the hour! {{agent_phone}}",
  show_day_registration: "Hi {{name}}, you're registered for the show day at {{property}}! I'm {{agent_name}}, see you there. Questions? Call {{agent_phone}}",
};

const TEMPLATE_VARS = ["{{name}}", "{{property}}", "{{agent_name}}", "{{agent_phone}}"];

export default function SpeedToLeadPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutoResponseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    trigger: "new_lead" as AutoResponseRule["trigger"],
    enabled: true,
    messageTemplate: DEFAULT_TEMPLATES.new_lead,
    delayMinutes: 0,
    agentName: "",
    agentPhone: "",
  });

  const fetchRules = useCallback(async () => {
    try {
      const data = await getAutoResponseRules();
      setRules(data);
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter((r) => r.enabled).length,
    immediate: rules.filter((r) => r.delayMinutes === 0).length,
  }), [rules]);

  const resetForm = () => {
    setForm({
      name: "",
      trigger: "new_lead",
      enabled: true,
      messageTemplate: DEFAULT_TEMPLATES.new_lead,
      delayMinutes: 0,
      agentName: "",
      agentPhone: "",
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (rule: AutoResponseRule) => {
    setEditingId(rule.id || null);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      enabled: rule.enabled,
      messageTemplate: rule.messageTemplate,
      delayMinutes: rule.delayMinutes,
      agentName: rule.agentName,
      agentPhone: rule.agentPhone,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.name || !form.messageTemplate) return;
    try {
      if (editingId) {
        await updateAutoResponseRule(editingId, { ...form });
      } else {
        await addAutoResponseRule({ ...form, channel: "sms", ownerId: user.uid });
      }
      setSheetOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const handleToggle = async (rule: AutoResponseRule) => {
    if (!rule.id) return;
    await updateAutoResponseRule(rule.id, { enabled: !rule.enabled });
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this auto-response rule?")) return;
    await deleteAutoResponseRule(id);
    fetchRules();
  };

  const charCount = form.messageTemplate.length;
  const smsSegments = Math.ceil(charCount / 160);

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Speed-to-Lead</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Auto-respond to new leads within seconds</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Rule
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Rules</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{stats.active}</p>
                </div>
                <Zap className="h-5 w-5 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Instant Response</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{stats.immediate}</p>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info card */}
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="py-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>How it works:</strong> When a trigger event occurs, the system will queue an SMS auto-response using your configured BulkSMS provider. Studies show responding within 5 minutes increases conversion by 21x. Configure your SMS provider in <strong>Messaging</strong> settings.
            </p>
          </CardContent>
        </Card>

        {/* Rules Table */}
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] font-medium">No auto-response rules yet</p>
              <p className="text-[12px] text-muted-foreground mt-1">Create a rule to start responding to leads instantly</p>
              <Button size="sm" className="mt-4" onClick={openCreate}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const trigger = TRIGGERS.find((t) => t.value === rule.trigger);
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium text-[13px]">{rule.name}</span>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[300px]">
                            {rule.messageTemplate.substring(0, 60)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {trigger?.label || rule.trigger}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {rule.delayMinutes === 0 ? (
                          <span className="text-green-600 font-medium">Instant</span>
                        ) : (
                          `${rule.delayMinutes} min`
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggle(rule)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            rule.enabled
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${rule.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                          {rule.enabled ? "Active" : "Paused"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => rule.id && handleDelete(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit" : "New"} Auto-Response Rule</SheetTitle>
            <SheetDescription>Configure when and how to auto-respond to new leads</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Rule Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Portal Lead Instant Reply" />
            </div>

            <div className="space-y-2">
              <Label>Trigger Event *</Label>
              <Select
                value={form.trigger}
                onValueChange={(v) => {
                  const trigger = v as AutoResponseRule["trigger"];
                  setForm({
                    ...form,
                    trigger,
                    messageTemplate: form.messageTemplate === DEFAULT_TEMPLATES[form.trigger]
                      ? DEFAULT_TEMPLATES[trigger]
                      : form.messageTemplate,
                  });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {TRIGGERS.find((t) => t.value === form.trigger)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Response Delay</Label>
              <Select value={String(form.delayMinutes)} onValueChange={(v) => setForm({ ...form, delayMinutes: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Instant (0 min)</SelectItem>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Agent Name *</Label>
                <Input value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Agent Phone *</Label>
                <Input value={form.agentPhone} onChange={(e) => setForm({ ...form, agentPhone: e.target.value })} placeholder="+27 82 123 4567" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message Template *</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                value={form.messageTemplate}
                onChange={(e) => setForm({ ...form, messageTemplate: e.target.value })}
                placeholder="Type your auto-response message..."
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {TEMPLATE_VARS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, messageTemplate: form.messageTemplate + " " + v })}
                      className="text-[10px] bg-muted hover:bg-muted/80 rounded px-1.5 py-0.5 font-mono transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className={`text-[10px] tabular-nums ${charCount > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {charCount} chars · {smsSegments} SMS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="enabled" className="text-sm font-normal cursor-pointer">Enable this rule immediately</Label>
            </div>

            {/* Preview */}
            <Card className="bg-muted/30">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Message Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-xl rounded-tl-sm p-3 text-[13px] max-w-[80%]">
                  {form.messageTemplate
                    .replace(/\{\{name\}\}/g, "John")
                    .replace(/\{\{property\}\}/g, "45 Main Road, Sandton")
                    .replace(/\{\{agent_name\}\}/g, form.agentName || "Agent")
                    .replace(/\{\{agent_phone\}\}/g, form.agentPhone || "+27 XX XXX XXXX")}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={!form.name || !form.messageTemplate || !form.agentName} className="w-full">
              {editingId ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
