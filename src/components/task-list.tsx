"use client";

import { useState } from "react";
import { Plus, Check, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTask, updateTask, deleteTask, type Task } from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format, isPast, isToday, parseISO } from "date-fns";

const PRIORITY_COLORS = {
  low: "outline" as const,
  medium: "warning" as const,
  high: "destructive" as const,
};

interface TaskListProps {
  tasks: Task[];
  leadId?: string;
  contactId?: string;
  onTaskChanged: () => void;
}

export function TaskList({ tasks, leadId, contactId, onTaskChanged }: TaskListProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as Task["priority"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await addTask({
        ...form,
        status: "pending",
        leadId: leadId || "",
        contactId: contactId || "",
        ownerId: user.uid,
      });
      setForm({ title: "", description: "", dueDate: "", priority: "medium" });
      setShowForm(false);
      onTaskChanged();
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    if (!task.id) return;
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(task.id, { status: newStatus });
    onTaskChanged();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    onTaskChanged();
  };

  const getStatusIcon = (task: Task) => {
    if (task.status === "completed") return <Check className="h-4 w-4 text-green-600" />;
    if (task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate))) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-orange-500" />;
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tasks</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Add Task
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="task-title">Title *</Label>
              <Input id="task-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Follow up with client" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="task-due">Due Date *</Label>
                <Input id="task-due" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Task["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-desc">Description</Label>
              <Input id="task-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving..." : "Create Task"}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {tasks.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-6">No tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                <button onClick={() => toggleComplete(task)} className="shrink-0 rounded-full border-2 border-muted-foreground/30 h-5 w-5 hover:border-primary flex items-center justify-center">
                  {getStatusIcon(task)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                </div>
                <Badge variant={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {task.dueDate ? format(parseISO(task.dueDate), "dd MMM") : "—"}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => task.id && handleDelete(task.id)}>
                  <span className="text-xs">×</span>
                </Button>
              </div>
            ))}
            {completedTasks.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground pt-2">Completed ({completedTasks.length})</p>
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3 opacity-60">
                    <button onClick={() => toggleComplete(task)} className="shrink-0 rounded-full bg-green-100 h-5 w-5 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-700" />
                    </button>
                    <p className="text-sm line-through flex-1">{task.title}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => task.id && handleDelete(task.id)}>
                      <span className="text-xs">×</span>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
