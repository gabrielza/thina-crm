"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MessageSquare, Send, Clock, CheckCircle2, XCircle, Search,
} from "lucide-react";
import {
  getSmsMessages, addSmsMessage, getContacts,
  type SmsMessage, type Contact,
} from "@/lib/firestore";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";

export default function MessagingPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ to: "", body: "", contactId: "" });
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([getSmsMessages(), getContacts()]);
      setMessages(m);
      setContacts(c);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => ({
    total: messages.length,
    sent: messages.filter((m) => m.status === "sent" || m.status === "delivered").length,
    queued: messages.filter((m) => m.status === "queued").length,
    failed: messages.filter((m) => m.status === "failed").length,
  }), [messages]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return messages.filter((m) => m.to.includes(s) || m.body.toLowerCase().includes(s));
  }, [messages, search]);

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setForm({ ...form, to: contact.phone, contactId: contact.id! });
    }
  };

  const handleSend = async () => {
    if (!user || !form.to || !form.body) return;
    setSending(true);
    try {
      // Send via server-side BulkSMS API route
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        const res = await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ to: form.to, body: form.body, contactId: form.contactId || undefined }),
        });
        const data = await res.json();
        if (!res.ok && res.status !== 502) {
          console.error("SMS API error:", data.error);
        }
        // API route handles Firestore write, just refresh
      } else {
        // Fallback: write directly to Firestore as queued
        await addSmsMessage({
          to: form.to,
          body: form.body,
          status: "queued",
          provider: "bulksms",
          contactId: form.contactId || undefined,
          direction: "outbound",
          ownerId: user.uid,
        });
      }
      setForm({ to: "", body: "", contactId: "" });
      setComposeOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const statusIcon = (status: SmsMessage["status"]) => {
    switch (status) {
      case "delivered": return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case "sent": return <Send className="h-3.5 w-3.5 text-blue-600" />;
      case "queued": return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-red-600" />;
    }
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Messaging</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Send and track SMS messages via BulkSMS</p>
          </div>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Compose
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="pt-5"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Messages</p><p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sent</p><p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{stats.sent}</p></div><CheckCircle2 className="h-5 w-5 text-green-600/50" /></div></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Queued</p><p className="text-2xl font-semibold tabular-nums mt-1 text-amber-600">{stats.queued}</p></div><Clock className="h-5 w-5 text-amber-600/50" /></div></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Failed</p><p className="text-2xl font-semibold tabular-nums mt-1 text-red-600">{stats.failed}</p></div><XCircle className="h-5 w-5 text-red-600/50" /></div></CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>

        {/* SMS configuration notice */}
        <Card className="border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/10">
          <CardContent className="py-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>SMS Gateway:</strong> Messages are sent via the BulkSMS API. Set <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">BULKSMS_TOKEN_ID</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">BULKSMS_TOKEN_SECRET</code> environment variables to enable sending. Without credentials, messages are recorded but not delivered.
            </p>
          </CardContent>
        </Card>

        {/* Messages */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] text-muted-foreground">No messages yet. Click Compose to send your first SMS.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell>{statusIcon(msg.status)}</TableCell>
                    <TableCell className="font-mono text-[13px]">{msg.to}</TableCell>
                    <TableCell className="text-[13px] max-w-[300px] truncate">{msg.body}</TableCell>
                    <TableCell>
                      <Badge variant={
                        msg.status === "delivered" ? "success" :
                        msg.status === "sent" ? "default" :
                        msg.status === "queued" ? "warning" : "destructive"
                      } className="text-[10px]">{msg.status}</Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {msg.createdAt ? format(msg.createdAt.toDate(), "dd MMM HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Compose Sheet */}
      <Sheet open={composeOpen} onOpenChange={setComposeOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Compose SMS</SheetTitle>
            <SheetDescription>Send an SMS message to a contact or phone number</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Select Contact (optional)</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(e) => e.target.value && handleContactSelect(e.target.value)}
                defaultValue=""
              >
                <option value="">— Or type number below —</option>
                {contacts.filter((c) => c.phone).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="e.g. +27821234567" />
            </div>
            <div className="space-y-2">
              <Label>Message * <span className="text-muted-foreground">({160 - form.body.length} chars left)</span></Label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value.slice(0, 160) })}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Type your message..."
                maxLength={160}
              />
            </div>
            <Button onClick={handleSend} disabled={sending || !form.to || !form.body} className="w-full">
              {sending ? "Sending..." : "Send SMS"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
