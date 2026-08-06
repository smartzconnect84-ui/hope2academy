import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, Lock, Loader2, Eye, EyeOff, KeyRound, Sparkles, ChevronRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { DEMO_CREDENTIALS, ROLE_LABEL, mockAuth } from "@/lib/mock-backend";
import { apiClient, isNetworkError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Logo, BrandWordmark } from "@/components/Logo";
import { useBrand } from "@/lib/brand";
import loginBg from "@/assets/login-bg.jpg.asset.json";

/* ── Forgot-password dialog — uses account EMAIL for reset ───────────────── */
function ForgotPasswordDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setStep("request"); setEmail(""); setCode(""); setNewPassword(""); } }, [open]);

  const request = async () => {
    setBusy(true);
    try {
      let token: string;
      try { token = await apiClient.requestPasswordReset(email); }
      catch (err) { if (!isNetworkError(err)) throw err; token = await mockAuth.requestPasswordReset(email); }
      setCode(token); setStep("reset");
      toast.success("Reset code generated", { description: `Demo mode — your code is ${token}` });
    } catch (e: any) { toast.error(e?.message ?? "Could not start password reset"); }
    finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    try {
      try {
        await apiClient.resetPassword(email, code, newPassword);
        try { const local = await mockAuth.requestPasswordReset(email); await mockAuth.resetPassword(email, local, newPassword); } catch { /* not in local store */ }
      } catch (err) { if (!isNetworkError(err)) throw err; await mockAuth.resetPassword(email, code, newPassword); }
      toast.success("Password updated — you can sign in with your username now"); onOpenChange(false);
    } catch (e: any) { toast.error(e?.message ?? "Could not reset password"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Reset your password</DialogTitle>
          <DialogDescription>
            {step === "request"
              ? "Enter the email address linked to your account and we'll issue a reset code."
              : "Enter the reset code and choose a new password."}
          </DialogDescription>
        </DialogHeader>
        {step === "request" ? (
          <div className="space-y-3">
            <Label htmlFor="reset-email">Account email address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hope2academy.org" className="pl-10" />
            </div>
            <p className="text-xs text-muted-foreground">Your login username is separate from your email. Email is only used for resetting your password.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div><Label htmlFor="reset-code">Reset code</Label><Input id="reset-code" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5 font-mono" /></div>
            <div><Label htmlFor="reset-pass">New password</Label><Input id="reset-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="mt-1.5" /></div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={step === "request" ? request : reset} disabled={busy || (step === "request" ? !email : !code || newPassword.length < 8)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : step === "request" ? "Send reset code" : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main login page ─────────────────────────────────────────────────────── */
function LoginPage() {
  const { user, loading, refresh, signIn } = useAuth();
  const navigate = useNavigate();
  const brand = useBrand();
  const [username, setUsername] = useState(() => mockAuth.getRememberedUsername());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => Boolean(mockAuth.getRememberedUsername()));
  const [forgotOpen, setForgotOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  useEffect(() => { if (!loading && user) navigate("/portal"); }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(username, password);
      mockAuth.setRememberedUsername(remember ? username : null);
      toast.success("Welcome back");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally { setSubmitting(false); }
  };

  const fillDemo = (u: string, p: string) => { setUsername(u); setPassword(p); };

  const quickSignIn = async (role: string, u: string, p: string) => {
    setActiveDemo(role); setUsername(u); setPassword(p); setSubmitting(true);
    try {
      await signIn(u, p);
      toast.success("Signed in as demo user");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally { setSubmitting(false); setActiveDemo(null); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL — campus photo + branding + demo credentials (desktop) ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative hidden lg:flex lg:flex-col lg:w-[58%] xl:w-[60%] overflow-hidden"
      >
        {/* Background campus photo */}
        <img
          src={loginBg.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Rich gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(20%_0.09_27)] via-[oklch(18%_0.07_27)/90] to-[oklch(12%_0.04_27)]" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, oklch(28% 0.14 27 / 0.85) 0%, oklch(15% 0.08 200 / 0.9) 100%)" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3 text-white">
            <Logo size={44} className="ring-white/20" />
            <div>
              <p className="font-display font-bold text-base tracking-wide"><BrandWordmark /></p>
              <p className="text-[11px] text-white/60 uppercase tracking-widest">Portal</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-4"
            >
              Barber's Joe Town · Margibi County · Liberia
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="font-display text-4xl xl:text-5xl font-semibold leading-[1.08] text-white"
            >
              Welcome back to the{" "}
              <span className="text-[oklch(80%_0.18_55)]">movement</span>{" "}
              of compassion.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-5 text-base text-white/70 leading-relaxed"
            >
              Sign in to access your dashboard — administrator, teacher,<br />student, parent, or alumnus.
            </motion.p>
          </div>

          {/* Demo credentials panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="rounded-2xl bg-white/8 backdrop-blur-md border border-white/12 p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[oklch(80%_0.18_55)]" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Demo accounts</p>
            </div>
            <p className="text-[11px] text-white/50 mb-3">Click any role to sign in instantly. Password: <span className="font-mono text-white/70">demo1234</span></p>
            <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  disabled={submitting}
                  onClick={() => quickSignIn(c.role, c.username, c.password)}
                  className="group relative flex items-center justify-between rounded-xl bg-white/8 hover:bg-white/16 active:bg-white/20 border border-white/8 hover:border-white/20 px-3 py-2.5 text-left transition-all disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-none">{ROLE_LABEL[c.role]}</p>
                    <p className="text-[10px] text-white/50 truncate mt-0.5 font-mono">{c.username}</p>
                  </div>
                  {activeDemo === c.role
                    ? <Loader2 className="h-3 w-3 shrink-0 text-white/50 animate-spin ml-1" />
                    : <ChevronRight className="h-3 w-3 shrink-0 text-white/30 group-hover:text-white/60 transition ml-1" />
                  }
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Subtle decorative edge */}
        <div className="absolute right-0 inset-y-0 w-px bg-white/10" />
      </motion.div>

      {/* ── RIGHT PANEL — sign-in form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12 lg:px-14 xl:px-20">
        {/* Mobile background photo */}
        <div className="absolute inset-0 lg:hidden -z-10">
          <img src={loginBg.url} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-foreground/60" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-3xl bg-card/98 lg:bg-card backdrop-blur-sm border border-border shadow-[0_32px_80px_-12px_rgba(0,0,0,0.18)] p-7 sm:p-9">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="lg:hidden">
                <Logo size={48} />
              </div>
              <div className="hidden lg:block">
                <Logo size={52} />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold leading-tight">Sign in</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Access your {brand.name} portal</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative mt-1.5">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="firstname@hope2academy"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-11 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">Remember me on this device</Label>
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-semibold mt-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />

            {/* Admin-only note */}
            <div className="mt-5 rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Admin-invite only.</strong>{" "}
              Accounts are created by Super Admins or Admins. No credentials?{" "}
              <Link to="/contact" className="text-primary font-semibold underline">Contact us</Link>.
            </div>
          </div>

          {/* Mobile demo accounts — below the card */}
          <div className="mt-5 lg:hidden">
            <div className="rounded-2xl bg-card/90 backdrop-blur border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Demo accounts</p>
              <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 max-h-64 overflow-y-auto">
                {DEMO_CREDENTIALS.map((c) => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => fillDemo(c.username, c.password)}
                    className="rounded-xl border border-border px-2.5 py-2 text-left text-[11px] hover:border-primary hover:bg-muted transition"
                  >
                    <span className="font-semibold block">{ROLE_LABEL[c.role]}</span>
                    <span className="text-muted-foreground block truncate font-mono">{c.username}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Password: <span className="font-mono font-semibold">demo1234</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
