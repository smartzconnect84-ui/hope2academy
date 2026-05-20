import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — HOPE2-LIBERIA Portal" },
      { name: "description", content: "Access your HOPE2-LIBERIA portal: Super Admin, Admin, Teacher, Student, Parent and Alumni dashboards." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/portal" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/portal" });
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="absolute inset-0 -z-10 bg-background/40 backdrop-blur-[2px]" />
      <div className="container mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-primary-foreground hidden lg:block"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-widest uppercase">
            <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
            HOPE2-LIBERIA Portal
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-semibold leading-[1.05] mt-6">
            Welcome back to the<br />movement of compassion.
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/90 max-w-md">
            Sign in to access your dashboard — whether you're an administrator, teacher, student, parent or alum.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {["Super Admin","Admin","Teacher","Student","Parent","Alumni"].map((r,i)=>(
              <motion.div
                key={r}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i*0.05 }}
                className="rounded-xl bg-white/10 backdrop-blur px-3 py-2 text-xs font-medium text-center"
              >{r}</motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-3xl bg-card shadow-[var(--shadow-warm)] border border-border p-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">Sign in</h2>
                <p className="text-xs text-muted-foreground">Access your HOPE2-LIBERIA portal</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@hope2liberia.org" className="pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 text-base font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Admin-invite only.</strong> Accounts are created by Super Admins or Admins. If you don't have credentials yet, <Link to="/contact" className="text-primary font-semibold underline">contact us</Link>.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}