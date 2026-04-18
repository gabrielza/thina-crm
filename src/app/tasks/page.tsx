"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, Clock, AlertTriangle, Filter } from "lucide-react";
import { getTasks, addTask, updateTask, deleteTask, type Task } from "@/lib/firestore";
import { useAuth } from "@/lib/hooks/use-auth";
import { format, isPast, isToday, parseISO } from "date-fns";

const PRIORITY_COLORS = { low: "outline" as const, medium: "warning" as const, high: "destructive" as const };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", priority: "medium" as Task["priority"] });

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await addTask({ ...form, status: "pending", leadId: "", contactId: "", ownerId: user.uid });
      setForm({ title: "", description: "", dueDate: "", priority: "medium" });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    if (!task.id) return;
    await updateTask(task.id, { status: task.status === "completed" ? "pending" : "completed" });
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    fetchTasks();
  };

  const getStatusIcon = (task: Task) => {
    if (task.status === "completed") return <Check className="h-4 w-4 text-green-600" />;
    if (task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate))) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-orange-500" />;
  };

  const isOverdue = (task: Task) => task.status !== "completed" && task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    if (filter === "overdue") return isOverdue(t);
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const todayCount = tasks.filter((t) => t.status !== "completed" && t.dueDate && isToday(parseISO(t.dueDate))).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your to-dos and follow-ups</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> New Task</Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("pending")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("overdue")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div><p className="text-2xl font-bold">{overdueCount}</p><p className="text-xs text-muted-foreground">Overdue</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Filter className="h-8 w-8 text-blue-500" />
                <div><p className="text-2xl font-bold">{todayCount}</p><p className="text-xs text-muted-foreground">Due Today</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("completed")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="h-8 w-8 text-green-600" />
                <div><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">Completed</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Task Form */}
        {showForm && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Title *</Label>
                    <Input id="task-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Follow up with client" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-desc">Description</Label>
                    <Input id="task-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="task-due">Due Date *</Label>
                    <Input id="task-due" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
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
                  <div className="flex items-end gap-2">
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Task"}</Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "overdue", "completed"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : sortedTasks.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No tasks found. Create one to get started!</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <Card key={task.id} className={`transition-all hover:shadow-sm ${task.status === "completed" ? "opacity-60" : ""} ${isOverdue(task) ? "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20" : ""}`}>
                <CardContent className="flex items-center gap-4 py-4">
                  <button
                    onClick={() => toggleComplete(task)}
                    className={`shrink-0 rounded-full h-6 w-6 flex items-center justify-center transition-colors ${task.status === "completed" ? "bg-green-100 text-green-600" : "border-2 border-muted-foreground/30 hover:border-primary"}`}
                  >
                    {getStatusIcon(task)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                  </div>
                  <Badge variant={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                  <span className={`text-xs whitespace-nowrap ${isOverdue(task) ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                    {task.dueDate ? format(parseISO(task.dueDate), "dd MMM yyyy") : "—"}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => task.id && handleDelete(task.id)}>
                    <span className="text-lg">×</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
