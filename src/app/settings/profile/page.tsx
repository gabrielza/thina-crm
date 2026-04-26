"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAgentProfile } from "@/lib/hooks/use-agent-profile";
import { useAuth } from "@/lib/hooks/use-auth";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, Save, Upload, UserCog, Building2, ShieldCheck, Palette, Globe, CheckCircle2 } from "lucide-react";
import type { AgentProfile } from "@/lib/firestore";

export default function AgentProfilePage() {
  const { user } = useAuth();
  const { profile, loading, saving, save } = useAgentProfile();
  const [form, setForm] = useState<AgentProfile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const set = <K extends keyof AgentProfile>(k: K, v: AgentProfile[K]) => {
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    // Auto-fill displayName if blank
    const displayName =
      form.displayName?.trim() || `${form.firstName} ${form.lastName}`.trim() || form.email;
    await save({ ...form, displayName });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  };

  const uploadImage = async (file: File, kind: "photo" | "logo"): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `agentProfiles/${user.uid}/${kind}-${Date.now()}.${ext}`;
    const storage = getFirebaseStorage();
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, "photo");
      set("photoUrl", url);
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be under 2MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, "logo");
      set("agencyLogoUrl", url);
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  if (loading || !form) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <UserCog className="h-6 w-6 text-primary" />
              Agent Profile
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              These details appear on every CMA report, listing brochure, and document you generate.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </div>

        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4 w-4 text-primary" /> Personal Details
            </CardTitle>
            <CardDescription>How you appear to clients on reports and signatures.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="e.g. Sarah Naidoo"
              />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input
                value={form.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
                placeholder="e.g. Principal Estate Agent"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27 ..." />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+27 ..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Short Bio</Label>
              <Textarea
                rows={3}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Two sentences about your experience and specialty areas."
              />
            </div>
          </CardContent>
        </Card>

        {/* Agency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Agency
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Agency Name</Label>
              <Input value={form.agencyName} onChange={(e) => set("agencyName", e.target.value)} />
            </div>
            <div>
              <Label>Branch / Office</Label>
              <Input value={form.branch} onChange={(e) => set("branch", e.target.value)} />
            </div>
            <div>
              <Label>Company Reg #</Label>
              <Input
                value={form.companyRegNumber}
                onChange={(e) => set("companyRegNumber", e.target.value)}
                placeholder="e.g. 2018/123456/07"
              />
            </div>
            <div>
              <Label>VAT Number</Label>
              <Input value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" /> EAAB / FFC Compliance
            </CardTitle>
            <CardDescription>
              Required to legally trade in SA. Surfaces on CMA reports for credibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>FFC Number</Label>
              <Input value={form.ffcNumber} onChange={(e) => set("ffcNumber", e.target.value)} />
            </div>
            <div>
              <Label>FFC Expiry</Label>
              <Input
                type="date"
                value={form.ffcExpiry}
                onChange={(e) => set("ffcExpiry", e.target.value)}
              />
            </div>
            <div>
              <Label>EAAB Reg #</Label>
              <Input value={form.eaabNumber} onChange={(e) => set("eaabNumber", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" /> Branding
            </CardTitle>
            <CardDescription>Photo, logo and brand colours used on your CMA PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Photo */}
              <div>
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-3 mt-2">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photoUrl}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      None
                    </div>
                  )}
                  <Label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-accent">
                      {uploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {form.photoUrl ? "Replace" : "Upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </Label>
                </div>
              </div>

              {/* Logo */}
              <div>
                <Label>Agency Logo</Label>
                <div className="flex items-center gap-3 mt-2">
                  {form.agencyLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.agencyLogoUrl}
                      alt="Logo"
                      className="h-16 w-auto max-w-[120px] object-contain border rounded p-1 bg-white"
                    />
                  ) : (
                    <div className="h-16 w-24 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      None
                    </div>
                  )}
                  <Label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-accent">
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {form.agencyLogoUrl ? "Replace" : "Upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Brand Primary Colour</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={form.brandPrimaryColor || "#0F766E"}
                    onChange={(e) => set("brandPrimaryColor", e.target.value)}
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={form.brandPrimaryColor}
                    onChange={(e) => set("brandPrimaryColor", e.target.value)}
                    placeholder="#0F766E"
                  />
                </div>
              </div>
              <div>
                <Label>Brand Accent Colour</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={form.brandAccentColor || "#F59E0B"}
                    onChange={(e) => set("brandAccentColor", e.target.value)}
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={form.brandAccentColor}
                    onChange={(e) => set("brandAccentColor", e.target.value)}
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Email Signature Block</Label>
              <Textarea
                rows={4}
                value={form.signatureBlock}
                onChange={(e) => set("signatureBlock", e.target.value)}
                placeholder="Sarah Naidoo&#10;Principal Estate Agent · Thina Realty&#10;+27 82 123 4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" /> Web & Social
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <Label>Facebook URL</Label>
              <Input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <Label>Instagram Handle</Label>
              <Input value={form.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} placeholder="@yourhandle" />
            </div>
          </CardContent>
        </Card>

        {/* Footer save */}
        <div className="flex justify-end pb-12">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Profile
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
