"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Pencil, Phone, Mail } from "lucide-react";
import { getContacts, deleteContact, type Contact } from "@/lib/firestore";
import { EditContactSheet } from "@/components/edit-contact-sheet";

interface ContactsTableProps {
  refreshKey: number;
}

export function ContactsTable({ refreshKey }: ContactsTableProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await deleteContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setEditOpen(true);
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(deferredSearch.toLowerCase()) ||
    c.company.toLowerCase().includes(deferredSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-[13px] border-border/50 bg-background" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/50 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">{contacts.length === 0 ? "No contacts yet. Click 'Add Contact' to get started!" : "No contacts match your search."}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contact) => (
                  <TableRow key={contact.id} className="cursor-pointer" onClick={() => router.push(`/contacts/${contact.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary text-xs font-semibold">{contact.name.charAt(0)}</div>
                        <div><p className="font-medium text-[13px]">{contact.name}</p><p className="text-[11px] text-muted-foreground">{contact.email}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contact.company || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[13px]">{contact.title || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[13px]">{contact.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {contact.phone && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(`tel:${contact.phone}`); }}><Phone className="h-3.5 w-3.5" /></Button>}
                        {contact.email && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(`mailto:${contact.email}`); }}><Mail className="h-3.5 w-3.5" /></Button>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(contact); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); contact.id && handleDelete(contact.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {filtered.map((contact) => (
              <div key={contact.id} className="rounded-xl border border-border/50 p-4 active:bg-muted/30 transition-colors" onClick={() => router.push(`/contacts/${contact.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{contact.name.charAt(0)}</div>
                    <div><p className="font-medium text-sm">{contact.name}</p><p className="text-[12px] text-muted-foreground">{contact.company}</p></div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <span className="text-[12px] text-muted-foreground">{contact.title || "—"}</span>
                  <span className="text-[12px] text-muted-foreground">{contact.phone || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <EditContactSheet contact={editContact} open={editOpen} onOpenChange={setEditOpen} onContactUpdated={fetchContacts} />
    </div>
  );
}
