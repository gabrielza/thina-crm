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
import {
  FileText, Upload, Trash2, Download, Search, File, Image, FolderOpen,
} from "lucide-react";
import {
  addStoredDocument, getDocumentsByTransaction, getDocumentsByContact, deleteStoredDocument,
  getTransactions, getContacts,
  type StoredDocument, type Transaction, type Contact,
} from "@/lib/firestore";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";

const DOC_TYPES: StoredDocument["type"][] = ["fica", "otp", "mandate", "bond", "transfer", "other"];

const typeLabels: Record<StoredDocument["type"], string> = {
  fica: "FICA Document",
  otp: "Offer to Purchase",
  mandate: "Mandate Agreement",
  bond: "Bond Document",
  transfer: "Transfer Document",
  other: "Other",
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "other" as StoredDocument["type"],
    transactionId: "",
    contactId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([getTransactions(), getContacts()]);
      setTransactions(t);
      setContacts(c);

      // Fetch documents for all transactions and contacts
      const docPromises = [
        ...t.map((tx) => tx.id ? getDocumentsByTransaction(tx.id) : Promise.resolve([])),
        ...c.map((ct) => ct.id ? getDocumentsByContact(ct.id) : Promise.resolve([])),
      ];
      const docArrays = await Promise.all(docPromises.map((p) => p.catch(() => [] as StoredDocument[])));
      const allDocs = docArrays.flat();

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = allDocs.filter((d) => {
        if (!d.id || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
      setDocuments(unique);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return documents.filter((d) =>
      d.name.toLowerCase().includes(s) || d.type.toLowerCase().includes(s)
    );
  }, [documents, search]);

  const stats = useMemo(() => ({
    total: documents.length,
    fica: documents.filter((d) => d.type === "fica").length,
    otp: documents.filter((d) => d.type === "otp").length,
    other: documents.filter((d) => !["fica", "otp"].includes(d.type)).length,
  }), [documents]);

  const handleUpload = async () => {
    if (!user || !form.name || !file) return;
    setUploading(true);
    try {
      const storagePath = `documents/${user.uid}/${Date.now()}-${file.name}`;
      const storage = getFirebaseStorage();
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addStoredDocument({
        name: form.name || file.name,
        type: form.type,
        url,
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        transactionId: form.transactionId || undefined,
        contactId: form.contactId || undefined,
        ownerId: user.uid,
      });
      setForm({ name: "", type: "other", transactionId: "", contactId: "" });
      setFile(null);
      setUploadOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await deleteStoredDocument(id);
    fetchData();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Upload and manage transaction documents</p>
          </div>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card><CardContent className="pt-5"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Documents</p><p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">FICA Docs</p><p className="text-2xl font-semibold tabular-nums mt-1">{stats.fica}</p></div><FileText className="h-5 w-5 text-muted-foreground/50" /></div></CardContent></Card>
          <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">OTPs</p><p className="text-2xl font-semibold tabular-nums mt-1">{stats.otp}</p></div><File className="h-5 w-5 text-muted-foreground/50" /></div></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Other</p><p className="text-2xl font-semibold tabular-nums mt-1">{stats.other}</p></CardContent></Card>
        </div>

        {/* Storage notice */}
        <Card className="border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/10">
          <CardContent className="py-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Storage:</strong> Document uploads require Firebase Storage to be configured. Document metadata is stored in Firestore. Configure Storage rules to restrict access by ownerId.
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>

        {/* Documents Table */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-[13px] text-muted-foreground">No documents yet. Upload one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Linked To</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.mimeType?.startsWith("image/") ? <Image className="h-4 w-4 text-muted-foreground" /> : <File className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-medium text-[13px]">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[doc.type]}</Badge></TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{formatSize(doc.fileSize)}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {doc.transactionId ? `Transaction` : doc.contactId ? `Contact` : "—"}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {doc.createdAt ? format(doc.createdAt.toDate(), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(doc.url, "_blank")}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => doc.id && handleDelete(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Upload Sheet */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Upload Document</SheetTitle>
            <SheetDescription>Upload a document and link it to a transaction or contact</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>File *</Label>
              <Input type="file" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!form.name) setForm({ ...form, name: f.name });
                }
              }} />
            </div>
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Buyer FICA - ID Copy" />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as StoredDocument["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to Transaction</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
              >
                <option value="">None</option>
                {transactions.map((t) => <option key={t.id} value={t.id}>{t.propertyAddress} ({t.stage.replace(/_/g, " ")})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Link to Contact</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
              >
                <option value="">None</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Button onClick={handleUpload} disabled={uploading || !file} className="w-full">
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
