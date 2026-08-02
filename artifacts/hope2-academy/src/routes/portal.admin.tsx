
import { useEffect, useState } from "react";
import { Users, GraduationCap, UserPlus, Activity, Loader2, Trash2, Plus, ShieldCheck, BookOpen, Heart } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { apiClient, isNetworkError, type ApiUser } from "@/lib/api-client";
import { mockAuth, ROLE_LABEL, APP_ROLES } from "@/lib/mock-backend";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Reveal, StaggerGroup, motion } from "@/components/Motion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type UserRow = ApiUser & { id: string };

// Staff roles vs learner/family roles for grouped display
const STAFF_ROLES_SET = new Set<AppRole>(["superadmin","admin","admin_assistant","registrar","admissions_officer","teacher","nurse"]);

// Ordered list of all roles available when inviting / changing roles
const ALL_ROLES: AppRole[] = [
  "student","parent","alumni",
  "teacher","nurse",
  "admin_assistant","registrar","admissions_officer","admin",
];

function roleBadge(role: AppRole) {
  const isStaff = STAFF_ROLES_SET.has(role);
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
      role === "superadmin" ? "bg-destructive/10 text-destructive"
      : role === "admin" || role === "admin_assistant" ? "bg-primary/10 text-primary"
      : role === "teacher" ? "bg-accent/30 text-accent-foreground"
      : role === "nurse" ? "bg-green-100 text-green-700"
      : role === "registrar" || role === "admissions_officer" ? "bg-purple-100 text-purple-700"
      : role === "student" ? "bg-sky-100 text-sky-700"
      : role === "parent" ? "bg-orange-100 text-orange-700"
      : "bg-muted text-foreground/70"
    }`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

function AdminPage() {
  const { roles } = useAuth();
  const isSuper = roles.includes("superadmin");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | AppRole>("all");
  const [newUser, setNewUser] = useState<{ email: string; name: string; role: AppRole }>({ email: "", name: "", role: "student" });

  const load = async () => {
    setLoading(true);
    try {
      const list = await apiClient.listUsers();
      setRows(list as UserRow[]);
    } catch (e) {
      if (!isNetworkError(e)) {
        toast.error((e as Error)?.message ?? "Could not load users");
      } else {
        try {
          const list = await mockAuth.listUsers();
          setRows(list as unknown as UserRow[]);
        } catch (e2: any) {
          toast.error(e2?.message ?? "Could not load users");
        }
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (uid: string, role: AppRole) => {
    try {
      await apiClient.changeRole(uid, role);
      toast.success(`Role updated to ${ROLE_LABEL[role]}`);
      load();
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not change role"); return; }
      try {
        await mockAuth.changeRole(uid, role);
        toast.success(`Role updated to ${ROLE_LABEL[role]}`);
        load();
      } catch (e2: any) { toast.error(e2?.message ?? "Could not change role"); }
    }
  };

  const removeUser = async (uid: string) => {
    try { await apiClient.deleteUser(uid); }
    catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete user"); return; }
      await mockAuth.deleteUser(uid);
    }
    toast.success("User removed");
    load();
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.name) { toast.error("Name and email required"); return; }
    try {
      await apiClient.createUser(newUser);
      toast.success(`Invited ${newUser.name} as ${ROLE_LABEL[newUser.role]}`);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not create user"); return; }
      try {
        await mockAuth.createUser(newUser);
        toast.success(`Invited ${newUser.name} as ${ROLE_LABEL[newUser.role]}`);
      } catch (e2: any) { toast.error(e2?.message ?? "Could not create user"); return; }
    }
    setOpen(false);
    setNewUser({ email: "", name: "", role: "student" });
    load();
  };

  // Stats
  const staffCount = rows.filter(r => STAFF_ROLES_SET.has(r.role as AppRole) && r.role !== "superadmin").length;
  const studentCount = rows.filter(r => r.role === "student").length;
  const parentCount = rows.filter(r => r.role === "parent").length;
  const alumniCount = rows.filter(r => r.role === "alumni").length;

  // Role counts for breakdown chips
  const countsByRole = Object.fromEntries(
    (APP_ROLES as readonly AppRole[]).map(r => [r, rows.filter(x => x.role === r).length])
  );

  // Filtered rows for the table
  const availableRoles: AppRole[] = isSuper ? [...ALL_ROLES, "superadmin"] : ALL_ROLES;
  const visibleRows = rows.filter(r => {
    const matchRole = filterRole === "all" || r.role === filterRole;
    const matchSearch = !search ||
      (r.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <PortalShell title="User Management" subtitle="Invite users, assign roles, and manage every account type">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Accounts" value={rows.length} />
        <StatCard icon={GraduationCap} label="Students"      value={studentCount}  accent="secondary" />
        <StatCard icon={ShieldCheck}  label="Staff Members"  value={staffCount}    accent="accent" />
        <StatCard icon={UserPlus}     label="Parents & Alumni" value={parentCount + alumniCount} />
      </StaggerGroup>

      {/* Role breakdown chips */}
      <Reveal className="mt-4 flex flex-wrap gap-2">
        {(isSuper ? [...ALL_ROLES, "superadmin" as AppRole] : ALL_ROLES).map(r => (
          countsByRole[r] > 0 && (
            <button
              key={r}
              onClick={() => setFilterRole(filterRole === r ? "all" : r)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filterRole === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {ROLE_LABEL[r]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filterRole === r ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{countsByRole[r]}</span>
            </button>
          )
        ))}
      </Reveal>

      <Reveal className="mt-6 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {filterRole === "all" ? "All Accounts" : `${ROLE_LABEL[filterRole]} Accounts`}
            </h2>
            <p className="text-sm text-muted-foreground">Invite, assign roles, and manage your school directory.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-52"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shrink-0"><Plus className="h-4 w-4"/> Invite user</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite a new user</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Full name</Label><Input value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} placeholder="Jane Doe"/></div>
                  <div><Label>Email</Label><Input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} placeholder="jane@hope2.demo"/></div>
                  <div>
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(v)=>setNewUser({...newUser, role: v as AppRole})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Learners & Family</div>
                        {(["student","parent","alumni"] as AppRole[]).map(rr => (
                          <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                        ))}
                        <div className="px-2 py-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Academic Staff</div>
                        {(["teacher","nurse"] as AppRole[]).map(rr => (
                          <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                        ))}
                        <div className="px-2 py-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Administration</div>
                        {(["admin_assistant","registrar","admissions_officer","admin",...(isSuper?["superadmin" as AppRole]:[])] as AppRole[]).map(rr => (
                          <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Default password: <span className="font-mono">demo1234</span></p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                  <Button onClick={createUser}>Send invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>
        ) : (
          <div className="divide-y divide-border">
            {visibleRows.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center font-semibold shrink-0">
                    {(r.name ?? r.email ?? "U").slice(0,1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:block">{roleBadge(r.role as AppRole)}</div>
                  <Select value={r.role ?? undefined} onValueChange={(v)=>changeRole(r.id, v as AppRole)}>
                    <SelectTrigger className="w-[170px]"><SelectValue placeholder="No role"/></SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Learners & Family</div>
                      {(["student","parent","alumni"] as AppRole[]).map(rr => (
                        <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                      ))}
                      <div className="px-2 py-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Academic Staff</div>
                      {(["teacher","nurse"] as AppRole[]).map(rr => (
                        <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                      ))}
                      <div className="px-2 py-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Administration</div>
                      {(["admin_assistant","registrar","admissions_officer","admin",...(isSuper?["superadmin" as AppRole]:[])] as AppRole[]).map(rr => (
                        <SelectItem key={rr} value={rr}>{ROLE_LABEL[rr]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={()=>removeUser(r.id)} aria-label="Delete user">
                    <Trash2 className="h-4 w-4 text-destructive"/>
                  </Button>
                </div>
              </motion.div>
            ))}
            {visibleRows.length === 0 && (
              <p className="p-8 text-center text-muted-foreground">
                {search || filterRole !== "all" ? "No matching accounts." : "No users yet."}
              </p>
            )}
          </div>
        )}
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["admin","superadmin"]}>
      <AdminPage />
    </RequireAuth>
  );
}

export default RouteComponent;
