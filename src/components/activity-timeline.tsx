"use client";

import { useState } from "react";
import { Phone, Mail, Users, StickyNote, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addActivity, type Activity } from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";

const ACTIVITY_ICONS = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

const ACTIVITY_COLORS = {
  call: "bg-blue-100 text-blue-700",
  email: "bg-purple-100 text-purple-700",
  meeting: "bg-green-100 text-green-700",
  note: "bg-orange-100 text-orange-700",
};

interface ActivityTimelineProps {
  activities: Activity[];
  leadId?: string;
  contactId?: string;
  onActivityAdded: () => void;
}

export function ActivityTimeline({ activities, leadId, contactId, onActivityAdded }: ActivityTimelineProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "note" as Activity["type"],
    subject: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await addActivity({
        ...form,
        leadId: leadId || "",
        contactId: contactId || "",
        ownerId: user.uid,
      });
      setForm({ type: "note", subject: "", description: "" });
      setShowForm(false);
      onActivityAdded();
    } catch (error) {
      console.error("Failed to add activity:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Log Activity
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="act-type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Activity["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="act-subject">Subject *</Label>
                <Input id="act-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief subject" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="act-desc">Description</Label>
              <textarea id="act-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Details..." />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activities logged yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type];
                const color = ACTIVITY_COLORS[activity.type];
                return (
                  <div key={activity.id} className="relative flex gap-4 pl-1">
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.subject}</p>
                        <span className="text-xs text-muted-foreground">
                          {activity.createdAt ? format(activity.createdAt.toDate(), "dd MMM yyyy, HH:mm") : "—"}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
