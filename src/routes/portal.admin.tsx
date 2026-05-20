import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, GraduationCap, UserPlus, Activity, Loader2 } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole, ROLE_LABEL } from "@/hooks/use-auth";
import { Reveal, StaggerGroup, motion } from "@/components/Motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/portal/admin")({
  component: () => (
    <RequireAuth allow={["superadmin", "admin"]}>
      <AdminPage />
    </RequireAuth>
  ),
});

interface Row { id: string; full_name: string | null; email: string | null; role: AppRole | null }

function AdminPage() {
  const { roles } = useAuth();
  const isSuper = roles.includes("superadmin");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").order("created_at", { ascending: false });
    const { data: ur } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map<string, AppRole>();
    (ur ?? []).forEach((r: any) => { map.set(r.user_id, r.role as AppRole); });
    setRows((profiles ?? []).map((p: any) => ({ ...p, role: map.get(p.id) ?? null })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (uid: string, role: AppRole) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success(`Role updated to ${ROLE_LABEL[role]}`);
    load();
  };

  return (
    <PortalShell title="Admin Console" subtitle="Manage users, assign roles, oversee operations">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={rows.length} />
        <StatCard icon={GraduationCap} label="Students" value={rows.filter(r=>r.role==="student").length} accent="secondary" />
        <StatCard icon={Activity} label="Teachers" value={rows.filter(r=>r.role==="teacher").length} accent="accent" />
        <StatCard icon={UserPlus} label="Alumni" value={rows.filter(r=>r.role==="alumni").length} />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-semibold">All Users</h2>
            <p className="text-sm text-muted-foreground">Assign roles. New users default to Alumni.</p>
          </div>
        </div>
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center font-semibold">
                    {(r.full_name ?? r.email ?? "U").slice(0,1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={r.role ?? undefined} onValueChange={(v)=>changeRole(r.id, v as AppRole)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="No role"/></SelectTrigger>
                    <SelectContent>
                      {(["alumni","student","parent","teacher","admin",...(isSuper?["superadmin" as AppRole]:[])] as AppRole[]).map(rr=> (
                        <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ))}
            {rows.length === 0 && <p className="p-8 text-center text-muted-foreground">No users yet.</p>}
          </div>
        )}
      </Reveal>
    </PortalShell>
  );
}