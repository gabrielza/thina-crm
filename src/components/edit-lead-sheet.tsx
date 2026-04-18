"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLead, type Lead } from "@/lib/firestore";

interface EditLeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: () => void;
}

export function EditLeadSheet({ lead, open, onOpenChange, onLeadUpdated }: EditLeadSheetProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "new" as Lead["status"],
    source: "",
    notes: "",
    value: 0,
  });

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        source: lead.source,
        notes: lead.notes,
        value: lead.value || 0,
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id) return;

    setSaving(true);
    try {
      await updateLead(lead.id, form);
      onOpenChange(false);
      onLeadUpdated();
    } catch (error) {
      console.error("Failed to update lead:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Lead</SheetTitle>
          <SheetDescription>Update lead information.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company">Company</Label>
            <Input
              id="edit-company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-value">Deal Value (R)</Label>
            <Input
              id="edit-value"
              type="number"
              min={0}
              value={form.value || ""}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as Lead["status"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-source">Source</Label>
            <Input
              id="edit-source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Update Lead"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
