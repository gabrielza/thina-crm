"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, XCircle,
  FileText, GraduationCap, Receipt, Search,
} from "lucide-react";
import {
  getContacts, updateContact, getTransactions,
  type Contact, type PopiaConsent, type Transaction,
} from "@/lib/firestore";
import { format, differenceInDays } from "date-fns";

type Tab = "popia" | "fica" | "commission" | "cpd";

// ─── CPD Types ─────────────────────────────────────────
interface CpdEntry {
  id: string;
  title: string;
  provider: string;
  date: string;
  hours: number;
  category: "verifiable" | "non-verifiable";
}

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>("popia");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // POPIA consent editing
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentForm, setConsentForm] = useState<PopiaConsent>({
    given: true, date: new Date().toISOString().split("T")[0],
    method: "electronic", optEmail: true, optSms: true, optPhone: true, optWhatsapp: true,
  });

  // CPD state (stored in localStorage for now)
  const [cpdEntries, setCpdEntries] = useState<CpdEntry[]>([]);
  const [cpdOpen, setCpdOpen] = useState(false);
  const [cpdForm, setCpdForm] = useState({ title: "", provider: "", date: "", hours: 0, category: "verifiable" as CpdEntry["category"] });
  const [renewalDate, setRenewalDate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [c, t] = await Promise.all([getContacts(), getTransactions()]);
      setContacts(c);
      setTransactions(t);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load CPD from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("thina-cpd-entries");
    if (saved) setCpdEntries(JSON.parse(saved));
    const rd = localStorage.getItem("thina-cpd-renewal");
    if (rd) setRenewalDate(rd);
  }, []);

  const saveCpd = (entries: CpdEntry[]) => {
    setCpdEntries(entries);
    localStorage.setItem("thina-cpd-entries", JSON.stringify(entries));
  };

  // ─── POPIA computed ──────────────────────────────────
  const popiaStats = useMemo(() => {
    const total = contacts.length;
    const consented = contacts.filter((c) => c.popiaConsent?.given && !c.popiaConsent.revokedDate).length;
    const revoked = contacts.filter((c) => c.popiaConsent?.revokedDate).length;
    const pending = total - consented - revoked;
    return { total, consented, revoked, pending };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const s = search.toLowerCase();
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)
    );
  }, [contacts, search]);

  // ─── FICA computed ───────────────────────────────────
  const ficaStats = useMemo(() => {
    const active = transactions.filter((t) => t.stage !== "fallen_through" && t.stage !== "commission_paid");
    const bothComplete = active.filter((t) => t.ficaBuyer && t.ficaSeller).length;
    const partial = active.filter((t) => (t.ficaBuyer || t.ficaSeller) && !(t.ficaBuyer && t.ficaSeller)).length;
    const missing = active.filter((t) => !t.ficaBuyer && !t.ficaSeller).length;
    const complianceRate = active.length > 0 ? (bothComplete / active.length) * 100 : 100;
    return { active: active.length, bothComplete, partial, missing, complianceRate, transactions: active };
  }, [transactions]);

  // ─── Commission & VAT computed ───────────────────────
  const commissionStats = useMemo(() => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const paidTx = transactions.filter((t) => t.stage === "commission_paid" && t.dates.commissionPaid);
    const rollingTx = paidTx.filter((t) => new Date(t.dates.commissionPaid!) >= twelveMonthsAgo);
    const rollingIncome = rollingTx.reduce((s, t) => s + t.agentNetCommission, 0);
    const totalPending = transactions
      .filter((t) => !["commission_paid", "fallen_through"].includes(t.stage))
      .reduce((s, t) => s + t.agentNetCommission, 0);
    const vatThreshold = 1_000_000;
    const percentToThreshold = Math.min((rollingIncome / vatThreshold) * 100, 100);
    const monthlyAvg = rollingTx.length > 0 ? rollingIncome / 12 : 0;
    const projectedAnnual = monthlyAvg * 12;
    return { rollingIncome, totalPending, percentToThreshold, vatThreshold, monthlyAvg, projectedAnnual, rollingTx };
  }, [transactions]);

  // ─── CPD computed ────────────────────────────────────
  const cpdStats = useMemo(() => {
    const verifiable = cpdEntries.filter((e) => e.category === "verifiable").reduce((s, e) => s + e.hours, 0);
    const nonVerifiable = cpdEntries.filter((e) => e.category === "non-verifiable").reduce((s, e) => s + e.hours, 0);
    const total = verifiable + nonVerifiable;
    const daysToRenewal = renewalDate ? differenceInDays(new Date(renewalDate), new Date()) : null;
    return { verifiable, nonVerifiable, total, daysToRenewal };
  }, [cpdEntries, renewalDate]);

  // ─── Handlers ────────────────────────────────────────
  const openConsentSheet = (contact: Contact) => {
    setEditContact(contact);
    if (contact.popiaConsent) {
      setConsentForm(contact.popiaConsent);
    } else {
      setConsentForm({
        given: true, date: new Date().toISOString().split("T")[0],
        method: "electronic", optEmail: true, optSms: true, optPhone: true, optWhatsapp: true,
      });
    }
    setConsentOpen(true);
  };

  const saveConsent = async () => {
    if (!editContact?.id) return;
    await updateContact(editContact.id, { popiaConsent: consentForm });
    setConsentOpen(false);
    fetchData();
  };

  const revokeConsent = async () => {
    if (!editContact?.id) return;
    const updated: PopiaConsent = {
      ...consentForm,
      given: false,
      revokedDate: new Date().toISOString().split("T")[0],
      optEmail: false, optSms: false, optPhone: false, optWhatsapp: false,
    };
    await updateContact(editContact.id, { popiaConsent: updated });
    setConsentOpen(false);
    fetchData();
  };

  const addCpdEntry = () => {
    if (!cpdForm.title || !cpdForm.date || cpdForm.hours <= 0) return;
    const entry: CpdEntry = { ...cpdForm, id: crypto.randomUUID() };
    saveCpd([...cpdEntries, entry]);
    setCpdForm({ title: "", provider: "", date: "", hours: 0, category: "verifiable" });
    setCpdOpen(false);
  };

  const deleteCpdEntry = (id: string) => {
    saveCpd(cpdEntries.filter((e) => e.id !== id));
  };

  const saveRenewalDate = (d: string) => {
    setRenewalDate(d);
    localStorage.setItem("thina-cpd-renewal", d);
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance</h1>
          <p className="text-[13px] text-muted-foreground mt-1">POPIA consent, FICA status, VAT threshold &amp; CPD points</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 border-b border-border pb-2">
          {([
            { key: "popia" as Tab, label: "POPIA", icon: ShieldCheck },
            { key: "fica" as Tab, label: "FICA", icon: FileText },
            { key: "commission" as Tab, label: "Commission & VAT", icon: Receipt },
            { key: "cpd" as Tab, label: "CPD Points", icon: GraduationCap },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════ POPIA TAB ════════ */}
        {tab === "popia" && (
          <div className="space-y-6">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{popiaStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Consented</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{popiaStats.consented}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1 text-amber-600">{popiaStats.pending}</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-600/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Revoked</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1 text-red-600">{popiaStats.revoked}</p>
                    </div>
                    <XCircle className="h-5 w-5 text-red-600/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Consent Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => {
                    const consent = contact.popiaConsent;
                    const isRevoked = consent?.revokedDate;
                    const isConsented = consent?.given && !isRevoked;
                    return (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary text-xs font-semibold">{contact.name.charAt(0)}</div>
                            <div><p className="font-medium text-[13px]">{contact.name}</p><p className="text-[11px] text-muted-foreground">{contact.email}</p></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isConsented ? (
                            <Badge variant="success"><ShieldCheck className="h-3 w-3 mr-1" /> Consented</Badge>
                          ) : isRevoked ? (
                            <Badge variant="destructive"><ShieldX className="h-3 w-3 mr-1" /> Revoked</Badge>
                          ) : (
                            <Badge variant="warning"><ShieldAlert className="h-3 w-3 mr-1" /> Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">
                          {consent?.date ? format(new Date(consent.date), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground capitalize">
                          {consent?.method?.replace("-", " ") || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {consent?.optEmail && <Badge variant="outline" className="text-[10px] px-1.5">Email</Badge>}
                            {consent?.optSms && <Badge variant="outline" className="text-[10px] px-1.5">SMS</Badge>}
                            {consent?.optPhone && <Badge variant="outline" className="text-[10px] px-1.5">Phone</Badge>}
                            {consent?.optWhatsapp && <Badge variant="outline" className="text-[10px] px-1.5">WA</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openConsentSheet(contact)}>
                            {consent ? "Edit" : "Record"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ════════ FICA TAB ════════ */}
        {tab === "fica" && (
          <div className="space-y-6">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active Transactions</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{ficaStats.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fully Compliant</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1 text-green-600">{ficaStats.bothComplete}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Partially Done</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1 text-amber-600">{ficaStats.partial}</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-600/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Missing</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1 text-red-600">{ficaStats.missing}</p>
                    </div>
                    <XCircle className="h-5 w-5 text-red-600/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Rate */}
            <Card>
              <CardHeader>
                <CardTitle>FICA Compliance Rate</CardTitle>
                <CardDescription>Percentage of active transactions with both buyer &amp; seller FICA verified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{ficaStats.complianceRate.toFixed(1)}%</span>
                    <span className="text-muted-foreground">{ficaStats.bothComplete}/{ficaStats.active} transactions</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ficaStats.complianceRate >= 80 ? "bg-green-500" : ficaStats.complianceRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${ficaStats.complianceRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction FICA table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Property</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Buyer FICA</TableHead>
                    <TableHead>Seller FICA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ficaStats.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-[13px]">{tx.propertyAddress}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{tx.stage.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{tx.buyerName || "—"}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{tx.sellerName || "—"}</TableCell>
                      <TableCell>
                        {tx.ficaBuyer ? <Badge variant="success">Done</Badge> : <Badge variant="destructive">Missing</Badge>}
                      </TableCell>
                      <TableCell>
                        {tx.ficaSeller ? <Badge variant="success">Done</Badge> : <Badge variant="destructive">Missing</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ficaStats.transactions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No active transactions.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ════════ COMMISSION & VAT TAB ════════ */}
        {tab === "commission" && (
          <div className="space-y-6">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Rolling 12-Month</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(commissionStats.rollingIncome)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending Commission</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(commissionStats.totalPending)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Monthly Average</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(commissionStats.monthlyAvg)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Projected Annual</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 font-mono">{formatCurrency(commissionStats.projectedAnnual)}</p>
                </CardContent>
              </Card>
            </div>

            {/* VAT Threshold */}
            <Card>
              <CardHeader>
                <CardTitle>VAT Registration Threshold</CardTitle>
                <CardDescription>You must register for VAT when commission income exceeds R1,000,000 in any 12-month period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(commissionStats.rollingIncome)}</span>
                  <span className="text-muted-foreground">/ {formatCurrency(commissionStats.vatThreshold)}</span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden relative">
                  {/* Warning zones */}
                  <div className="absolute inset-y-0 right-0 w-[20%] bg-red-100 dark:bg-red-950/30" />
                  <div className="absolute inset-y-0 right-[20%] w-[10%] bg-amber-100 dark:bg-amber-950/30" />
                  <div
                    className={`h-full rounded-full transition-all relative z-10 ${
                      commissionStats.percentToThreshold >= 100 ? "bg-red-500" :
                      commissionStats.percentToThreshold >= 90 ? "bg-red-400" :
                      commissionStats.percentToThreshold >= 80 ? "bg-amber-500" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${commissionStats.percentToThreshold}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{commissionStats.percentToThreshold.toFixed(1)}% of threshold</span>
                  <span>R{((commissionStats.vatThreshold - commissionStats.rollingIncome) / 1000).toFixed(0)}k remaining</span>
                </div>
                {commissionStats.percentToThreshold >= 80 && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${commissionStats.percentToThreshold >= 100 ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"}`}>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-medium">
                      {commissionStats.percentToThreshold >= 100
                        ? "You have exceeded the R1M VAT threshold. Register for VAT immediately."
                        : `You are at ${commissionStats.percentToThreshold.toFixed(0)}% of the VAT threshold. Consider registering for VAT soon.`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Commission Payments</CardTitle>
                <CardDescription>Transactions paid in the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {commissionStats.rollingTx.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No commission payments in the last 12 months.</p>
                ) : (
                  <div className="space-y-3">
                    {commissionStats.rollingTx.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{tx.propertyAddress}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid: {tx.dates.commissionPaid ? format(new Date(tx.dates.commissionPaid), "dd MMM yyyy") : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold">{formatCurrency(tx.agentNetCommission)}</p>
                          <p className="text-xs text-muted-foreground">Sale: {formatCurrency(tx.salePrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════ CPD TAB ════════ */}
        {tab === "cpd" && (
          <div className="space-y-6">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{cpdStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Verifiable</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-blue-600">{cpdStats.verifiable}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Non-Verifiable</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1 text-violet-600">{cpdStats.nonVerifiable}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Days to Renewal</p>
                  <p className={`text-2xl font-semibold tabular-nums mt-1 ${cpdStats.daysToRenewal !== null && cpdStats.daysToRenewal < 30 ? "text-red-600" : cpdStats.daysToRenewal !== null && cpdStats.daysToRenewal < 90 ? "text-amber-600" : ""}`}>
                    {cpdStats.daysToRenewal !== null ? cpdStats.daysToRenewal : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Renewal date setting */}
            <Card>
              <CardHeader>
                <CardTitle>FFC Renewal Date</CardTitle>
                <CardDescription>Your Fidelity Fund Certificate renewal date for CPD tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Renewal Date</Label>
                    <Input type="date" value={renewalDate} onChange={(e) => saveRenewalDate(e.target.value)} className="w-48" />
                  </div>
                  {cpdStats.daysToRenewal !== null && cpdStats.daysToRenewal < 60 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Renewal in {cpdStats.daysToRenewal} days — ensure CPD hours are complete</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add entry */}
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setCpdOpen(true)}>
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Log CPD Activity
              </Button>
            </div>

            {/* CPD table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Activity</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cpdEntries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No CPD activities logged. Click &quot;Log CPD Activity&quot; to get started.</TableCell></TableRow>
                  ) : (
                    cpdEntries.sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-[13px]">{entry.title}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{entry.provider || "—"}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-[13px] font-mono">{entry.hours}h</TableCell>
                        <TableCell>
                          <Badge variant={entry.category === "verifiable" ? "default" : "secondary"}>{entry.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteCpdEntry(entry.id)}>
                            <span className="text-lg">×</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ POPIA Consent Sheet ═══ */}
      <Sheet open={consentOpen} onOpenChange={setConsentOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>POPIA Consent — {editContact?.name}</SheetTitle>
            <SheetDescription>Record or update data processing consent</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Consent Date</Label>
              <Input type="date" value={consentForm.date} onChange={(e) => setConsentForm({ ...consentForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Consent Method</Label>
              <Select value={consentForm.method} onValueChange={(v) => setConsentForm({ ...consentForm, method: v as PopiaConsent["method"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal">Verbal</SelectItem>
                  <SelectItem value="written">Written</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="opt-in-form">Opt-in Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Communication Channels</Label>
              {(["optEmail", "optSms", "optPhone", "optWhatsapp"] as const).map((key) => {
                const labels = { optEmail: "Email", optSms: "SMS", optPhone: "Phone Calls", optWhatsapp: "WhatsApp" };
                return (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentForm[key]}
                      onChange={(e) => setConsentForm({ ...consentForm, [key]: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{labels[key]}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveConsent} className="flex-1">Save Consent</Button>
              {editContact?.popiaConsent?.given && !editContact?.popiaConsent?.revokedDate && (
                <Button variant="destructive" onClick={revokeConsent}>Revoke</Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ CPD Entry Sheet ═══ */}
      <Sheet open={cpdOpen} onOpenChange={setCpdOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Log CPD Activity</SheetTitle>
            <SheetDescription>Record a continuing professional development activity</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Activity Title *</Label>
              <Input value={cpdForm.title} onChange={(e) => setCpdForm({ ...cpdForm, title: e.target.value })} placeholder="e.g. NQF Level 5 Real Estate" />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input value={cpdForm.provider} onChange={(e) => setCpdForm({ ...cpdForm, provider: e.target.value })} placeholder="e.g. EAAB, PropAcademy" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={cpdForm.date} onChange={(e) => setCpdForm({ ...cpdForm, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hours *</Label>
                <Input type="number" min={0.5} step={0.5} value={cpdForm.hours || ""} onChange={(e) => setCpdForm({ ...cpdForm, hours: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={cpdForm.category} onValueChange={(v) => setCpdForm({ ...cpdForm, category: v as CpdEntry["category"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verifiable">Verifiable</SelectItem>
                  <SelectItem value="non-verifiable">Non-Verifiable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addCpdEntry} className="w-full">Save Entry</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
