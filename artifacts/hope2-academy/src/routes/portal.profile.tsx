
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Upload, Trash2, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal } from "@/components/Motion";
import { useAuth, ROLE_LABEL } from "@/hooks/use-auth";
import { apiClient, isNetworkError } from "@/lib/api-client";
import { mockAuth } from "@/lib/mock-backend";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

function ProfilePage() {
  const { profile, user, primaryRole, refresh } = useAuth();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const patch = {
      name: form.full_name,
      phone: form.phone,
      address: form.address,
      bio: form.bio,
      date_of_birth: form.date_of_birth || null,
      emergency_contact: form.emergency_contact,
    };
    try {
      await apiClient.updateProfile(patch);
      toast.success("Profile saved");
      await refresh();
    } catch (e) {
      if (!isNetworkError(e)) {
        toast.error((e as Error)?.message ?? "Could not save");
        setSaving(false);
        return;
      }
      try {
        await mockAuth.updateProfile(user.$id, patch);
        toast.success("Profile saved");
        await refresh();
      } catch (e2: any) {
        toast.error(e2?.message ?? "Could not save");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell title="My Profile" subtitle="Your account, photo and security settings">
      <div className="max-w-3xl space-y-6">
        <AvatarCard />

        <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Personal details</h2>
            {primaryRole && <Badge variant="secondary">{ROLE_LABEL[primaryRole]}</Badge>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(e)=>setForm({...form, full_name:e.target.value})}/></Field>
            <Field label="Email"><Input value={profile?.email ?? ""} disabled/></Field>
            <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e)=>setForm({...form, phone:e.target.value})}/></Field>
            <Field label="Date of birth"><Input type="date" value={form.date_of_birth ?? ""} onChange={(e)=>setForm({...form, date_of_birth:e.target.value})}/></Field>
            <Field label="Address" full><Input value={form.address ?? ""} onChange={(e)=>setForm({...form, address:e.target.value})}/></Field>
            <Field label="Emergency contact" full><Input value={form.emergency_contact ?? ""} onChange={(e)=>setForm({...form, emergency_contact:e.target.value})}/></Field>
            <Field label="Bio" full><Textarea rows={4} value={form.bio ?? ""} onChange={(e)=>setForm({...form, bio:e.target.value})}/></Field>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
              Save changes
            </Button>
          </div>
        </Reveal>

        <PasswordCard />

        <Reveal className="rounded-2xl bg-muted/40 border border-border p-5 text-sm text-muted-foreground flex gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <p>
            Your records are private to your account. You only see the modules, data and documents
            assigned to your role — other users cannot view your personal information unless it is
            explicitly shared through role permissions.
          </p>
        </Reveal>
      </div>
    </PortalShell>
  );
}

function AvatarCard() {
  const { profile, user, refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = preview ?? profile?.avatar_url ?? null;
  const initial = (profile?.full_name ?? "U").charAt(0).toUpperCase();

  const pick = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > MAX_AVATAR_BYTES) { toast.error("Image must be under 3 MB"); return; }
    try {
      setPendingFile(file);
      setPreview(URL.createObjectURL(file));
    }
    catch { toast.error("Could not read that image"); }
  };

  const persist = async (file: File | null) => {
    if (!user) return;
    setBusy(true);
    try {
      try {
        const avatar = file ? (await apiClient.uploadFile(file)).url : null;
        await apiClient.updateProfile({ avatar });
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        throw new Error("Profile picture uploads require the API server to be available");
      }
      setPendingFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      await refresh();
      toast.success(file ? "Profile picture updated" : "Profile picture removed");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update picture");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-xl font-semibold mb-4">Profile picture</h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border border-border grid place-items-center shrink-0">
          {current
            ? <img src={current} alt={`${profile?.full_name ?? "User"} profile picture`} className="h-full w-full object-cover" />
            : <span className="font-display text-3xl font-bold text-muted-foreground">{initial}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          <Button variant="outline" className="gap-2" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload className="h-4 w-4"/>Choose image
          </Button>
          {preview && (
               <Button className="gap-2" onClick={() => persist(pendingFile)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}Save picture
            </Button>
          )}
           {preview && <Button variant="ghost" onClick={() => { setPendingFile(null); URL.revokeObjectURL(preview); setPreview(null); }} disabled={busy}>Cancel</Button>}
          {!preview && profile?.avatar_url && (
             <Button variant="ghost" className="gap-2 text-destructive" onClick={() => persist(null)} disabled={busy}>
              <Trash2 className="h-4 w-4"/>Remove
            </Button>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">PNG or JPG up to 3 MB. Stored privately against your account.</p>
    </Reveal>
  );
}

function PasswordCard() {
  const { user } = useAuth();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!cur || !next) { toast.error("Enter your current and new password"); return; }
    if (next.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (next !== confirm) { toast.error("New passwords do not match"); return; }
    setBusy(true);
    try {
      try {
        await apiClient.changePassword(cur, next);
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        await mockAuth.changePassword(user.$id, cur, next);
      }
      // Keep the local demo store in sync so offline sign-in also works.
      try { await mockAuth.changePassword(user.$id, cur, next); } catch { /* already updated or absent */ }
      toast.success("Password updated");
      setCur(""); setNext(""); setConfirm("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-xl font-semibold mb-1">Change password</h2>
      <p className="text-sm text-muted-foreground mb-4">Verify your current password to set a new one.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Current password" full>
          <div className="relative">
            <Input type={show ? "text" : "password"} value={cur} onChange={(e)=>setCur(e.target.value)} autoComplete="current-password" />
            <button type="button" onClick={()=>setShow(s=>!s)} aria-label={show ? "Hide passwords" : "Show passwords"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
        </Field>
        <Field label="New password">
          <Input type={show ? "text" : "password"} value={next} onChange={(e)=>setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type={show ? "text" : "password"} value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={submit} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <KeyRound className="h-4 w-4"/>}
          Update password
        </Button>
      </div>
    </Reveal>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function RouteComponent() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}

export default RouteComponent;
