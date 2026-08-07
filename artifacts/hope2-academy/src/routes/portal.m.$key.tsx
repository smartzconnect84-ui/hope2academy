import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback, type ReactNode, type ReactElement } from "react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup, motion } from "@/components/Motion";
import { mockDb, mockAuth, ROLE_LABEL } from "@/lib/mock-backend";
import { apiClient, isNetworkError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Calendar, ClipboardList, Award, Users, BookOpen, Heart,
  DollarSign, Briefcase, Library, FileText, Image as ImageIcon, Newspaper,
  MessageSquare, Megaphone, BarChart3, FolderTree, Settings, Search,
  Plus, Inbox, CheckCircle2, Upload, Download, ArrowUpRight, Sparkles,
  Trash2, Edit3, Copy, ChevronUp, ChevronDown as ChevronDownIcon, ListTree, RotateCcw, Loader2,
} from "lucide-react";
import { Mail, Send, Wallet, Receipt, PieChart, FileSpreadsheet, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { scopeRows, canWrite, canDownload, stampOwner, isAdminLevel, type Principal } from "@/lib/rbac";
import { approvalsStore, APPROVAL_CATEGORIES, CATEGORY_LOCKS, type ApprovalRequest, type ApprovalAttachment } from "@/lib/approvals";
import { moduleAccessStore, CONTROLLABLE_ROLES, CONTROLLABLE_ROLE_LABELS, ROLE_MODULE_KEYS, MODULE_LABELS } from "@/lib/module-access";
import { nextAdmissionNo } from "@/lib/mock-backend";
import { Switch } from "@/components/ui/switch";
import { cmsStore, useCmsVersion, readFileAsDataUrl, type CmsPage, type CmsMedia, type NavItem } from "@/lib/cms-store";
import { brandStore, useBrand, readFileAsDataUrl as readBrandFile, type BrandSettings } from "@/lib/brand";
import { heroStore, useHeroSlides, type HeroSlide } from "@/lib/hero-store";
import { teamStore, useTeamContent, type TeamMember } from "@/lib/team-store";
import { ProjectsContentModule, StoriesContentModule, DivisionsContentModule, HomepageContentModule } from "@/components/portal/ContentEditors";
import { ReportsModule } from "@/components/portal/Reports";
import { DigitalLibraryModule } from "@/components/portal/DigitalLibrary";
import { SubmissionsModule } from "@/components/portal/Submissions";
import { AssessmentsModule } from "@/components/portal/Assessments";
import { GradeSheetModule, ReportCardModule } from "@/components/portal/ReportCards";
import {
  FeesModule, ExpensesModule, PayrollModule, DonationsModule,
} from "@/components/portal/ReceiptGenerator";
import { ck12Store } from "@/lib/ck12-library";
import { publicForms } from "@/lib/public-forms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// All finances are tracked in USD; we display the LRD equivalent alongside.
// Editable rate persisted in localStorage so Admins can update it.
const LRD_KEY = "h2l.fx.lrd_per_usd";
function getLrdRate(): number {
  if (typeof localStorage === "undefined") return 200;
  const v = Number(localStorage.getItem(LRD_KEY));
  return v > 0 ? v : 200;
}
function fmtUSD(v: number | string) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmtMoney(v: number | string) {
  const n = Number(v || 0);
  const lrd = Math.round(n * getLrdRate());
  return `${fmtUSD(n)} · LRD ${lrd.toLocaleString()}`;
}

type ModuleDef = {
  title: string;
  subtitle: string;
  icon: any;
  allow?: AppRole[];
  render: () => ReactElement;
};

/** Build the RBAC principal for the signed-in user. */
export function usePrincipal(): Principal | null {
  const { profile, primaryRole } = useAuth();
  if (!profile) return null;
  return {
    id: profile.$id,
    name: profile.full_name ?? profile.email ?? "",
    email: profile.email,
    role: primaryRole,
    class_name: (profile as any).class_name ?? null,
    grade: (profile as any).grade ?? null,
    linked_children: (profile as any).linked_children ?? null,
  };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] ${className}`}>{children}</div>;
}

function MentorshipModule() {
  const principal = usePrincipal();

  const apply = () => {
    if (!principal?.email) {
      toast.error("We couldn't find your account email. Please update your profile first.");
      return;
    }
    publicForms.submitMentorship({
      name: principal.name,
      email: principal.email,
      motivation: "Alumni mentorship application",
    });
    toast.success("Mentorship application recorded — our team will reach out.");
  };

  return (
    <Card className="p-8 text-center">
      <Heart className="h-10 w-10 text-primary mx-auto"/>
      <h3 className="mt-3 font-display text-2xl font-semibold">Become a mentor</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">Pair with a student in their final two years and meet monthly. We provide structure, you provide perspective.</p>
      <Button className="mt-5" onClick={apply}>Sign me up</Button>
    </Card>
  );
}

function TableShell({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>{head.map(h => <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }} className="hover:bg-muted/30">
                {r.map((c, j) => <td key={j} className="px-5 py-3.5">{c}</td>)}
              </motion.tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-muted-foreground">No records yet.</p>}
      </div>
    </Card>
  );
}

function statusBadge(s: string) {
  const tone = s.toLowerCase();
  const cls =
    tone === "published" || tone === "paid" || tone === "active"
      ? "bg-primary/10 text-primary"
      : tone === "draft" || tone === "open"
      ? "bg-accent/30 text-accent-foreground"
      : tone === "outstanding" || tone === "absent"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-foreground/70";
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>{s}</span>;
}

/** Staff roles that appear in the HR module (ordered for display). */
const HR_STAFF_ROLES: AppRole[] = [
  "superadmin", "admin", "admin_assistant", "registrar", "admissions_officer", "teacher", "nurse",
];

const HR_ROLE_GROUPS: { label: string; roles: AppRole[] }[] = [
  { label: "Administration", roles: ["superadmin", "admin", "admin_assistant", "registrar", "admissions_officer"] },
  { label: "Academic & Health", roles: ["teacher", "nurse"] },
];

function StaffModule() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<AppRole | "all">("all");

  useEffect(() => {
    (async () => {
      try {
        const list = await apiClient.listUsers();
        setUsers(list);
      } catch {
        const list = await mockAuth.listUsers();
        setUsers(list as any[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const staffUsers = users.filter(u => HR_STAFF_ROLES.includes(u.role as AppRole));

  const visible = filterRole === "all"
    ? staffUsers
    : staffUsers.filter(u => u.role === filterRole);

  const countByRole = Object.fromEntries(
    HR_STAFF_ROLES.map(r => [r, staffUsers.filter(u => u.role === r).length])
  );

  if (loading) {
    return <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Group filter chips */}
      <div className="space-y-3">
        {HR_ROLE_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterRole("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  filterRole === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >All Staff <span className="opacity-60 ml-1">{staffUsers.length}</span></button>
              {group.roles.filter(r => countByRole[r] > 0).map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRole(filterRole === r ? "all" : r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filterRole === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {ROLE_LABEL[r]}
                  <span className="opacity-60 ml-1">{countByRole[r]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                {["Name", "Role", "Email", "Department", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center text-xs font-bold shrink-0">
                        {(u.name ?? u.email ?? "?").slice(0,1).toUpperCase()}
                      </div>
                      <span className="font-medium">{u.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      u.role === "superadmin" ? "bg-destructive/10 text-destructive"
                      : u.role === "admin" || u.role === "admin_assistant" ? "bg-primary/10 text-primary"
                      : u.role === "teacher" ? "bg-accent/30 text-accent-foreground"
                      : u.role === "nurse" ? "bg-green-100 text-green-700"
                      : "bg-purple-100 text-purple-700"
                    }`}>
                      {ROLE_LABEL[u.role as AppRole] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.department ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">Active</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">
              {filterRole === "all" ? "No staff accounts yet." : `No ${ROLE_LABEL[filterRole as AppRole]} accounts yet.`}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// =========================================================================
// Admissions Module — with auto-generated Admission Numbers
// =========================================================================
function AdmissionsModule() {
  const principal = usePrincipal();
  const canEdit = canWrite("admissions", principal?.role ?? null);
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<any>({});

  const load = () => setRows(mockDb.list<any>("admissions"));
  useEffect(() => { load(); }, []);

  const GRADE_OPTIONS = ["Nursery","KG-1","KG-2","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
  const STATUS_OPTIONS = ["Pending","Interview","Accepted","Enrolled","Rejected","Waitlist"];

  const openCreate = () => {
    setForm({ applicant: "", grade: "Grade 1", guardian: "", phone: "", submitted: new Date().toISOString().slice(0,10), status: "Pending", admission_no: nextAdmissionNo() });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (row: any) => { setForm({...row}); setEditing(row); setOpen(true); };
  const save = () => {
    if (!form.applicant || !form.guardian) { toast.error("Applicant name and guardian are required"); return; }
    if (editing) { mockDb.update("admissions", editing.id, form); toast.success("Application updated"); }
    else { mockDb.create("admissions", form); toast.success(`Application recorded · ${form.admission_no}`); }
    setOpen(false); load();
  };
  const remove = (id: string) => { if (!confirm("Delete this application?")) return; mockDb.remove("admissions", id); toast.success("Deleted"); load(); };

  const visible = rows.filter((r) => !q || [r.applicant, r.guardian, r.admission_no].some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase())));

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applicant, guardian, ADM number…" className="pl-9 bg-card" />
        </div>
        {canEdit && <Button className="gap-2 shrink-0" onClick={openCreate}><Plus className="h-4 w-4" /> New application</Button>}
      </div>

      <TableShell
        head={["ADM No.", "Applicant", "Grade", "Guardian", "Phone", "Submitted", "Status", ...(canEdit ? [""] : [])]}
        rows={visible.map((r) => [
          <span className="font-mono text-xs text-muted-foreground">{r.admission_no ?? "—"}</span>,
          <span className="font-medium">{r.applicant}</span>,
          r.grade,
          r.guardian,
          r.phone ?? "—",
          r.submitted,
          statusBadge(r.status),
          ...(canEdit ? [
            <div className="flex items-center gap-2 justify-end">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(r)}><Edit3 className="h-3.5 w-3.5" />Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ] : []),
        ])}
      />

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit application" : "New admission application"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Admission Number (auto-generated)</Label>
              <div className="flex gap-2">
                <Input value={form.admission_no ?? ""} onChange={(e) => set("admission_no", e.target.value)} className="font-mono text-sm" placeholder="ADM-2026-0001" />
                <Button type="button" variant="outline" size="icon" onClick={() => set("admission_no", nextAdmissionNo())} title="Regenerate"><RotateCcw className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Applicant name</Label><Input value={form.applicant ?? ""} onChange={(e) => set("applicant", e.target.value)} placeholder="Full name" /></div>
              <div>
                <Label>Grade applying for</Label>
                <Select value={form.grade ?? ""} onValueChange={(v) => set("grade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Parent / Guardian</Label><Input value={form.guardian ?? ""} onChange={(e) => set("guardian", e.target.value)} placeholder="Guardian name" /></div>
              <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+231 770 000 000" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Submitted</Label><Input type="date" value={form.submitted ?? ""} onChange={(e) => set("submitted", e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status ?? ""} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Submit application"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// =========================================================================
// Module Access Control — Admin/Superadmin toggle modules per staff role
// =========================================================================
function ModuleAccessModule() {
  const [selectedRole, setSelectedRole] = useState<string>(CONTROLLABLE_ROLES[0]);
  const [, forceUpdate] = useState(0);

  const moduleKeys = ROLE_MODULE_KEYS[selectedRole as keyof typeof ROLE_MODULE_KEYS] ?? [];

  const toggle = (moduleKey: string) => {
    const current = moduleAccessStore.isEnabled(selectedRole, moduleKey);
    moduleAccessStore.setEnabled(selectedRole, moduleKey, !current);
    forceUpdate((n) => n + 1);
    toast.success(`${MODULE_LABELS[moduleKey] ?? moduleKey}: ${!current ? "enabled" : "disabled"} for ${CONTROLLABLE_ROLE_LABELS[selectedRole as keyof typeof CONTROLLABLE_ROLE_LABELS]}`);
  };

  const enableAll = () => {
    moduleAccessStore.enableAll(selectedRole);
    forceUpdate((n) => n + 1);
    toast.success(`All modules enabled for ${CONTROLLABLE_ROLE_LABELS[selectedRole as keyof typeof CONTROLLABLE_ROLE_LABELS]}`);
  };

  const enabledCount = moduleKeys.filter((k) => moduleAccessStore.isEnabled(selectedRole, k)).length;

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <p className="text-sm text-muted-foreground mb-3">
          Use the toggle switches below to grant or remove module access from each staff role.
          Superadmin and Admin always retain full access regardless of these settings.
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTROLLABLE_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                selectedRole === role
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/60"
              }`}
            >
              {CONTROLLABLE_ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-display text-lg font-semibold">{CONTROLLABLE_ROLE_LABELS[selectedRole as keyof typeof CONTROLLABLE_ROLE_LABELS]}</h3>
            <p className="text-sm text-muted-foreground">{enabledCount} of {moduleKeys.length} modules enabled</p>
          </div>
          <Button variant="outline" size="sm" onClick={enableAll}>Enable all</Button>
        </div>

        <div className="divide-y divide-border">
          {moduleKeys.map((moduleKey) => {
            const enabled = moduleAccessStore.isEnabled(selectedRole, moduleKey);
            return (
              <motion.div
                key={moduleKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30"
              >
                <div>
                  <p className={`font-medium text-sm ${!enabled ? "text-muted-foreground line-through" : ""}`}>
                    {MODULE_LABELS[moduleKey] ?? moduleKey}
                  </p>
                  <p className="text-xs text-muted-foreground">/portal/m/{moduleKey}</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => toggle(moduleKey)}
                  aria-label={`Toggle ${moduleKey} for ${selectedRole}`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const MODULES: Record<string, ModuleDef> = {
  classes: {
    title: "Classes", subtitle: "All active classes across campuses", icon: GraduationCap,
    render: () => <ClassesModule/>,
  },
  assignments: {
    title: "Assignments", subtitle: "Track open and graded work", icon: ClipboardList,
    render: () => <AssignmentsModule/>,
  },
  submissions: {
    title: "Submissions Register", subtitle: "Upload, submit, review and grade student work", icon: Upload,
    render: () => <SubmissionsModule/>,
  },
  assessments: {
    title: "Assessments", subtitle: "Quizzes, tests and exams — auto-graded and posted straight to the grade sheet", icon: CheckCircle2,
    render: () => <AssessmentsModule/>,
  },
  gradesheet: {
    title: "Academic Transcripts", subtitle: "Period grades, semester exams and cumulative averages", icon: FileSpreadsheet,
    render: () => <GradeSheetModule/>,
  },
  reportcard: {
    title: "Progress Reports", subtitle: "Printable term and end-of-year progress reports", icon: Award,
    render: () => <ReportCardModule/>,
  },
  grades: {
    title: "Grade Book", subtitle: "Scores by student and subject", icon: Award,
    render: () => (
      <>
        <GradesStats/>
        <SimpleCrud
          collection="grades"
          itemLabel="grade entry"
          fields={[
            { name: "student", label: "Student", type: "text", required: true },
            { name: "subject", label: "Subject", type: "text", required: true },
            { name: "score", label: "Score (0-100)", type: "number", required: true },
            { name: "grade", label: "Letter grade", type: "text", required: true, placeholder: "A, B+, …" },
            { name: "term", label: "Period", type: "select", options: ["Period 1","Period 2","Period 3"], required: true },
          ]}
          columns={[
            { key: "student", label: "Student" },
            { key: "subject", label: "Subject" },
            { key: "score", label: "Score", render: (v) => `${v}%` },
            { key: "grade", label: "Grade", render: (v) => <span className="font-display font-bold text-primary">{v}</span> },
            { key: "term", label: "Period" },
          ]}
        />
      </>
    ),
  },
  attendance: {
    title: "Attendance Register", subtitle: "Daily roll-call records across all classes", icon: Calendar,
    render: () => (
      <SimpleCrud
        collection="attendance"
        itemLabel="attendance record"
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "class", label: "Class", type: "text", required: true },
          { name: "present", label: "Present", type: "number", required: true },
          { name: "absent", label: "Absent", type: "number", required: true },
          { name: "late", label: "Late", type: "number" },
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "class", label: "Class" },
          { key: "present", label: "Present" },
          { key: "absent", label: "Absent" },
          { key: "late", label: "Late" },
        ]}
      />
    ),
  },
  timetable: {
    title: "Timetable", subtitle: "Weekly schedule", icon: Calendar,
    render: () => <TimetableModule/>,
  },
  announcements: {
    title: "Announcements", subtitle: "School-wide notices visible in the scrolling banner for all accounts", icon: Megaphone,
    render: () => (
      <SimpleCrud
        collection="announcements"
        itemLabel="announcement"
        createLabel="Post announcement"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "audience", label: "Audience", type: "select", options: ["All","Students","Parents","Staff","Alumni"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "body", label: "Body / Message", type: "textarea", required: true },
          { name: "pinned", label: "Pin to banner", type: "select", options: ["Yes","No"] },
          { name: "active", label: "Status", type: "select", options: ["Active","Archived"] },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "audience", label: "Audience", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "pinned", label: "Pinned", render: (v) => v === "Yes" ? <Badge className="bg-primary text-primary-foreground">Pinned</Badge> : <span className="text-muted-foreground text-xs">—</span> },
          { key: "active", label: "Status", render: (v) => statusBadge(v ?? "Active") },
          { key: "date", label: "Date" },
        ]}
      />
    ),
  },
  messages: {
    title: "Messages", subtitle: "Direct messages and broadcasts", icon: MessageSquare,
    render: () => <MessagesModule/>,
  },
  fees: {
    title: "Tuition & Fees", subtitle: "Track tuition payments and outstanding balances", icon: DollarSign,
    render: () => (
      <>
        <FeesStats/>
        <FeesModule/>
      </>
    ),
  },
  children: {
    title: "My Children", subtitle: "Linked student records", icon: Heart,
    render: () => <ChildrenModule/>,
  },
  events: {
    title: "Events & Reunions", subtitle: "Upcoming alumni events", icon: Calendar,
    render: () => (
      <SimpleCrud
        collection="events"
        itemLabel="event"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "location", label: "Location", type: "text", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "date", label: "Date" },
          { key: "location", label: "Location" },
        ]}
      />
    ),
  },
  jobs: {
    title: "Career Board", subtitle: "Opportunities shared with our alumni network", icon: Briefcase,
    render: () => (
      <SimpleCrud
        collection="jobs"
        itemLabel="job"
        createLabel="Post a job"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "company", label: "Company", type: "text", required: true },
          { name: "location", label: "Location", type: "text", required: true },
          { name: "posted", label: "Posted", type: "date", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "company", label: "Company" },
          { key: "location", label: "Location" },
          { key: "posted", label: "Posted" },
        ]}
      />
    ),
  },
  directory: {
    title: "School Directory", subtitle: "Find alumni, students and staff", icon: Users,
    render: () => (
      <SimpleCrud
        collection="directory"
        itemLabel="alumni"
        createLabel="Add alumni"
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "year", label: "Graduation year", type: "number", required: true },
          { name: "role", label: "Current role", type: "text" },
          { name: "city", label: "City", type: "text" },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "year", label: "Class of" },
          { key: "role", label: "Role" },
          { key: "city", label: "City" },
        ]}
      />
    ),
  },
  mentorship: {
    title: "Mentorship Programme", subtitle: "Guide a current student through their final years", icon: Heart,
    render: () => <MentorshipModule />,
  },
  donations: {
    title: "Donations", subtitle: "Recent contributions to the school", icon: DollarSign,
    render: () => (
      <>
        <DonationsStats/>
        <DonationsModule/>
      </>
    ),
  },
  library: {
    title: "Digital Library",
    subtitle: "Free CK-12 FlexBooks by subject and grade — read, bookmark and track progress",
    icon: Library,
    render: () => <DigitalLibraryModule/>,
  },
  resources: {
    title: "Teaching Resources", subtitle: "Shared documents for staff", icon: Library,
    render: () => (
      <SimpleCrud
        collection="resources"
        itemLabel="resource"
        createLabel="Add resource"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "type", label: "Type", type: "select", options: ["PDF","DOCX","XLSX","Link"], required: true },
          { name: "size", label: "Size", type: "text", placeholder: "1.2 MB" },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type" },
          { key: "size", label: "Size" },
        ]}
      />
    ),
  },
  // ----- CMS / Super-admin
  pages: {
    title: "Custom Pages", subtitle: "Manage public website pages", icon: FileText,
    allow: ["superadmin", "admin"],
    render: () => <PagesModule/>,
  },
  posts: {
    title: "News & Stories", subtitle: "Editorial content for the public website", icon: Newspaper,
    render: () => (
      <SimpleCrud
        collection="posts"
        itemLabel="post"
        createLabel="Write a post"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "author", label: "Author", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: ["Draft","Published"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "author", label: "Author" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
          { key: "date", label: "Date" },
        ]}
      />
    ),
  },
  media: {
    title: "Media Library", subtitle: "Images, videos and documents", icon: ImageIcon,
    allow: ["superadmin", "admin"],
    render: () => <MediaModule/>,
  },
  navigation: {
    title: "Site Navigation",
    subtitle: "Manage the public website menu and link structure",
    icon: ListTree,
    allow: ["superadmin"],
    render: () => <NavigationModule/>,
  },
  settings: {
    title: "System Settings", subtitle: "Branding, contact details, logo and system configuration", icon: Settings,
    allow: ["superadmin", "admin"],
    render: () => <SiteSettingsModule />,
  },
  departments: {
    title: "Departments", subtitle: "Organisational structure", icon: FolderTree,
    render: () => (
      <SimpleCrud
        collection="departments"
        itemLabel="department"
        createLabel="Add department"
        fields={[
          { name: "name", label: "Department name", type: "text", required: true },
          { name: "lead", label: "Department lead", type: "text", required: true },
          { name: "staff", label: "Staff count", type: "number", required: true },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "lead", label: "Lead" },
          { key: "staff", label: "Staff" },
        ]}
      />
    ),
  },
  audit: {
    title: "System Audit Log", subtitle: "Full trail of administrator and staff activity", icon: ClipboardList,
    allow: ["superadmin"],
    render: () => <AuditModule/>,
  },
  analytics: {
    title: "School Analytics", subtitle: "Enrolment trends, academic outcomes and platform health", icon: BarChart3,
    render: () => <AnalyticsModule />,
  },
  moduleaccess: {
    title: "Module Access Control", subtitle: "Enable or disable portal modules for each staff role", icon: Settings,
    allow: ["superadmin", "admin"],
    render: () => <ModuleAccessModule />,
  },
};

// Append additional modules (hero editor + new school modules)
Object.assign(MODULES, {
  hero: {
    title: "Hero Banner", subtitle: "Manage homepage carousel images, captions and CTAs",
    icon: ImageIcon, allow: ["superadmin", "admin"],
    render: () => <HeroSliderModule/>,
  },
  team: {
    title: "Team Page", subtitle: "Edit the public Team page — heading, copy, quote and member cards",
    icon: Users, allow: ["superadmin", "admin"],
    render: () => <TeamPageModule/>,
  },
  homepage: {
    title: "Homepage Content", subtitle: "Edit the ribbon, manifesto, chapters, quote, facts and featured cards",
    icon: LayoutTemplate, allow: ["superadmin", "admin"],
    render: () => <HomepageContentModule/>,
  },
  projectspage: {
    title: "Projects Content", subtitle: "Create, edit and publish public project reports",
    icon: FolderTree, allow: ["superadmin", "admin"],
    render: () => <ProjectsContentModule/>,
  },
  storiespage: {
    title: "Stories Content", subtitle: "Create, edit and publish public field stories and news",
    icon: Newspaper, allow: ["superadmin", "admin"],
    render: () => <StoriesContentModule/>,
  },
  divisionspage: {
    title: "Departments Content", subtitle: "Edit the four HOPE2 divisions shown on the public Departments page",
    icon: FolderTree, allow: ["superadmin", "admin"],
    render: () => <DivisionsContentModule/>,
  },
  admissions: {
    title: "Admissions Register", subtitle: "Application pipeline and enrolment management", icon: Inbox,
    allow: ["superadmin", "admin"],
    render: () => <AdmissionsModule />,
  },
  inquiries: {
    title: "Enquiries", subtitle: "Messages sent from the public contact form", icon: Mail,
    allow: ["superadmin", "admin", "admin_assistant", "admissions_officer"],
    render: () => (
      <SimpleCrud
        collection="inquiries"
        itemLabel="inquiry"
        createLabel="Log inquiry"
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "email", label: "Email", type: "text", required: true },
          { name: "subject", label: "Subject", type: "text" },
          { name: "message", label: "Message", type: "textarea" },
          { name: "received", label: "Received", type: "date", required: true },
          { name: "status", label: "Status", type: "select", required: true, options: ["New","In Progress","Replied","Closed"] },
        ]}
        columns={[
          { key: "name", label: "From", render: (v) => <span className="font-medium">{v}</span> },
          { key: "email", label: "Email" },
          { key: "subject", label: "Subject" },
          { key: "received", label: "Received" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  volunteers: {
    title: "Volunteer Sign-ups", subtitle: "Applications submitted from the Get Involved page", icon: Users,
    allow: ["superadmin", "admin", "admin_assistant", "admissions_officer"],
    render: () => (
      <SimpleCrud
        collection="volunteers"
        itemLabel="application"
        createLabel="Add applicant"
        fields={[
          { name: "name", label: "Full name", type: "text", required: true },
          { name: "email", label: "Email", type: "text", required: true },
          { name: "phone", label: "Phone", type: "text" },
          { name: "country", label: "Country", type: "text" },
          { name: "interest", label: "Area of interest", type: "select", options: ["Education","Health & Wellness","Community Development","Outreach & Missions"] },
          { name: "motivation", label: "Motivation", type: "textarea" },
          { name: "received", label: "Received", type: "date", required: true },
          { name: "status", label: "Status", type: "select", required: true, options: ["Pending","Reviewing","Approved","Declined"] },
        ]}
        columns={[
          { key: "name", label: "Applicant", render: (v) => <span className="font-medium">{v}</span> },
          { key: "email", label: "Email" },
          { key: "country", label: "Country" },
          { key: "interest", label: "Interest" },
          { key: "received", label: "Received" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  subscribers: {
    title: "Subscribers", subtitle: "People who subscribed from the public Stories page", icon: Send,
    allow: ["superadmin", "admin", "admin_assistant", "admissions_officer"],
    render: () => (
      <SimpleCrud
        collection="subscribers"
        itemLabel="subscriber"
        createLabel="Add subscriber"
        fields={[
          { name: "email", label: "Email", type: "text", required: true },
          { name: "joined", label: "Joined", type: "date", required: true },
          { name: "status", label: "Status", type: "select", required: true, options: ["Active","Unsubscribed"] },
        ]}
        columns={[
          { key: "email", label: "Email", render: (v) => <span className="font-medium">{v}</span> },
          { key: "joined", label: "Joined" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  pledges: {
    title: "Pledges", subtitle: "Gifts pledged from the public Give page", icon: Heart,
    allow: ["superadmin", "admin", "registrar"],
    render: () => (
      <SimpleCrud
        collection="pledges"
        itemLabel="pledge"
        createLabel="Record pledge"
        fields={[
          { name: "donor", label: "Donor", type: "text", required: true },
          { name: "email", label: "Email", type: "text" },
          { name: "amountUsd", label: "Amount (USD)", type: "number", required: true },
          { name: "frequency", label: "Frequency", type: "select", required: true, options: ["One-time","Monthly"] },
          { name: "received", label: "Received", type: "date", required: true },
          { name: "status", label: "Status", type: "select", required: true, options: ["Pending","Confirmed","Received","Cancelled"] },
        ]}
        columns={[
          { key: "donor", label: "Donor", render: (v) => <span className="font-medium">{v}</span> },
          { key: "email", label: "Email" },
          { key: "amountUsd", label: "Amount", render: (v) => fmtMoney(v) },
          { key: "frequency", label: "Frequency" },
          { key: "received", label: "Received" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  exams: {
    title: "Examinations", subtitle: "Schedule period exams and publish report cards",
    icon: Award,
    render: () => (
      <SimpleCrud
        collection="exams"
        itemLabel="exam"
        createLabel="Schedule exam"
        fields={[
          { name: "subject", label: "Subject", type: "text", required: true },
          { name: "class", label: "Class", type: "text", required: true },
          { name: "term", label: "Period", type: "select", options: ["Period 1","Period 2","Period 3","Mid-Period","Final"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "room", label: "Room", type: "text" },
          { name: "status", label: "Status", type: "select", options: ["Scheduled","In Progress","Completed","Published"], required: true },
        ]}
        columns={[
          { key: "subject", label: "Subject", render: (v) => <span className="font-medium">{v}</span> },
          { key: "class", label: "Class" },
          { key: "term", label: "Period" },
          { key: "date", label: "Date" },
          { key: "room", label: "Room" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  behavior: {
    title: "Conduct Records", subtitle: "Log disciplinary incidents and commendations", icon: CheckCircle2,
    allow: ["superadmin", "admin", "teacher"],
    render: () => (
      <SimpleCrud
        collection="behavior"
        itemLabel="entry"
        createLabel="Log entry"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "class", label: "Class", type: "text" },
          { name: "type", label: "Type", type: "select", options: ["Commendation","Warning","Detention","Suspension","Note"], required: true },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "reporter", label: "Reported by", type: "text", required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "date", label: "Date" },
          { key: "reporter", label: "Reporter" },
        ]}
      />
    ),
  },
  lessonplans: {
    title: "Lesson Plans", subtitle: "Teacher planning and curriculum tracking",
    icon: BookOpen, allow: ["superadmin", "admin", "teacher"],
    render: () => (
      <SimpleCrud
        collection="lessonplans"
        itemLabel="lesson plan"
        createLabel="New lesson plan"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "subject", label: "Subject", type: "text", required: true },
          { name: "class", label: "Class", type: "text", required: true },
          { name: "week", label: "Week", type: "text", placeholder: "Week 4" },
          { name: "objectives", label: "Objectives", type: "textarea", required: true },
          { name: "status", label: "Status", type: "select", options: ["Draft","Submitted","Approved"], required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "subject", label: "Subject" },
          { key: "class", label: "Class" },
          { key: "week", label: "Week" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  transport: {
    title: "Transport", subtitle: "School bus routes and student rider rosters",
    icon: FolderTree, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="transport"
        itemLabel="route"
        createLabel="Add route"
        fields={[
          { name: "route", label: "Route", type: "text", required: true, placeholder: "Marshall Road Loop" },
          { name: "driver", label: "Driver", type: "text", required: true },
          { name: "vehicle", label: "Vehicle / Plate", type: "text" },
          { name: "departure", label: "Departure", type: "text", placeholder: "06:30" },
          { name: "riders", label: "Riders", type: "number", required: true },
          { name: "feeUsd", label: "Monthly fee (USD)", type: "number" },
        ]}
        columns={[
          { key: "route", label: "Route", render: (v) => <span className="font-medium">{v}</span> },
          { key: "driver", label: "Driver" },
          { key: "vehicle", label: "Vehicle" },
          { key: "departure", label: "Departs" },
          { key: "riders", label: "Riders" },
          { key: "feeUsd", label: "Fee/mo (USD · LRD)", render: (v) => fmtMoney(v) },
        ]}
      />
    ),
  },
  clinic: {
    title: "Health Services", subtitle: "Clinic visit log and student health records",
    icon: Heart, allow: ["superadmin", "admin", "nurse", "parent", "student"],
    render: () => (
      <SimpleCrud
        collection="clinic"
        itemLabel="health record"
        createLabel="Add record"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "visitDate", label: "Visit date", type: "date", required: true },
          { name: "reason", label: "Reason", type: "text", required: true },
          { name: "action", label: "Action taken", type: "textarea" },
          { name: "nurse", label: "Attended by", type: "text" },
          { name: "status", label: "Status", type: "select", options: ["Treated","Referred","Monitoring"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "visitDate", label: "Date" },
          { key: "reason", label: "Reason" },
          { key: "nurse", label: "Nurse" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  immunizations: {
    title: "Immunisation Records", subtitle: "Vaccine doses, due dates and school-wide coverage",
    icon: Heart, allow: ["superadmin", "admin", "nurse", "parent", "student"],
    render: () => (
      <SimpleCrud
        collection="immunizations"
        itemLabel="immunisation"
        createLabel="Add immunisation"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "vaccine", label: "Vaccine", type: "text", required: true, placeholder: "Measles (MR)" },
          { name: "doseDate", label: "Dose date", type: "date", required: true },
          { name: "nextDue", label: "Next dose due", type: "date" },
          { name: "administeredBy", label: "Administered by", type: "text" },
          { name: "status", label: "Status", type: "select", options: ["Complete", "Due", "Overdue", "Exempt"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "vaccine", label: "Vaccine" },
          { key: "doseDate", label: "Dose date" },
          { key: "nextDue", label: "Next due" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  medications: {
    title: "Medication Administration", subtitle: "Prescribed medicines given during school hours",
    icon: Heart, allow: ["superadmin", "admin", "nurse", "parent"],
    render: () => (
      <SimpleCrud
        collection="medications"
        itemLabel="medication"
        createLabel="Add medication"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "medication", label: "Medication", type: "text", required: true },
          { name: "dosage", label: "Dosage", type: "text", required: true },
          { name: "schedule", label: "Schedule", type: "text", placeholder: "Twice daily · 12:00, 16:00" },
          { name: "startDate", label: "Start date", type: "date", required: true },
          { name: "endDate", label: "End date", type: "date" },
          { name: "consent", label: "Parent consent", type: "textarea" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Completed", "Discontinued"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "medication", label: "Medication" },
          { key: "dosage", label: "Dosage" },
          { key: "schedule", label: "Schedule" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  healthalerts: {
    title: "Health Alerts", subtitle: "Allergies, chronic conditions and emergency instructions",
    icon: Heart, allow: ["superadmin", "admin", "nurse", "parent"],
    render: () => (
      <SimpleCrud
        collection="healthalerts"
        itemLabel="health alert"
        createLabel="Add alert"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "condition", label: "Condition / allergy", type: "text", required: true },
          { name: "severity", label: "Severity", type: "select", options: ["Mild", "Moderate", "Severe"], required: true },
          { name: "instructions", label: "Emergency instructions", type: "textarea" },
          { name: "emergencyContact", label: "Emergency contact", type: "text" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Resolved"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "condition", label: "Condition" },
          { key: "severity", label: "Severity", render: (v) => statusBadge(v) },
          { key: "emergencyContact", label: "Contact" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  medicalscreenings: {
    title: "Health Screenings", subtitle: "Vision, hearing, dental and growth checks",
    icon: Heart, allow: ["superadmin", "admin", "nurse", "parent", "student"],
    render: () => (
      <SimpleCrud
        collection="medicalscreenings"
        itemLabel="screening"
        createLabel="Add screening"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "screening", label: "Screening type", type: "select", options: ["Vision", "Hearing", "Dental", "Growth / BMI", "General"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "result", label: "Result", type: "text" },
          { name: "followUp", label: "Follow-up", type: "textarea" },
          { name: "status", label: "Status", type: "select", options: ["Cleared", "Follow-up needed", "Referred"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "screening", label: "Type" },
          { key: "date", label: "Date" },
          { key: "result", label: "Result" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  calendar: {
    title: "Academic Calendar", subtitle: "Holidays, exam weeks and school events",
    icon: Calendar,
    render: () => (
      <SimpleCrud
        collection="calendar"
        itemLabel="calendar entry"
        createLabel="Add entry"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "type", label: "Type", type: "select", options: ["Holiday","Exam","Event","PTA","Sports","Devotion"], required: true },
          { name: "startDate", label: "Start", type: "date", required: true },
          { name: "endDate", label: "End", type: "date" },
          { name: "audience", label: "Audience", type: "select", options: ["All","Students","Parents","Staff","Alumni"] },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "startDate", label: "Start" },
          { key: "endDate", label: "End" },
          { key: "audience", label: "Audience" },
        ]}
      />
    ),
  },
  inventory: {
    title: "Asset Management", subtitle: "School equipment, supplies and stock levels",
    icon: FolderTree, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="inventory"
        itemLabel="item"
        createLabel="Add item"
        fields={[
          { name: "item", label: "Item", type: "text", required: true },
          { name: "category", label: "Category", type: "select", options: ["Furniture","Electronics","Books","Stationery","Sports","Lab","Vehicle"], required: true },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "location", label: "Location", type: "text" },
          { name: "condition", label: "Condition", type: "select", options: ["New","Good","Fair","Damaged"], required: true },
        ]}
        columns={[
          { key: "item", label: "Item", render: (v) => <span className="font-medium">{v}</span> },
          { key: "category", label: "Category" },
          { key: "quantity", label: "Qty" },
          { key: "location", label: "Location" },
          { key: "condition", label: "Condition", render: (v) => <Badge variant="secondary">{v}</Badge> },
        ]}
      />
    ),
  },
  staff: {
    title: "HR & Staff", subtitle: "Staff accounts, roles and employment records",
    icon: Users, allow: ["superadmin", "admin", "admin_assistant", "registrar"],
    render: () => <StaffModule />,
  },
  payroll: {
    title: "Payroll & Salaries",
    subtitle: "Confidential — Super Admin and Registrar only",
    icon: Wallet, allow: ["superadmin", "registrar"],
    render: () => <PayrollModule/>,
  },
  expenses: {
    title: "Expenses & Payables", subtitle: "Operating costs, vendors and payment status",
    icon: Receipt, allow: ["superadmin", "admin", "registrar"],
    render: () => <ExpensesModule/>,
  },
  finance: {
    title: "Finance Overview", subtitle: "Income, payroll and expense position in USD and LRD",
    icon: PieChart, allow: ["superadmin", "admin", "registrar"],
    render: () => <FinanceOverview/>,
  },
  campaigns: {
    title: "Email Campaigns", subtitle: "Compose, schedule and track bulk mailings to school audiences",
    icon: Mail, allow: ["superadmin", "admin", "admissions_officer", "admin_assistant"],
    render: () => (
      <SimpleCrud
        collection="campaigns"
        itemLabel="campaign"
        createLabel="New campaign"
        fields={[
          { name: "name", label: "Campaign name", type: "text", required: true },
          { name: "audience", label: "Audience", type: "select",
            options: ["All Contacts","Prospective Families","Parents","Students","Staff","Alumni","Donors"], required: true },
          { name: "subject", label: "Email subject", type: "text", required: true },
          { name: "body", label: "Message", type: "textarea", required: true },
          { name: "sendDate", label: "Send date", type: "date", required: true },
          { name: "status", label: "Status", type: "select", options: ["Draft","Scheduled","Sent","Paused"], required: true },
        ]}
        columns={[
          { key: "name", label: "Campaign", render: (v) => <span className="font-medium">{v}</span> },
          { key: "audience", label: "Audience", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "subject", label: "Subject" },
          { key: "sendDate", label: "Send date" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  forms: {
    title: "Online Forms", subtitle: "Build and manage public forms — applications, consents, surveys",
    icon: FileSpreadsheet, allow: ["superadmin", "admin", "admissions_officer", "admin_assistant"],
    render: () => (
      <SimpleCrud
        collection="forms"
        itemLabel="form"
        createLabel="New form"
        fields={[
          { name: "title", label: "Form title", type: "text", required: true },
          { name: "type", label: "Type", type: "select",
            options: ["Admission Application","Consent","Survey","Registration","Feedback","Request"], required: true },
          { name: "audience", label: "Audience", type: "select",
            options: ["Public","Parents","Students","Staff","Alumni"], required: true },
          { name: "slug", label: "Public link", type: "text", required: true, placeholder: "/forms/admission-2026" },
          { name: "fieldsSpec", label: "Fields (one per line)", type: "textarea", placeholder: "Full name\nEmail\nGrade applying for" },
          { name: "submissions", label: "Submissions", type: "number" },
          { name: "status", label: "Status", type: "select", options: ["Draft","Open","Closed"], required: true },
        ]}
        columns={[
          { key: "title", label: "Form", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type", render: (v) => <Badge variant="secondary">{v}</Badge> },
          { key: "audience", label: "Audience" },
          { key: "slug", label: "Link" },
          { key: "submissions", label: "Submissions" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  broadcast: {
    title: "Internal Broadcast", subtitle: "Send targeted messages or bulk broadcasts to any user group",
    icon: Send, allow: ["superadmin", "admin", "admissions_officer", "admin_assistant", "registrar"],
    render: () => <BroadcastModule/>,
  },
  scholarships: {
    title: "Scholarships & Financial Aid", subtitle: "Sponsored students, bursaries and award tracking",
    icon: Award, allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="scholarships"
        itemLabel="scholarship"
        createLabel="Add scholarship"
        fields={[
          { name: "student", label: "Student", type: "text", required: true },
          { name: "sponsor", label: "Sponsor", type: "text", required: true },
          { name: "amountUsd", label: "Award amount (USD)", type: "number", required: true },
          { name: "term", label: "Period", type: "select", options: ["Period 1","Period 2","Period 3","Annual"], required: true },
          { name: "status", label: "Status", type: "select", options: ["Active","Paid","Outstanding","Ended"], required: true },
        ]}
        columns={[
          { key: "student", label: "Student", render: (v) => <span className="font-medium">{v}</span> },
          { key: "sponsor", label: "Sponsor" },
          { key: "amountUsd", label: "Amount (USD · LRD)", render: (v) => fmtMoney(v) },
          { key: "term", label: "Period" },
          { key: "status", label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
  approvals: {
    title: "Approvals", subtitle: "Submit, review and sign off school records", icon: CheckCircle2,
    render: () => <ApprovalsModule/>,
  },
  reports: {
    title: "Reports", subtitle: "Submit reports and track them through the approval hierarchy", icon: FileText,
    render: () => <ReportsModule />,
  },
  receipts: {
    title: "Payment Receipts", subtitle: "Generate and print receipts for fees, expenses, payroll and donations",
    icon: Receipt, allow: ["superadmin", "admin", "registrar"],
    render: () => <ReceiptsHub/>,
  },

  // ── New modules ───────────────────────────────────────────────────────────

  visitorlog: {
    title: "Visitor Log", subtitle: "Record every visitor entering school premises with time in/out", icon: ClipboardList,
    allow: ["superadmin", "admin", "admin_assistant"],
    render: () => (
      <SimpleCrud
        collection="visitorlog"
        itemLabel="visitor"
        createLabel="Log visitor"
        fields={[
          { name: "fullName",  label: "Full name",           type: "text",     required: true },
          { name: "purpose",   label: "Purpose of visit",    type: "select",   options: ["Meeting with staff","Student pickup","Delivery","Interview","Official business","Other"], required: true },
          { name: "host",      label: "Host (staff member)", type: "text",     required: true },
          { name: "idType",    label: "ID type",             type: "select",   options: ["National ID","Passport","Driver's licence","Other"] },
          { name: "timeIn",    label: "Time in",             type: "text",     placeholder: "HH:MM", required: true },
          { name: "timeOut",   label: "Time out",            type: "text",     placeholder: "HH:MM" },
          { name: "notes",     label: "Notes",               type: "textarea" },
          { name: "status",    label: "Status",              type: "select",   options: ["On premises","Departed","Expected"], required: true },
        ]}
        columns={[
          { key: "fullName", label: "Visitor",  render: (v) => <span className="font-medium">{v}</span> },
          { key: "purpose",  label: "Purpose" },
          { key: "host",     label: "Host" },
          { key: "timeIn",   label: "Time in" },
          { key: "timeOut",  label: "Time out" },
          { key: "status",   label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },

  academicyear: {
    title: "Academic Year & Term Setup", subtitle: "Define academic years, terms and school holiday periods", icon: Calendar,
    allow: ["superadmin", "admin"],
    render: () => (
      <SimpleCrud
        collection="academicyear"
        itemLabel="term"
        createLabel="Add term"
        fields={[
          { name: "year",      label: "Academic year", type: "text",     placeholder: "2025–2026", required: true },
          { name: "term",      label: "Term",          type: "select",   options: ["1st Term","2nd Term","3rd Term","Full Year"], required: true },
          { name: "startDate", label: "Start date",    type: "text",     placeholder: "YYYY-MM-DD", required: true },
          { name: "endDate",   label: "End date",      type: "text",     placeholder: "YYYY-MM-DD", required: true },
          { name: "holidays",  label: "Key holidays / breaks", type: "textarea", placeholder: "List holiday periods within this term" },
          { name: "status",    label: "Status",        type: "select",   options: ["Upcoming","Active","Completed"], required: true },
        ]}
        columns={[
          { key: "year",      label: "Year",  render: (v) => <span className="font-medium">{v}</span> },
          { key: "term",      label: "Term" },
          { key: "startDate", label: "Start" },
          { key: "endDate",   label: "End" },
          { key: "status",    label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },

  counselling: {
    title: "Counselling Records", subtitle: "Log academic and pastoral counselling sessions for students", icon: Heart,
    allow: ["superadmin", "admin", "teacher", "nurse"],
    render: () => (
      <SimpleCrud
        collection="counselling"
        itemLabel="session"
        createLabel="Log session"
        fields={[
          { name: "student",      label: "Student name",      type: "text",     required: true },
          { name: "grade",        label: "Grade / class",     type: "text" },
          { name: "counsellor",   label: "Counsellor",        type: "text",     required: true },
          { name: "date",         label: "Date",              type: "text",     placeholder: "YYYY-MM-DD", required: true },
          { name: "type",         label: "Session type",      type: "select",   options: ["Academic","Pastoral","Behavioural","Career","Bereavement","Other"], required: true },
          { name: "summary",      label: "Session summary",   type: "textarea", required: true },
          { name: "followUp",     label: "Follow-up action",  type: "textarea" },
          { name: "followUpDate", label: "Follow-up date",    type: "text",     placeholder: "YYYY-MM-DD" },
          { name: "status",       label: "Status",            type: "select",   options: ["Open","Follow-up scheduled","Closed"], required: true },
        ]}
        columns={[
          { key: "student",    label: "Student",    render: (v) => <span className="font-medium">{v}</span> },
          { key: "counsellor", label: "Counsellor" },
          { key: "date",       label: "Date" },
          { key: "type",       label: "Type" },
          { key: "status",     label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },

  bookstock: {
    title: "Library Catalogue", subtitle: "Physical book inventory, borrowing records and overdue notices", icon: Library,
    allow: ["superadmin", "admin", "teacher", "registrar"],
    render: () => (
      <>
        <SimpleCrud
          collection="bookstock"
          itemLabel="book"
          createLabel="Add book"
          fields={[
            { name: "title",           label: "Title",            type: "text",   required: true },
            { name: "author",          label: "Author",           type: "text",   required: true },
            { name: "isbn",            label: "ISBN",             type: "text" },
            { name: "category",        label: "Category",         type: "select", options: ["Fiction","Non-fiction","Textbook","Reference","Science","History","Arts","Other"], required: true },
            { name: "copiesTotal",     label: "Total copies",     type: "number", required: true },
            { name: "copiesAvailable", label: "Available copies", type: "number", required: true },
            { name: "status",          label: "Status",           type: "select", options: ["Available","Low stock","Out of stock"], required: true },
          ]}
          columns={[
            { key: "title",           label: "Title",     render: (v) => <span className="font-medium">{v}</span> },
            { key: "author",          label: "Author" },
            { key: "category",        label: "Category" },
            { key: "copiesTotal",     label: "Total" },
            { key: "copiesAvailable", label: "Available" },
            { key: "status",          label: "Status", render: (v) => statusBadge(v) },
          ]}
        />
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-4">Borrowing Records</h3>
          <SimpleCrud
            collection="borrowings"
            itemLabel="borrowing record"
            createLabel="Record borrowing"
            fields={[
              { name: "bookTitle",    label: "Book title",    type: "text",   required: true },
              { name: "borrower",     label: "Borrower name", type: "text",   required: true },
              { name: "borrowerType", label: "Borrower type", type: "select", options: ["Student","Teacher","Staff"], required: true },
              { name: "borrowedDate", label: "Date borrowed", type: "text",   placeholder: "YYYY-MM-DD", required: true },
              { name: "dueDate",      label: "Due date",      type: "text",   placeholder: "YYYY-MM-DD", required: true },
              { name: "returnedDate", label: "Date returned", type: "text",   placeholder: "YYYY-MM-DD" },
              { name: "status",       label: "Status",        type: "select", options: ["Borrowed","Returned","Overdue","Lost"], required: true },
            ]}
            columns={[
              { key: "bookTitle",    label: "Book",     render: (v) => <span className="font-medium">{v}</span> },
              { key: "borrower",     label: "Borrower" },
              { key: "borrowerType", label: "Type" },
              { key: "borrowedDate", label: "Borrowed" },
              { key: "dueDate",      label: "Due" },
              { key: "status",       label: "Status", render: (v) => statusBadge(v) },
            ]}
          />
        </div>
      </>
    ),
  },

  ptmeetings: {
    title: "PTM Scheduler", subtitle: "Parent-teacher meeting slots — schedule, confirm and track attendance", icon: Users,
    allow: ["superadmin", "admin", "teacher", "parent"],
    render: () => (
      <SimpleCrud
        collection="ptmeetings"
        itemLabel="meeting slot"
        createLabel="Schedule meeting"
        fields={[
          { name: "teacher",  label: "Teacher",           type: "text",   required: true },
          { name: "parent",   label: "Parent / guardian", type: "text",   required: true },
          { name: "student",  label: "Student",           type: "text",   required: true },
          { name: "date",     label: "Date",              type: "text",   placeholder: "YYYY-MM-DD", required: true },
          { name: "time",     label: "Time",              type: "text",   placeholder: "HH:MM",      required: true },
          { name: "duration", label: "Duration (mins)",   type: "number" },
          { name: "mode",     label: "Mode",              type: "select", options: ["In-person","Video call","Phone call"], required: true },
          { name: "agenda",   label: "Agenda / notes",    type: "textarea" },
          { name: "status",   label: "Status",            type: "select", options: ["Scheduled","Confirmed","Completed","Cancelled","No-show"], required: true },
        ]}
        columns={[
          { key: "teacher",  label: "Teacher", render: (v) => <span className="font-medium">{v}</span> },
          { key: "parent",   label: "Parent" },
          { key: "student",  label: "Student" },
          { key: "date",     label: "Date" },
          { key: "time",     label: "Time" },
          { key: "status",   label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },

  leaverequests: {
    title: "Staff Leave Management", subtitle: "Staff leave requests — submit, review and approve time off", icon: Inbox,
    allow: ["superadmin", "admin", "teacher", "registrar"],
    render: () => (
      <SimpleCrud
        collection="leaverequests"
        itemLabel="leave request"
        createLabel="Submit leave request"
        fields={[
          { name: "staffName",        label: "Staff name",        type: "text",     required: true },
          { name: "department",       label: "Department",        type: "text" },
          { name: "leaveType",        label: "Leave type",        type: "select",   options: ["Annual leave","Sick leave","Maternity / Paternity leave","Emergency leave","Study leave","Compassionate leave","Unpaid leave"], required: true },
          { name: "startDate",        label: "Start date",        type: "text",     placeholder: "YYYY-MM-DD", required: true },
          { name: "endDate",          label: "End date",          type: "text",     placeholder: "YYYY-MM-DD", required: true },
          { name: "days",             label: "Number of days",    type: "number",   required: true },
          { name: "reason",           label: "Reason / details",  type: "textarea", required: true },
          { name: "coverArrangement", label: "Cover arrangement", type: "textarea" },
          { name: "status",           label: "Status",            type: "select",   options: ["Pending","Approved","Rejected","Cancelled"], required: true },
        ]}
        columns={[
          { key: "staffName",  label: "Staff",      render: (v) => <span className="font-medium">{v}</span> },
          { key: "leaveType",  label: "Leave type" },
          { key: "startDate",  label: "From" },
          { key: "endDate",    label: "To" },
          { key: "days",       label: "Days" },
          { key: "status",     label: "Status", render: (v) => statusBadge(v) },
        ]}
      />
    ),
  },
} satisfies Record<string, ModuleDef>);

// =========================================================================
// RBAC extension — grant the new staff roles access to the modules they own.
// Only widens existing allow-lists; modules without an allow-list stay open.
// =========================================================================
const STAFF_ROLE_MODULES: Partial<Record<AppRole, string[]>> = {
  admin_assistant: [
    "calendar", "messages", "announcements", "staff", "attendance",
    "resources", "inventory", "transport", "clinic", "events",
  ],
  registrar: [
    "classes", "timetable", "calendar", "grades", "exams", "attendance",
    "behavior", "directory", "admissions", "scholarships",
    "announcements", "messages",
  ],
  admissions_officer: [
    "admissions", "scholarships", "classes", "messages",
    "announcements", "events", "calendar",
  ],
  nurse: [
    "clinic", "immunizations", "medications", "healthalerts", "medicalscreenings",
    "directory", "messages", "announcements", "calendar", "approvals", "resources",
  ],
};

for (const [role, keys] of Object.entries(STAFF_ROLE_MODULES) as [AppRole, string[]][]) {
  for (const key of keys) {
    const def = MODULES[key];
    if (!def?.allow) continue;
    if (!def.allow.includes(role)) def.allow = [...def.allow, role];
  }
}

// =========================================================================
// CMS — Pages module
// =========================================================================
function PagesModule() {
  useCmsVersion();
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  const pages = cmsStore.listPages().filter(p =>
    !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.slug.toLowerCase().includes(q.toLowerCase())
  );

  const remove = (p: CmsPage) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    cmsStore.deletePage(p.id);
    toast.success("Page deleted");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search pages…" className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New page</Button>
      </div>

      <TableShell
        head={["Title", "Slug", "Status", "Updated", ""]}
        rows={pages.map(p => [
          <span className="font-medium">{p.title}</span>,
          <code className="text-xs text-muted-foreground">{p.slug}</code>,
          statusBadge(p.status),
          p.updated,
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(p)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
            <Button size="sm" variant="ghost" onClick={()=>remove(p)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>,
        ])}
      />

      {(editing || creating) && (
        <PageEditor
          page={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </>
  );
}

function PageEditor({ page, onClose }: { page: CmsPage | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<CmsPage>>(page ?? { title: "", slug: "/", body: "", status: "Draft" });
  const save = (status?: "Draft" | "Published") => {
    if (!form.title || !form.slug) { toast.error("Title and slug are required"); return; }
    if (!form.slug.startsWith("/")) form.slug = "/" + form.slug;
    const saved = cmsStore.upsertPage({ ...form, status: status ?? form.status });
    toast.success(`Saved "${saved.title}"${saved.status === "Published" ? " — published" : ""}`);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{page ? "Edit page" : "New page"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={form.title ?? ""} onChange={e=>setForm({...form, title:e.target.value})} placeholder="About Us"/></div>
            <div><Label>Slug</Label><Input value={form.slug ?? ""} onChange={e=>setForm({...form, slug:e.target.value})} placeholder="/about"/></div>
          </div>
          <div>
            <Label>Excerpt</Label>
            <Input value={form.excerpt ?? ""} onChange={e=>setForm({...form, excerpt:e.target.value})} placeholder="Short summary shown in listings"/>
          </div>
          <div>
            <Label>Body (Markdown)</Label>
            <Textarea rows={10} value={form.body ?? ""} onChange={e=>setForm({...form, body:e.target.value})} placeholder="Write your page content here…"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>SEO title</Label><Input value={form.seoTitle ?? ""} onChange={e=>setForm({...form, seoTitle:e.target.value})}/></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "Draft"} onValueChange={(v)=>setForm({...form, status: v as any})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>SEO description</Label>
            <Textarea rows={2} value={form.seoDescription ?? ""} onChange={e=>setForm({...form, seoDescription:e.target.value})}/>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={()=>save("Draft")}>Save draft</Button>
          <Button onClick={()=>save("Published")}>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// CMS — Media Library
// =========================================================================
function MediaModule() {
  useCmsVersion();
  const [folder, setFolder] = useState<string>("All");
  const [renaming, setRenaming] = useState<CmsMedia | null>(null);
  const media = cmsStore.listMedia();
  const folders = ["All", ...Array.from(new Set(media.map(m => m.folder))).filter(Boolean)];
  const filtered = folder === "All" ? media : media.filter(m => m.folder === folder);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const limit = 4 * 1024 * 1024;
    for (const f of Array.from(files)) {
      if (f.size > limit) { toast.error(`${f.name} is larger than 4 MB`); continue; }
      try {
        const url = await readFileAsDataUrl(f);
        cmsStore.addMedia({ name: f.name, type: f.type || "application/octet-stream", size: f.size, folder: folder === "All" ? "Uploads" : folder, url });
      } catch { toast.error(`Failed to upload ${f.name}`); }
    }
    toast.success("Upload complete");
  };

  const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto">
          {folders.map(f => (
            <button key={f} onClick={()=>setFolder(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${folder===f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-muted/70"}`}>{f}</button>
          ))}
        </div>
        <div className="flex-1"/>
        <label className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-90">
          <Upload className="h-4 w-4"/> Upload media
          <input type="file" multiple className="hidden" onChange={e=>{ onUpload(e.target.files); e.currentTarget.value=""; }}/>
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-10 w-10 text-primary/70 mx-auto"/>
          <h3 className="mt-3 font-display text-xl font-semibold">No media yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload images, videos or documents to use across the site.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <Reveal key={m.id} delay={i*0.03}>
              <Card className="overflow-hidden group">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/20 grid place-items-center overflow-hidden">
                  {m.type.startsWith("image/") ? (
                    <img src={m.url} alt={m.alt ?? m.name} className="h-full w-full object-cover"/>
                  ) : m.type.startsWith("video/") ? (
                    <video src={m.url} className="h-full w-full object-cover" muted/>
                  ) : (
                    <FileText className="h-10 w-10 text-primary/70"/>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate" title={m.name}>{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.folder} · {fmt(m.size)}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={()=>{ navigator.clipboard.writeText(m.url); toast.success("URL copied"); }}><Copy className="h-3.5 w-3.5"/></Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={()=>setRenaming(m)}><Edit3 className="h-3.5 w-3.5"/></Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 ml-auto" onClick={()=>{ cmsStore.deleteMedia(m.id); toast.success("Removed"); }}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {renaming && (
        <Dialog open onOpenChange={(o)=>!o && setRenaming(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit media</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>File name</Label><Input value={renaming.name} onChange={e=>setRenaming({...renaming, name:e.target.value})}/></div>
              <div><Label>Folder</Label><Input value={renaming.folder} onChange={e=>setRenaming({...renaming, folder:e.target.value})}/></div>
              <div><Label>Alt text</Label><Input value={renaming.alt ?? ""} onChange={e=>setRenaming({...renaming, alt:e.target.value})}/></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setRenaming(null)}>Cancel</Button>
              <Button onClick={()=>{ cmsStore.updateMedia(renaming.id, { name: renaming.name, folder: renaming.folder, alt: renaming.alt }); toast.success("Saved"); setRenaming(null); }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// =========================================================================
// In-app messaging — private (one account) or bulk (whole audience)
// =========================================================================
function BroadcastModule() {
  const principal = usePrincipal();
  const [users, setUsers] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [mode, setMode] = useState<"private" | "bulk">("private");
  const [picked, setPicked] = useState<string[]>([]);
  const [audience, setAudience] = useState("All");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setUsers(await mockAuth.listUsers()); } catch { setUsers([]); }
    try {
      const list = await apiClient.list("messages");
      setSent(list as any[]);
    } catch (e) {
      if (isNetworkError(e)) setSent(mockDb.list<any>("messages"));
    }
    try {
      setDrafts((await apiClient.list("message_drafts")) as any[]);
    } catch (e) {
      if (isNetworkError(e)) setDrafts(mockDb.list<any>("message_drafts"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const audienceRoles: Record<string, AppRole[]> = {
    All: ["superadmin","admin","admin_assistant","registrar","admissions_officer","teacher","student","parent","alumni"],
    Students: ["student"],
    Parents: ["parent"],
    Staff: ["superadmin","admin","admin_assistant","registrar","admissions_officer","teacher"],
    Teachers: ["teacher"],
    Alumni: ["alumni"],
  };

  const recipients = mode === "private"
    ? users.filter((u) => picked.includes(u.email))
    : users.filter((u) => audienceRoles[audience]?.includes(u.role) && !excluded.includes(u.email));

  const toggle = (list: string[], set: (v: string[]) => void, email: string) =>
    set(list.includes(email) ? list.filter((e) => e !== email) : [...list, email]);

  const write = async (collection: string, row: any) => {
    try { await apiClient.create(collection, row); }
    catch (e) { if (isNetworkError(e)) mockDb.create(collection, row); }
  };

  const resetForm = () => { setSubject(""); setBody(""); setDraftId(null); setPicked([]); setExcluded([]); };

  const saveDraft = async () => {
    if (!subject.trim() && !body.trim()) { toast.error("Nothing to save"); return; }
    const row: any = {
      from: principal?.name ?? "Administration",
      fromId: principal?.id,
      to: mode === "private" ? recipients.map((r) => r.name).join(", ") || "—" : audience,
      recipients: recipients.map((r) => ({ name: r.name, email: r.email })),
      subject, body, preview: body.slice(0, 120),
      date: new Date().toISOString().slice(0, 10),
      status: "draft", kind: mode, unread: false,
    };
    setBusy(true);
    if (draftId) {
      try { await apiClient.update("message_drafts", draftId, row); }
      catch (e) { if (isNetworkError(e)) mockDb.update("message_drafts", draftId, row); }
    } else {
      await write("message_drafts", row);
    }
    setBusy(false);
    toast.success("Draft saved");
    resetForm();
    load();
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and message are required"); return; }
    if (mode === "private" && picked.length === 0) { toast.error("Choose at least one recipient"); return; }
    if (recipients.length === 0) { toast.error("No matching recipients"); return; }
    setBusy(true);
    const date = new Date().toISOString().slice(0, 10);
    const threadId = `thr_${Date.now()}`;
    for (const r of recipients) {
      const msg: any = {
        from: principal?.name ?? "Administration",
        fromId: principal?.id,
        to: r.name,
        toEmail: r.email,
        subject,
        preview: body.slice(0, 120),
        body,
        date,
        unread: true,
        status: "sent",
        threadId,
        sentAt: new Date().toISOString(),
        readAt: null,
        kind: mode,
      };
      try {
        await apiClient.create("messages", msg);
      } catch (e) {
        if (isNetworkError(e)) mockDb.create("messages", msg);
      }
    }
    if (draftId) {
      try { await apiClient.remove("message_drafts", draftId); }
      catch (e) { if (isNetworkError(e)) mockDb.remove("message_drafts", draftId); }
    }
    setBusy(false);
    resetForm();
    toast.success(`Message delivered to ${recipients.length} account${recipients.length === 1 ? "" : "s"}`);
    load();
  };

  const mine = sent.filter((m) => m.from === (principal?.name ?? ""));
  const threads = Object.values(
    mine.reduce((acc: Record<string, any>, m: any) => {
      const key = m.threadId ?? m.id;
      acc[key] = acc[key] ?? { key, date: m.date, subject: m.subject, kind: m.kind, total: 0, read: 0, to: m.to };
      acc[key].total += 1;
      if (!m.unread) acc[key].read += 1;
      if (acc[key].total > 1) acc[key].to = `${acc[key].total} recipients`;
      return acc;
    }, {}),
  ) as any[];
  const readRate = threads.length
    ? Math.round((mine.filter((m) => !m.unread).length / Math.max(mine.length, 1)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <StaggerGroup className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Reachable accounts" value={users.length} />
        <StatCard icon={Send} label="Messages I sent" value={mine.length} accent="accent" />
        <StatCard icon={CheckCircle2} label="Read receipts" value={`${readRate}%`} accent="secondary" />
      </StaggerGroup>

      <Card className="p-5 space-y-4 max-w-3xl">
        <div className="flex gap-2">
          {(["private", "bulk"] as const).map((mo) => (
            <button key={mo} onClick={() => setMode(mo)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === mo ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
              {mo === "private" ? "Private message" : "Bulk broadcast"}
            </button>
          ))}
        </div>

        {mode === "private" ? (
          <div>
            <Label>Recipients ({picked.length} selected)</Label>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {users.map((u) => (
                <label key={u.email} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                  <input type="checkbox" className="h-4 w-4 accent-current"
                    checked={picked.includes(u.email)}
                    onChange={() => toggle(picked, setPicked, u.email)} />
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{ROLE_LABEL[u.role as AppRole] ?? u.role}</span>
                </label>
              ))}
              {users.length === 0 && <p className="p-3 text-sm text-muted-foreground">No accounts found.</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => { setAudience(v); setExcluded([]); }}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {Object.keys(audienceRoles).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fine-tune recipients</Label>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {users.filter((u) => audienceRoles[audience]?.includes(u.role)).map((u) => (
                  <label key={u.email} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                    <input type="checkbox" className="h-4 w-4 accent-current"
                      checked={!excluded.includes(u.email)}
                      onChange={() => toggle(excluded, setExcluded, u.email)} />
                    <span className="font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{ROLE_LABEL[u.role as AppRole] ?? u.role}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Period 3 re-enrolment reminder"/></div>
        <div><Label>Message</Label><Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…"/></div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            {draftId && <Badge variant="secondary" className="ml-2">Editing draft</Badge>}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled={busy} onClick={saveDraft}>
              <FileText className="h-4 w-4"/> Save draft
            </Button>
            <Button className="gap-2" disabled={busy} onClick={send}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>} Send
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="font-display text-lg font-semibold mb-3">Drafts</h3>
        <TableShell
          head={["Date", "To", "Subject", "Status", ""]}
          rows={drafts.map((d: any) => [
            d.date, d.to, d.subject,
            <Badge variant="outline">Draft</Badge>,
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                setDraftId(d.id); setSubject(d.subject ?? ""); setBody(d.body ?? "");
                setMode(d.kind === "bulk" ? "bulk" : "private");
                setPicked((d.recipients ?? []).map((r: any) => r.email));
              }}><Edit3 className="h-3.5 w-3.5"/>Open</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                try { await apiClient.remove("message_drafts", d.id); }
                catch (e) { if (isNetworkError(e)) mockDb.remove("message_drafts", d.id); }
                toast.success("Draft deleted"); load();
              }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>,
          ])}
        />
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold mb-3">Sent — delivery & read receipts</h3>
        <TableShell
          head={["Date", "To", "Subject", "Type", "Status", "Read receipts"]}
          rows={threads.slice(-25).reverse().map((t: any) => [
            t.date, t.to, t.subject,
            <Badge variant="secondary">{t.kind === "bulk" ? "Broadcast" : "Private"}</Badge>,
            <Badge variant={t.read === t.total ? "default" : "outline"}>{t.read === t.total ? "Read by all" : "Sent"}</Badge>,
            `${t.read}/${t.total} read`,
          ])}
        />
      </div>
    </div>
  );
}

// =========================================================================
// Finance overview — income vs payroll vs expenses (USD with LRD equivalent)
// =========================================================================
function FinanceOverview() {
  const [state, setState] = useState<{ fees: any[]; donations: any[]; payroll: any[]; expenses: any[]; scholarships: any[] }>({
    fees: [], donations: [], payroll: [], expenses: [], scholarships: [],
  });

  useEffect(() => {
    (async () => {
      const pull = async (c: string) => {
        try { return (await apiClient.list(c)) as any[]; }
        catch (e) { return isNetworkError(e) ? mockDb.list<any>(c) : []; }
      };
      setState({
        fees: await pull("fees"),
        donations: await pull("donations"),
        payroll: await pull("payroll"),
        expenses: await pull("expenses"),
        scholarships: await pull("scholarships"),
      });
    })();
  }, []);

  const sum = (rows: any[], key: string) => rows.reduce((t, r) => t + Number(r[key] ?? 0), 0);
  const feesPaid = sum(state.fees.filter((f) => String(f.status).toLowerCase() === "paid"), "amount");
  const feesDue = sum(state.fees.filter((f) => String(f.status).toLowerCase() !== "paid"), "amount");
  const donations = sum(state.donations, "amountUsd") + sum(state.donations, "amount");
  const payroll = sum(state.payroll, "salaryUsd") + sum(state.payroll, "allowanceUsd");
  const expenses = sum(state.expenses, "amountUsd");
  const awards = sum(state.scholarships, "amountUsd");
  const net = feesPaid + donations - payroll - expenses - awards;

  const Row = ({ label, value, tone = "" }: { label: string; value: number; tone?: string }) => (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-display font-semibold ${tone}`}>{fmtMoney(value)}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Fees collected" value={fmtUSD(feesPaid)} />
        <StatCard icon={Heart} label="Donations" value={fmtUSD(donations)} accent="accent" />
        <StatCard icon={Wallet} label="Payroll" value={fmtUSD(payroll)} accent="secondary" />
        <StatCard icon={Receipt} label="Expenses" value={fmtUSD(expenses)} />
      </StaggerGroup>
      <Card className="max-w-2xl overflow-hidden">
        <Row label="Fees collected" value={feesPaid} tone="text-primary" />
        <Row label="Fees outstanding" value={feesDue} tone="text-destructive" />
        <Row label="Donations received" value={donations} tone="text-primary" />
        <Row label="Payroll commitments" value={payroll} />
        <Row label="Operating expenses" value={expenses} />
        <Row label="Scholarship awards" value={awards} />
        <Row label="Net position" value={net} tone={net >= 0 ? "text-primary" : "text-destructive"} />
      </Card>
    </div>
  );
}

// =========================================================================
// Receipts Hub — unified receipt centre for all financial documents
// =========================================================================
function ReceiptsHub() {
  const [tab, setTab] = useState<"fees"|"expenses"|"payroll"|"donations">("fees");
  const tabs: { key: typeof tab; label: string }[] = [
    { key: "fees",      label: "Tuition & Fees" },
    { key: "expenses",  label: "Expenses" },
    { key: "payroll",   label: "Payroll" },
    { key: "donations", label: "Donations" },
  ];
  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}>
            {t.label}
          </button>
        ))}
      </Card>
      {tab === "fees"      && <FeesModule/>}
      {tab === "expenses"  && <ExpensesModule/>}
      {tab === "payroll"   && <PayrollModule/>}
      {tab === "donations" && <DonationsModule/>}
    </div>
  );
}

// =========================================================================
// CMS — Navigation Manager
// =========================================================================
function NavigationModule() {
  useCmsVersion();
  const [items, setItems] = useState<NavItem[]>(() => cmsStore.listNav());
  const dirty = JSON.stringify(items) !== JSON.stringify(cmsStore.listNav());

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const moveChild = (pi: number, ci: number, dir: -1 | 1) => {
    const parent = items[pi]; if (!parent.children) return;
    const j = ci + dir; if (j < 0 || j >= parent.children.length) return;
    const cs = [...parent.children]; [cs[ci], cs[j]] = [cs[j], cs[ci]];
    const next = [...items]; next[pi] = { ...parent, children: cs }; setItems(next);
  };
  const update = (i: number, patch: Partial<NavItem>) => {
    const next = [...items]; next[i] = { ...next[i], ...patch }; setItems(next);
  };
  const updateChild = (pi: number, ci: number, patch: Partial<NavItem["children"] extends (infer T)[] | undefined ? T : never>) => {
    const parent = items[pi]; if (!parent.children) return;
    const cs = [...parent.children]; cs[ci] = { ...cs[ci], ...patch } as any;
    const next = [...items]; next[pi] = { ...parent, children: cs }; setItems(next);
  };
  const addItem = () => setItems([...items, { id: cmsStore.newId(), label: "New link", to: "/" }]);
  const addChild = (pi: number) => {
    const parent = items[pi];
    const cs = parent.children ?? [];
    const next = [...items];
    next[pi] = { ...parent, to: undefined, children: [...cs, { id: cmsStore.newId(), label: "New sub-link", to: "/" }] };
    setItems(next);
  };
  const removeItem = (i: number) => setItems(items.filter((_, x) => x !== i));
  const removeChild = (pi: number, ci: number) => {
    const parent = items[pi]; if (!parent.children) return;
    const cs = parent.children.filter((_, x) => x !== ci);
    const next = [...items];
    next[pi] = { ...parent, children: cs.length ? cs : undefined };
    setItems(next);
  };

  return (
    <>
      <Card className="p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">Public website menu</h3>
          <p className="text-sm text-muted-foreground">Drag-free editor: reorder, add or remove items. Changes apply immediately on save.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={addItem}><Plus className="h-4 w-4"/> Add item</Button>
        <Button variant="ghost" className="gap-2" onClick={()=>{ if(confirm("Reset to defaults?")) { cmsStore.resetNav(); setItems(cmsStore.listNav()); toast.success("Reset to defaults"); } }}><RotateCcw className="h-4 w-4"/> Reset</Button>
        <Button disabled={!dirty} onClick={()=>{ cmsStore.saveNav(items); toast.success("Menu published"); }}>Save changes</Button>
      </Card>

      <div className="space-y-3">
        {items.map((it, i) => (
          <Card key={it.id} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>move(i,-1)} disabled={i===0}><ChevronUp className="h-4 w-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>move(i,1)} disabled={i===items.length-1}><ChevronDownIcon className="h-4 w-4"/></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 flex-1">
                <div><Label className="text-xs">Label</Label><Input value={it.label} onChange={e=>update(i,{ label: e.target.value })}/></div>
                <div><Label className="text-xs">Path {it.children && it.children.length > 0 && <span className="text-muted-foreground">(ignored — has children)</span>}</Label>
                  <Input value={it.to ?? ""} placeholder="/about" disabled={!!(it.children && it.children.length>0)} onChange={e=>update(i,{ to: e.target.value })}/>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>addChild(i)}><Plus className="h-3.5 w-3.5"/>Sub-link</Button>
                <Button size="sm" variant="ghost" onClick={()=>removeItem(i)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            </div>

            {it.children && it.children.length > 0 && (
              <div className="mt-4 pl-6 border-l-2 border-muted space-y-2">
                {it.children.map((c, ci) => (
                  <div key={c.id} className="flex flex-col md:flex-row md:items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>moveChild(i,ci,-1)} disabled={ci===0}><ChevronUp className="h-3 w-3"/></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>moveChild(i,ci,1)} disabled={ci===(it.children!.length-1)}><ChevronDownIcon className="h-3 w-3"/></Button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 flex-1">
                      <Input value={c.label} onChange={e=>updateChild(i,ci,{ label: e.target.value } as any)} placeholder="Label"/>
                      <Input value={c.to} onChange={e=>updateChild(i,ci,{ to: e.target.value } as any)} placeholder="/path"/>
                      <Input value={c.description ?? ""} onChange={e=>updateChild(i,ci,{ description: e.target.value } as any)} placeholder="Short description"/>
                    </div>
                    <Button size="icon" variant="ghost" onClick={()=>removeChild(i,ci)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// =========================================================================
// Extracted async modules: Timetable, Children, Audit
// =========================================================================
function TimetableModule() {
  const principal = usePrincipal();
  const [rawData, setRawData] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .list("timetable")
      .then((d) => setRawData(scopeRows("timetable", d as any[], principal)))
      .catch((e) => {
        if (isNetworkError(e))
          setRawData(scopeRows("timetable", mockDb.list<any>("timetable"), principal));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal?.id]);

  // Merge records that share the same day so we always show one card per day.
  // This handles both the legacy single-record-per-day format and the new
  // per-teacher format (where each teacher has their own day records).
  const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayMap = new Map<string, any[]>();
  for (const r of rawData) {
    if (!r.day) continue;
    const existing = dayMap.get(r.day) ?? [];
    existing.push(...(r.slots ?? []));
    dayMap.set(r.day, existing);
  }
  const merged = orderedDays
    .filter((d) => dayMap.has(d))
    .map((d) => ({
      day: d,
      slots: (dayMap.get(d) ?? []).sort((a: any, b: any) => a.t.localeCompare(b.t)),
    }));

  if (merged.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-10 text-center text-muted-foreground text-sm">
        No timetable entries found for your account.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {merged.map((d, i) => (
        <Reveal key={d.day} delay={i * 0.05}>
          <Card className="p-5">
            <h3 className="font-display text-lg font-semibold">{d.day}</h3>
            <ul className="mt-3 space-y-2">
              {d.slots.map((s: any, si: number) => (
                <li key={`${s.t}-${s.s}-${si}`} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
                  <span className="font-display font-semibold text-primary tabular-nums w-14">{s.t}</span>
                  <span className="text-sm">{s.s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

function ChildrenModule() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("children").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("children"));
    });
  }, []);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {data.map((c: any, i) => (
        <Reveal key={c.id ?? i} delay={i * 0.05}>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center font-bold text-xl">
                {c.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-display text-lg font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.grade}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="font-display font-bold text-primary text-lg">{c.attendance}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">GPA</p>
                <p className="font-display font-bold text-primary text-lg">{c.gpa}</p>
              </div>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

function AnalyticsModule() {
  const [stats, setStats] = useState<{
    classes: number; assignments: number; donations: number; users: number;
    byRole: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [classes, assignments, donations, users, fees] = await Promise.all([
          apiClient.list<any>("classes"),
          apiClient.list<any>("assignments"),
          apiClient.list<any>("donations"),
          apiClient.listUsers(),
          apiClient.list<any>("fees"),
        ]);
        const totalDonations = donations.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0);
        const byRole: Record<string, number> = {};
        for (const u of users) byRole[u.role] = (byRole[u.role] ?? 0) + 1;
        setStats({ classes: classes.length, assignments: assignments.length, donations: totalDonations, users: users.length, byRole });
      } catch {
        const classes    = mockDb.list<any>("classes");
        const assignments = mockDb.list<any>("assignments");
        const donations  = mockDb.list<any>("donations");
        const users      = await mockAuth.listUsers();
        const totalDonations = donations.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0);
        const byRole: Record<string, number> = {};
        for (const u of users) byRole[u.role] = (byRole[u.role] ?? 0) + 1;
        setStats({ classes: classes.length, assignments: assignments.length, donations: totalDonations, users: users.length, byRole });
      }
    })();
  }, []);

  const roleBars = stats
    ? Object.entries(stats.byRole).map(([r, count]) => ({
        r: ROLE_LABEL[r as keyof typeof ROLE_LABEL] ?? r,
        v: Math.round((count / (stats.users || 1)) * 100),
      }))
    : [];

  return (
    <>
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Users}         label="Total Users"     value={stats?.users ?? "—"} />
        <StatCard icon={BookOpen}      label="Classes"         value={stats?.classes ?? "—"}        accent="accent"/>
        <StatCard icon={ClipboardList} label="Assignments"     value={stats?.assignments ?? "—"}    accent="secondary"/>
        <StatCard icon={Heart}         label="Total Donations" value={stats ? `$${stats.donations.toLocaleString()}` : "—"}/>
      </StaggerGroup>
      <Card className="p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Users by role</h3>
        <div className="space-y-3">
          {roleBars.length > 0 ? roleBars.map(b => (
            <div key={b.r}>
              <div className="flex justify-between text-sm"><span>{b.r}</span><span className="font-semibold">{b.v}%</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${b.v}%` }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }} className="h-full bg-gradient-to-r from-primary to-accent"/>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </div>
      </Card>
    </>
  );
}

function AuditModule() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("audit").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("audit"));
    });
  }, []);
  return (
    <TableShell
      head={["When", "Actor", "Action"]}
      rows={data.map(a => [a.at, a.actor, a.action])}
    />
  );
}

/** Staff roles subject to module access control (admin/superadmin always pass). */
const CONTROLLED_ROLES = new Set(["admin_assistant","registrar","admissions_officer","teacher","nurse"]);

function ModuleRoute() {
  const { key } = useParams<{ key: string }>();
  const { primaryRole } = useAuth();
  const def = key ? MODULES[key] : undefined;

  if (!def) {
    return (
      <RequireAuth>
        <PortalShell title="Module not found" subtitle={`No module is registered at /portal/m/${key}`}>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">This module hasn't been wired up yet.</p>
            <Link to="/portal" className="mt-4 inline-flex text-primary font-semibold underline">Back to portal</Link>
          </Card>
        </PortalShell>
      </RequireAuth>
    );
  }

  // Check module access for controllable staff roles
  const isBlocked =
    key &&
    primaryRole &&
    CONTROLLED_ROLES.has(primaryRole) &&
    !moduleAccessStore.isEnabled(primaryRole, key);

  if (isBlocked) {
    return (
      <RequireAuth allow={def.allow}>
        <PortalShell title={def.title} subtitle="Access restricted">
          <Card className="p-10 text-center">
            <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold">Module access restricted</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Your administrator has disabled access to this module. Contact your school admin if you need access.
            </p>
            <Link to="/portal" className="mt-5 inline-flex text-primary font-semibold underline text-sm">Back to dashboard</Link>
          </Card>
        </PortalShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allow={def.allow}>
      <PortalShell title={def.title} subtitle={def.subtitle}>
        {def.render()}
      </PortalShell>
    </RequireAuth>
  );
}

export default ModuleRoute;

// =========================================================================
// Site Settings — deep editor for brand, contact, logo, colors and system text
// Editable by Super Admin and Admin. Persists via brandStore (localStorage).
// =========================================================================
function SiteSettingsModule() {
  const brand = useBrand();
  const [form, setForm] = useState<BrandSettings>(brand);
  const [tab, setTab] = useState<"brand" | "contact" | "appearance" | "system">("brand");
  const dirty = JSON.stringify(form) !== JSON.stringify(brand);

  const set = <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onLogo = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Logo must be under 4 MB"); return; }
    const url = await readBrandFile(file);
    set("logoUrl", url);
    toast.success("Logo updated — click Save to publish");
  };
  const onFavicon = async (file: File | null) => {
    if (!file) return;
    const url = await readBrandFile(file);
    set("faviconUrl", url);
    toast.success("Favicon updated — click Save to publish");
  };

  const save = () => {
    brandStore.set(form);
    toast.success("Site settings published");
  };
  const reset = () => {
    if (!confirm("Reset all branding to defaults? This cannot be undone.")) return;
    const d = brandStore.reset();
    setForm(d);
    toast.success("Restored defaults");
  };

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
        tab === id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
      }`}
    >{label}</button>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">Brand & system settings</h3>
          <p className="text-sm text-muted-foreground">Changes apply instantly everywhere — navbar, footer, sidebar, login, chatbot.</p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset to defaults</Button>
        <Button disabled={!dirty} onClick={save}>Save changes</Button>
      </Card>

      <div className="flex flex-wrap gap-2">
        <TabBtn id="brand" label="Brand & Identity" />
        <TabBtn id="contact" label="Contact & Address" />
        <TabBtn id="appearance" label="Appearance & Logo" />
        <TabBtn id="system" label="System Text" />
      </div>

      {tab === "brand" && (
        <Card className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e)=>set("name", e.target.value)} placeholder="HOPE2 ACADEMY"/></div>
            <div><Label>Short name</Label><Input value={form.shortName} onChange={(e)=>set("shortName", e.target.value)}/></div>
          </div>
          <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e)=>set("tagline", e.target.value)}/></div>
          <div><Label>Motto</Label><Input value={form.motto} onChange={(e)=>set("motto", e.target.value)}/></div>
          <div><Label>Year established</Label><Input value={form.established} onChange={(e)=>set("established", e.target.value)} className="max-w-[180px]"/></div>
        </Card>
      )}

      {tab === "contact" && (
        <Card className="p-6 space-y-4">
          <div><Label>Street address</Label><Input value={form.address} onChange={(e)=>set("address", e.target.value)}/></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>City / county</Label><Input value={form.city} onChange={(e)=>set("city", e.target.value)}/></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e)=>set("country", e.target.value)}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Contact email</Label><Input type="email" value={form.email} onChange={(e)=>set("email", e.target.value)}/></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e)=>set("phone", e.target.value)}/></div>
          </div>
          <div><Label>Office hours</Label><Input value={form.officeHours} onChange={(e)=>set("officeHours", e.target.value)} placeholder="Mon–Fri · 7:00 AM – 4:00 PM"/></div>
        </Card>
      )}

      {tab === "appearance" && (
        <Card className="p-6 space-y-6">
          <div>
            <Label>Primary logo</Label>
            <div className="mt-2 flex items-center gap-5">
              <img src={form.logoUrl} alt="Logo preview" className="h-24 w-24 rounded-full object-cover ring-2 ring-border bg-white" />
              <div className="space-y-2">
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onLogo(e.target.files?.[0] ?? null)}/>
                <label htmlFor="logo-upload"><Button asChild className="gap-2"><span><Upload className="h-4 w-4"/>Upload new logo</span></Button></label>
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG up to 4 MB. Used in navbar, footer, sidebar, login & chatbot.</p>
                <Input value={form.logoUrl} onChange={(e)=>set("logoUrl", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div>
            <Label>Favicon</Label>
            <div className="mt-2 flex items-center gap-5">
              <img src={form.faviconUrl} alt="Favicon preview" className="h-12 w-12 rounded object-cover ring-1 ring-border bg-white" />
              <div className="space-y-2">
                <input id="fav-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onFavicon(e.target.files?.[0] ?? null)}/>
                <label htmlFor="fav-upload"><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4"/>Upload favicon</span></Button></label>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Primary colour</Label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={form.primaryHex} onChange={(e)=>set("primaryHex", e.target.value)} className="h-10 w-14 rounded border border-border"/>
                <Input value={form.primaryHex} onChange={(e)=>set("primaryHex", e.target.value)}/>
              </div>
            </div>
            <div>
              <Label>Accent colour</Label>
              <div className="flex items-center gap-3 mt-1">
                <input type="color" value={form.accentHex} onChange={(e)=>set("accentHex", e.target.value)} className="h-10 w-14 rounded border border-border"/>
                <Input value={form.accentHex} onChange={(e)=>set("accentHex", e.target.value)}/>
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "system" && (
        <Card className="p-6 space-y-4">
          <div>
            <Label>Footer blurb</Label>
            <Textarea rows={3} value={form.footerBlurb} onChange={(e)=>set("footerBlurb", e.target.value)}/>
          </div>
          <div>
            <Label>Chatbot greeting</Label>
            <Textarea rows={3} value={form.chatGreeting} onChange={(e)=>set("chatGreeting", e.target.value)}/>
            <p className="text-xs text-muted-foreground mt-1">First message visitors see when they open the live chat.</p>
          </div>
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold mb-2">Public pages (CMS)</h4>
            <p className="text-sm text-muted-foreground mb-3">Edit page text, SEO and navigation in the dedicated CMS modules.</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/portal/m/pages" className="inline-flex"><Button variant="outline" className="gap-2"><FileText className="h-4 w-4"/>Pages</Button></Link>
              <Link to="/portal/m/posts" className="inline-flex"><Button variant="outline" className="gap-2"><Newspaper className="h-4 w-4"/>Posts</Button></Link>
              <Link to="/portal/m/media" className="inline-flex"><Button variant="outline" className="gap-2"><ImageIcon className="h-4 w-4"/>Media</Button></Link>
              <Link to="/portal/m/navigation" className="inline-flex"><Button variant="outline" className="gap-2"><ListTree className="h-4 w-4"/>Navigation</Button></Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// =========================================================================
// Generic CRUD helper — drives most list modules
// =========================================================================
type FieldDef = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};
type ColumnDef = { key: string; label: string; render?: (value: any, row: any) => ReactNode };

function SimpleCrud({
  collection,
  itemLabel,
  createLabel,
  fields,
  columns,
}: {
  collection: string;
  itemLabel: string;
  createLabel?: string;
  fields: FieldDef[];
  columns: ColumnDef[];
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [all, setAll] = useState<any[]>([]);
  const principal = usePrincipal();
  const locked = principal ? approvalsStore.lockedCollections(principal.id, principal.role) : [];
  const isLocked = locked.includes(collection);
  const writable = canWrite(collection, principal?.role ?? null, locked);
  const downloadable = canDownload(collection, principal?.role ?? null);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.list(collection);
      setAll(data as any[]);
    } catch (e) {
      if (isNetworkError(e)) setAll(mockDb.list<any>(collection));
    }
  }, [collection]);

  useEffect(() => { load(); }, [load]);

  // Data isolation: users only ever see rows their role/identity entitles them to.
  const visible = scopeRows(collection, all, principal);
  const rows = visible.filter((r) =>
    !q || columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  const exportCsv = () => {
    const header = columns.map((c) => c.label);
    const lines = [header, ...rows.map((r) => columns.map((c) => String(r[c.key] ?? "")))]
      .map((cells) => cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hope2-${collection}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  const printReport = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) { toast.error("Allow pop-ups to print this report"); return; }
    const head = columns.map((c) => `<th>${c.label}</th>`).join("");
    const body = rows
      .map((r) => `<tr>${columns.map((c) => `<td>${String(r[c.key] ?? "—")}</td>`).join("")}</tr>`)
      .join("");
    w.document.write(`<html><head><title>HOPE2 ACADEMY — ${itemLabel} report</title>
      <style>body{font-family:Georgia,serif;padding:32px}h1{font-size:20px;margin:0}
      p{color:#555;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
      th,td{border:1px solid #ccc;padding:7px 9px;text-align:left}th{background:#f4f1ea}</style></head>
      <body><h1>HOPE2 ACADEMY</h1><p>${cap(itemLabel)} report for ${principal?.name ?? ""} — ${new Date().toLocaleDateString()}</p>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
    w.document.close();
    w.print();
  };

  const remove = async (row: any) => {
    if (!writable) { toast.error("You don't have permission to delete this record"); return; }
    if (!confirm(`Delete this ${itemLabel}?`)) return;
    try {
      await apiClient.remove(collection, row.id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete"); return; }
      mockDb.remove(collection, row.id);
    }
    toast.success(`${cap(itemLabel)} deleted`);
    load();
  };

  const handleSave = async (values: Record<string, any>) => {
    if (!writable) { toast.error("You don't have permission to edit this record"); return; }
    const normalized: any = {};
    for (const f of fields) {
      const v = values[f.name];
      normalized[f.name] = f.type === "number" ? Number(v ?? 0) : v ?? "";
    }
    if (!editing) Object.assign(normalized, stampOwner(normalized, principal));
    try {
      if (editing) {
        await apiClient.update(collection, editing.id, normalized);
      } else {
        await apiClient.create(collection, normalized);
      }
      toast.success(`${cap(itemLabel)} ${editing ? "updated" : "created"}`);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not save"); return; }
      if (editing) mockDb.update(collection, editing.id, normalized);
      else mockDb.create(collection, normalized);
      toast.success(`${cap(itemLabel)} ${editing ? "updated" : "created"}`);
    }
    setEditing(null);
    setCreating(false);
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${itemLabel}s…`} className="pl-9 bg-card" />
        </div>
        {writable ? (
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> {createLabel ?? `New ${itemLabel}`}
          </Button>
        ) : (
          <Badge variant="secondary" className="h-9 px-3 grid place-items-center">
            {isLocked ? "Locked — submitted for approval" : downloadable ? "View & download only" : "Read-only"}
          </Badge>
        )}
        {downloadable && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Download CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={printReport}>
              <FileText className="h-4 w-4" /> Print / PDF
            </Button>
          </div>
        )}
      </div>
      <TableShell
        head={[...columns.map((c) => c.label), ...(writable || downloadable ? [""] : [])]}
        rows={rows.map((r) => [
          ...columns.map((c) => (c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—"))),
          ...(writable
            ? [
                <div className="flex items-center gap-2 justify-end">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}>
                    <Edit3 className="h-3.5 w-3.5" />Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>,
              ]
            : downloadable
              ? [
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setViewing(r)}>
                      <Search className="h-3.5 w-3.5" />View
                    </Button>
                  </div>,
                ]
              : []),
        ])}
      />
      {viewing && (
        <Dialog open onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{cap(itemLabel)} details</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {columns.map((c) => (
                <div key={c.key} className="flex justify-between gap-6 border-b border-border py-2 text-sm">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium text-right">{String(viewing[c.key] ?? "—")}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              <Button className="gap-2" onClick={printReport}><Download className="h-4 w-4"/>Download report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {(editing || creating) && (
        <SimpleEditor
          itemLabel={itemLabel}
          fields={fields}
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function SimpleEditor({
  itemLabel, fields, row, onClose, onSave,
}: {
  itemLabel: string;
  fields: FieldDef[];
  row: any | null;
  onClose: () => void;
  onSave: (values: Record<string, any>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) init[f.name] = row?.[f.name] ?? (f.type === "number" ? 0 : "");
    return init;
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    for (const f of fields) {
      if (f.required && (form[f.name] === "" || form[f.name] === null || form[f.name] === undefined)) {
        toast.error(`${f.label} is required`); return;
      }
    }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row ? `Edit ${itemLabel}` : `New ${itemLabel}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea rows={4} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <Select value={String(form[f.name] ?? "")} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.type}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Hero Slider — admin module to edit homepage slides without redeploying
// =========================================================================
function HeroSliderModule() {
  const slides = useHeroSlides();
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = (s: HeroSlide) => {
    if (!confirm(`Delete slide "${s.title} ${s.titleAccent}"?`)) return;
    heroStore.remove(s.id); toast.success("Slide removed");
  };
  const toggle = (s: HeroSlide) => {
    heroStore.upsert({ ...s, enabled: !s.enabled });
  };
  const reset = () => {
    if (!confirm("Reset hero slides to defaults? Custom slides will be lost.")) return;
    heroStore.reset(); toast.success("Slides reset to defaults");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {slides.length} slide{slides.length === 1 ? "" : "s"} · {slides.filter(s=>s.enabled).length} active on the homepage carousel.
          </p>
        </div>
        <Button variant="ghost" className="gap-2" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</Button>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/>New slide</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {slides.map((s, i) => (
          <Reveal key={s.id} delay={i*0.04}>
            <Card className="overflow-hidden">
              <div className="aspect-[16/9] bg-muted relative">
                {s.img && <img src={s.img} alt={s.alt} className="absolute inset-0 h-full w-full object-cover"/>}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"/>
                <div className="absolute bottom-3 left-3 right-3 text-background">
                  <p className="text-[10px] uppercase tracking-wider opacity-90">{s.kicker}</p>
                  <p className="font-display font-bold text-lg leading-tight">{s.title} <span className="text-accent">{s.titleAccent}</span></p>
                </div>
                {!s.enabled && (
                  <span className="absolute top-3 left-3 rounded-full bg-foreground/70 text-background px-2 py-0.5 text-[10px] font-semibold">Hidden</span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{s.primaryLabel} → {s.primaryTo}</Badge>
                  <Badge variant="outline">{s.secondaryLabel} → {s.secondaryTo}</Badge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={()=>heroStore.move(s.id, -1)} disabled={i===0} aria-label="Move up"><ChevronUp className="h-4 w-4"/></Button>
                  <Button size="sm" variant="outline" onClick={()=>heroStore.move(s.id, 1)} disabled={i===slides.length-1} aria-label="Move down"><ChevronDownIcon className="h-4 w-4"/></Button>
                  <Button size="sm" variant="outline" onClick={()=>toggle(s)}>{s.enabled ? "Hide" : "Show"}</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={()=>setEditing(s)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={()=>remove(s)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {(editing || creating) && (
        <HeroSlideEditor
          slide={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </>
  );
}

function HeroSlideEditor({ slide, onClose }: { slide: HeroSlide | null; onClose: () => void }) {
  const [form, setForm] = useState<HeroSlide>(() => slide ?? {
    id: heroStore.newId(), img: "", alt: "",
    kicker: "", title: "", titleAccent: "", body: "",
    primaryLabel: "Learn more", primaryTo: "/about",
    secondaryLabel: "Contact us", secondaryTo: "/contact",
    enabled: true,
  });
  const set = <K extends keyof HeroSlide>(k: K, v: HeroSlide[K]) => setForm(f => ({ ...f, [k]: v }));

  const onImage = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB"); return; }
    const url = await readBrandFile(file);
    set("img", url);
    toast.success("Image attached — click Save to publish");
  };

  const save = () => {
    if (!form.title.trim() || !form.img.trim()) {
      toast.error("Image and title are required"); return;
    }
    heroStore.upsert(form);
    toast.success(`Slide ${slide ? "updated" : "added"} — live on the homepage`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{slide ? "Edit slide" : "New slide"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Image</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="h-24 w-40 rounded-lg overflow-hidden bg-muted shrink-0">
                {form.img ? <img src={form.img} alt="preview" className="h-full w-full object-cover"/> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="flex-1 space-y-2">
                <input id="hero-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onImage(e.target.files?.[0] ?? null)}/>
                <label htmlFor="hero-upload"><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4"/>Upload image</span></Button></label>
                <Input value={form.img} onChange={(e)=>set("img", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div><Label>Alt text</Label><Input value={form.alt} onChange={(e)=>set("alt", e.target.value)} placeholder="Describe the image for accessibility"/></div>
          <div><Label>Kicker (small uppercase label)</Label><Input value={form.kicker} onChange={(e)=>set("kicker", e.target.value)} placeholder="HOPE2 MISSION · Capacity Building"/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e)=>set("title", e.target.value)} placeholder="Raising leaders"/></div>
            <div><Label>Title accent (highlighted)</Label><Input value={form.titleAccent} onChange={(e)=>set("titleAccent", e.target.value)} placeholder="rooted in purpose"/></div>
          </div>
          <div><Label>Body copy</Label><Textarea rows={3} value={form.body} onChange={(e)=>set("body", e.target.value)}/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Primary button text</Label><Input value={form.primaryLabel} onChange={(e)=>set("primaryLabel", e.target.value)}/></div>
            <div><Label>Primary button link</Label><Input value={form.primaryTo} onChange={(e)=>set("primaryTo", e.target.value)} placeholder="/get-involved"/></div>
            <div><Label>Secondary button text</Label><Input value={form.secondaryLabel} onChange={(e)=>set("secondaryLabel", e.target.value)}/></div>
            <div><Label>Secondary button link</Label><Input value={form.secondaryTo} onChange={(e)=>set("secondaryTo", e.target.value)} placeholder="/about"/></div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={(e)=>set("enabled", e.target.checked)} className="h-4 w-4"/>
            Show this slide on the public homepage
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save slide</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Stat strips for modules that need quick KPIs above the CRUD table
// =========================================================================

// =========================================================================
// Team Page editor — edit public Team page content + member cards
// =========================================================================
function TeamPageModule() {
  const content = useTeamContent();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [creating, setCreating] = useState(false);

  const removeMember = (m: TeamMember) => {
    if (!confirm(`Delete member "${m.name}"?`)) return;
    teamStore.removeMember(m.id); toast.success("Member removed");
  };
  const toggle = (m: TeamMember) => teamStore.upsertMember({ ...m, enabled: !m.enabled });
  const reset = () => {
    if (!confirm("Reset Team page to defaults? Edits will be lost.")) return;
    teamStore.reset(); toast.success("Team page reset");
  };

  return (
    <>
      <Card className="p-5 mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Page copy</p>
          <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="h-4 w-4"/>Reset all</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Eyebrow</Label><Input value={content.eyebrow} onChange={(e)=>teamStore.setContent({ eyebrow: e.target.value })}/></div>
          <div><Label>Section heading</Label><Input value={content.sectionHeading} onChange={(e)=>teamStore.setContent({ sectionHeading: e.target.value })}/></div>
        </div>
        <div><Label>Hero title</Label><Input value={content.title} onChange={(e)=>teamStore.setContent({ title: e.target.value })}/></div>
        <div><Label>Hero lead</Label><Textarea rows={2} value={content.lead} onChange={(e)=>teamStore.setContent({ lead: e.target.value })}/></div>
        <div><Label>Section lead</Label><Textarea rows={2} value={content.sectionLead} onChange={(e)=>teamStore.setContent({ sectionLead: e.target.value })}/></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Closing quote</Label><Textarea rows={2} value={content.quote} onChange={(e)=>teamStore.setContent({ quote: e.target.value })}/></div>
          <div><Label>Quote attribution</Label><Input value={content.quoteAuthor} onChange={(e)=>teamStore.setContent({ quoteAuthor: e.target.value })}/></div>
        </div>
        <p className="text-xs text-muted-foreground">Changes save automatically and appear on the public /team page immediately.</p>
      </Card>

      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm text-muted-foreground flex-1">{content.members.length} member{content.members.length===1?"":"s"} · {content.members.filter(m=>m.enabled).length} shown publicly</p>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/>Add member</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.members.map((m, i) => (
          <Card key={m.id} className="overflow-hidden">
            <div className="aspect-[4/3] bg-muted relative">
              {m.img && <img src={m.img} alt={m.name} className="absolute inset-0 h-full w-full object-cover"/>}
              {!m.enabled && <span className="absolute top-2 left-2 rounded-full bg-foreground/70 text-background px-2 py-0.5 text-[10px] font-semibold">Hidden</span>}
            </div>
            <div className="p-4 space-y-2">
              <p className="font-semibold leading-tight">{m.name}</p>
              <p className="text-xs text-secondary font-medium">{m.role}</p>
              {m.bio && <p className="text-xs text-muted-foreground line-clamp-2">{m.bio}</p>}
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={()=>teamStore.moveMember(m.id, -1)} disabled={i===0}><ChevronUp className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={()=>teamStore.moveMember(m.id, 1)} disabled={i===content.members.length-1}><ChevronDownIcon className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={()=>toggle(m)}>{m.enabled?"Hide":"Show"}</Button>
                <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={()=>setEditing(m)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
                <Button size="sm" variant="ghost" onClick={()=>removeMember(m)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(editing || creating) && (
        <TeamMemberEditor member={editing} onClose={()=>{ setEditing(null); setCreating(false); }}/>
      )}
    </>
  );
}

function TeamMemberEditor({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  const [form, setForm] = useState<TeamMember>(() => member ?? {
    id: teamStore.newId(), img: "", name: "", role: "", bio: "", email: "", linkedin: "", enabled: true,
  });
  const set = <K extends keyof TeamMember>(k: K, v: TeamMember[K]) => setForm(f => ({ ...f, [k]: v }));
  const onImage = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB"); return; }
    const url = await readBrandFile(file);
    set("img", url); toast.success("Photo attached — click Save");
  };
  const save = () => {
    if (!form.name.trim() || !form.role.trim()) { toast.error("Name and role are required"); return; }
    teamStore.upsertMember(form);
    toast.success(`Member ${member ? "updated" : "added"}`); onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Photo</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                {form.img ? <img src={form.img} alt="preview" className="h-full w-full object-cover"/> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">No photo</div>}
              </div>
              <div className="flex-1 space-y-2">
                <input id="tm-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>onImage(e.target.files?.[0] ?? null)}/>
                <label htmlFor="tm-upload"><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4"/>Upload photo</span></Button></label>
                <Input value={form.img} onChange={(e)=>set("img", e.target.value)} placeholder="…or paste an image URL" className="text-xs"/>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e)=>set("name", e.target.value)}/></div>
            <div><Label>Role / Title</Label><Input value={form.role} onChange={(e)=>set("role", e.target.value)}/></div>
          </div>
          <div><Label>Short bio</Label><Textarea rows={3} value={form.bio ?? ""} onChange={(e)=>set("bio", e.target.value)}/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e)=>set("email", e.target.value)} placeholder="name@hope2academy.org"/></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin ?? ""} onChange={(e)=>set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…"/></div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={(e)=>set("enabled", e.target.checked)} className="h-4 w-4"/>
            Show this member on the public Team page
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// =========================================================================
function GradesStats() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("grades").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("grades"));
    });
  }, []);
  const avg = Math.round(data.reduce((s, g) => s + Number(g.score || 0), 0) / Math.max(1, data.length));
  return (
    <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
      <StatCard icon={Award} label="Entries" value={data.length} />
      <StatCard icon={BarChart3} label="Class Average" value={`${avg}%`} accent="accent" />
      <StatCard icon={CheckCircle2} label="Above 90%" value={data.filter((d) => Number(d.score) >= 90).length} accent="secondary" />
    </StaggerGroup>
  );
}

function FeesStats() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("fees").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("fees"));
    });
  }, []);
  const outstanding = data.filter((f) => f.status === "Outstanding").reduce((s, f) => s + Number(f.amount || 0), 0);
  const paid = data.filter((f) => f.status === "Paid").reduce((s, f) => s + Number(f.amount || 0), 0);
  return (
    <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
      <StatCard icon={DollarSign} label="Outstanding" value={fmtMoney(outstanding)} />
      <StatCard icon={CheckCircle2} label="Paid this period" value={fmtMoney(paid)} accent="secondary" />
      <StatCard icon={Heart} label="Donations YTD" value={fmtMoney(1325)} accent="accent" />
    </StaggerGroup>
  );
}

function DonationsStats() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    apiClient.list("donations").then(d => setData(d as any[])).catch(e => {
      if (isNetworkError(e)) setData(mockDb.list<any>("donations"));
    });
  }, []);
  const total = data.reduce((s, d) => s + Number(d.amount || 0), 0);
  return (
    <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
      <StatCard icon={DollarSign} label="Total raised" value={fmtMoney(total)} />
      <StatCard icon={Users} label="Donors" value={data.length} accent="accent" />
      <StatCard icon={Heart} label="Recurring" value={3} accent="secondary" />
    </StaggerGroup>
  );
}

// =========================================================================
// Messages — inbox with mark read + delete
// =========================================================================
function MessagesModule() {
  const [data, setData] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await apiClient.list("messages");
      setData(list as any[]);
    } catch (e) {
      if (isNetworkError(e)) setData(mockDb.list<any>("messages"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const unread = data.filter((m) => m.unread).length;

  const markRead = async (id: string) => {
    const row = data.find((m) => m.id === id);
    if (row && !row.unread) return;
    const patch = { unread: false, status: "read", readAt: new Date().toISOString() };
    try {
      await apiClient.update("messages", id, patch);
    } catch (e) {
      if (isNetworkError(e)) mockDb.update<any>("messages", id, patch);
    }
    load();
  };
  const remove = async (id: string) => {
    try {
      await apiClient.remove("messages", id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error("Could not delete"); return; }
      mockDb.remove("messages", id);
    }
    toast.success("Message deleted");
    load();
  };

  return (
    <>
      <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
        <StatCard icon={Inbox} label="Inbox" value={data.length} />
        <StatCard icon={Sparkles} label="Unread" value={unread} accent="accent" />
        <StatCard icon={CheckCircle2} label="Read" value={data.length - unread} accent="secondary" />
      </StaggerGroup>
      <Card className="divide-y divide-border">
        {data.map((m: any) => (
          <div key={m.id} className="p-4 hover:bg-muted/30 flex items-start gap-4">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => markRead(m.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {m.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <p className="font-semibold">{m.from}</p>
                  <span className="text-xs text-muted-foreground">→ {m.to}</span>
                  <Badge variant={m.unread ? "outline" : "secondary"} className="text-[10px]">
                    {m.status === "draft" ? "Draft" : m.unread ? "Sent" : "Read"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{m.subject}</p>
              <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
              {m.readAt && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Read receipt sent {new Date(m.readAt).toLocaleString()}
                </p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {data.length === 0 && <p className="p-8 text-center text-muted-foreground">Inbox is empty.</p>}
      </Card>
    </>
  );
}

// =========================================================================
// Academics — Classes (full CRUD)
// =========================================================================
// (Messaging & finance modules live at the bottom of this file)
type ClassRow = { id: string; name: string; teacher: string; room: string; students: number; schedule: string };

function ClassesModule() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [all, setAll] = useState<ClassRow[]>([]);
  const principal = usePrincipal();
  const writable = canWrite("classes", principal?.role ?? null);

  const load = useCallback(async () => {
    try {
      const list = await apiClient.list("classes");
      setAll(list as ClassRow[]);
    } catch (e) {
      if (isNetworkError(e)) setAll(mockDb.list<ClassRow>("classes"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = all.filter((c) => !q || `${c.name} ${c.teacher} ${c.room}`.toLowerCase().includes(q.toLowerCase()));

  const remove = async (c: ClassRow) => {
    if (!writable) { toast.error("Only Admin can delete classes"); return; }
    if (!confirm(`Delete class "${c.name}"?`)) return;
    try {
      await apiClient.remove("classes", c.id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete"); return; }
      mockDb.remove("classes", c.id);
    }
    toast.success("Class deleted");
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search classes…" className="pl-9 bg-card" />
        </div>
        {writable ? (
          <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New class</Button>
        ) : (
          <Badge variant="secondary" className="h-9 px-3 grid place-items-center">Read-only</Badge>
        )}
      </div>
      <TableShell
        head={["Class", "Teacher", "Room", "Students", "Schedule", ...(writable ? [""] : [])]}
        rows={rows.map((c) => [
          <span className="font-medium">{c.name}</span>,
          c.teacher,
          c.room,
          c.students,
          c.schedule,
          ...(writable ? [
            <div className="flex items-center gap-2 justify-end">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(c)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
              <Button size="sm" variant="ghost" onClick={()=>remove(c)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>,
          ] : []),
        ])}
      />
      {(editing || creating) && (
        <ClassEditor
          row={editing}
          onClose={()=>{ setEditing(null); setCreating(false); load(); }}
        />
      )}
    </>
  );
}

function ClassEditor({ row, onClose }: { row: ClassRow | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<ClassRow>>(row ?? { name: "", teacher: "", room: "", students: 0, schedule: "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name || !form.teacher) { toast.error("Name and teacher are required"); return; }
    setSaving(true);
    const data = { ...(form as ClassRow), students: Number(form.students) || 0 };
    try {
      if (row) await apiClient.update("classes", row.id, data);
      else await apiClient.create("classes", data);
      toast.success(row ? "Class updated" : "Class created");
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not save"); setSaving(false); return; }
      if (row) mockDb.update<ClassRow>("classes", row.id, data);
      else mockDb.create<ClassRow>("classes", data);
      toast.success(row ? "Class updated" : "Class created");
    }
    setSaving(false);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row ? "Edit class" : "New class"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Class name</Label><Input value={form.name ?? ""} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Grade 9 — Mathematics"/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Teacher</Label><Input value={form.teacher ?? ""} onChange={(e)=>setForm({...form, teacher:e.target.value})}/></div>
            <div><Label>Room</Label><Input value={form.room ?? ""} onChange={(e)=>setForm({...form, room:e.target.value})}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Students</Label><Input type="number" value={form.students ?? 0} onChange={(e)=>setForm({...form, students:Number(e.target.value)})}/></div>
            <div><Label>Schedule</Label><Input value={form.schedule ?? ""} onChange={(e)=>setForm({...form, schedule:e.target.value})} placeholder="Mon/Wed/Fri 08:00"/></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Academics — Assignments (full CRUD)
// =========================================================================
type AssignmentRow = {
  id: string; title: string; class: string; due: string; submissions: number; status: string;
  bookId?: string; bookTitle?: string; bookUrl?: string; chapter?: string;
};

function AssignmentsModule() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AssignmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [all, setAll] = useState<AssignmentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  const load = useCallback(async () => {
    try {
      const [asgns, cls] = await Promise.all([
        apiClient.list("assignments"),
        apiClient.list("classes"),
      ]);
      setAll(asgns as AssignmentRow[]);
      setClasses(cls as ClassRow[]);
    } catch (e) {
      if (isNetworkError(e)) {
        setAll(mockDb.list<AssignmentRow>("assignments"));
        setClasses(mockDb.list<ClassRow>("classes"));
      }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = all.filter((a) => !q || `${a.title} ${a.class}`.toLowerCase().includes(q.toLowerCase()));

  const remove = async (a: AssignmentRow) => {
    if (!confirm(`Delete assignment "${a.title}"?`)) return;
    try {
      await apiClient.remove("assignments", a.id);
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not delete"); return; }
      mockDb.remove("assignments", a.id);
    }
    toast.success("Assignment deleted");
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search assignments…" className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New assignment</Button>
      </div>
      <TableShell
        head={["Title", "Class", "Reading", "Due", "Submissions", "Status", ""]}
        rows={rows.map((a) => [
          <span className="font-medium">{a.title}</span>,
          a.class,
          a.bookTitle
            ? <a href={a.bookUrl || "#"} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline text-xs">
                {a.bookTitle}{a.chapter ? ` · ${a.chapter}` : ""}
              </a>
            : <span className="text-xs text-muted-foreground">—</span>,
          a.due,
          a.submissions,
          statusBadge(a.status),
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(a)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
            <Button size="sm" variant="ghost" onClick={()=>remove(a)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>,
        ])}
      />
      {(editing || creating) && (
        <AssignmentEditor
          row={editing}
          classes={classes}
          onClose={()=>{ setEditing(null); setCreating(false); load(); }}
        />
      )}
    </>
  );
}

function AssignmentEditor({ row, classes, onClose }: { row: AssignmentRow | null; classes: ClassRow[]; onClose: () => void }) {
  const [form, setForm] = useState<Partial<AssignmentRow>>(row ?? { title: "", class: classes[0]?.name ?? "", due: "", submissions: 0, status: "Open" });
  const [saving, setSaving] = useState(false);
  const books = ck12Store.list();
  const selectedBook = books.find((b) => b.id === form.bookId);
  const save = async () => {
    if (!form.title || !form.class || !form.due) { toast.error("Title, class and due date are required"); return; }
    setSaving(true);
    const data = { ...(form as AssignmentRow), submissions: Number(form.submissions) || 0 };
    try {
      if (row) await apiClient.update("assignments", row.id, data);
      else await apiClient.create("assignments", data);
      toast.success(row ? "Assignment updated" : "Assignment created");
    } catch (e) {
      if (!isNetworkError(e)) { toast.error((e as Error)?.message ?? "Could not save"); setSaving(false); return; }
      if (row) mockDb.update<AssignmentRow>("assignments", row.id, data);
      else mockDb.create<AssignmentRow>("assignments", data);
      toast.success(row ? "Assignment updated" : "Assignment created");
    }
    setSaving(false);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o)=>!o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row ? "Edit assignment" : "New assignment"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title ?? ""} onChange={(e)=>setForm({...form, title:e.target.value})}/></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Class</Label>
              <Select value={form.class ?? ""} onValueChange={(v)=>setForm({...form, class:v})}>
                <SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due date</Label><Input type="date" value={form.due ?? ""} onChange={(e)=>setForm({...form, due:e.target.value})}/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Submissions</Label><Input type="number" value={form.submissions ?? 0} onChange={(e)=>setForm({...form, submissions:Number(e.target.value)})}/></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status ?? "Open"} onValueChange={(v)=>setForm({...form, status:v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Grading">Grading</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 space-y-3">
            <p className="text-sm font-semibold">CK-12 reading (optional)</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Book</Label>
                <Select
                  value={form.bookId ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") { setForm({ ...form, bookId: undefined, bookTitle: undefined, bookUrl: undefined, chapter: undefined }); return; }
                    const b = books.find((x) => x.id === v);
                    setForm({ ...form, bookId: v, bookTitle: b?.title, bookUrl: b?.url, chapter: undefined });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Attach a book"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No book attached</SelectItem>
                    {books.map((b) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Chapter</Label>
                <Select
                  value={form.chapter ?? "all"}
                  onValueChange={(v) => setForm({ ...form, chapter: v === "all" ? undefined : v })}
                  disabled={!selectedBook}
                >
                  <SelectTrigger><SelectValue placeholder="Whole book"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Whole book</SelectItem>
                    {(selectedBook?.chapters ?? []).map((c) => <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin"/>}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Approvals — hierarchical workflow (Staff → Admin → Super Admin)
// =========================================================================
function approvalBadge(status: string) {
  const map: Record<string, string> = {
    "Approved": "bg-emerald-500/15 text-emerald-700",
    "Rejected": "bg-destructive/15 text-destructive",
    "Returned for Revision": "bg-amber-500/15 text-amber-700",
    "Pending Admin": "bg-primary/15 text-primary",
    "Pending Superadmin": "bg-violet-500/15 text-violet-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function ApprovalsModule() {
  const principal = usePrincipal();
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", category: APPROVAL_CATEGORIES[0], details: "", requiresSuperadmin: false });
  const [files, setFiles] = useState<ApprovalAttachment[]>([]);

  const reload = useCallback(() => {
    if (!principal) return;
    setRows(approvalsStore.visible(principal.id, principal.role));
  }, [principal?.id, principal?.role]);

  useEffect(() => { reload(); }, [reload]);

  if (!principal) return null;
  const reviewer = isAdminLevel(principal.role);

  const submit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    approvalsStore.submit({
      ...form,
      attachments: files,
      submittedBy: principal.name,
      submittedById: principal.id,
      submitterRole: principal.role ?? "staff",
    });
    const locks = CATEGORY_LOCKS[form.category] ?? [];
    toast.success(locks.length
      ? `Submitted for Admin review — ${locks.join(", ")} are now locked`
      : "Submitted for Admin review");
    setForm({ title: "", category: APPROVAL_CATEGORIES[0], details: "", requiresSuperadmin: false });
    setFiles([]);
    setCreating(false);
    reload();
  };

  const onPick = async (list: FileList | null) => {
    if (!list?.length) return;
    const picked: ApprovalAttachment[] = [];
    for (const f of Array.from(list)) {
      if (f.size > 4 * 1024 * 1024) { toast.error(`${f.name} is larger than 4MB`); continue; }
      const dataUrl: string = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = () => rej(fr.error);
        fr.readAsDataURL(f);
      });
      picked.push({ name: f.name, type: f.type || "file", size: f.size, dataUrl });
    }
    setFiles((prev) => [...prev, ...picked]);
  };

  const act = (action: "approve" | "reject" | "return" | "forward") => {
    if (!open) return;
    approvalsStore.act(open.id, action, { name: principal.name, role: principal.role ?? "staff", id: principal.id }, comment);
    toast.success("Decision recorded");
    setComment("");
    setOpen(null);
    reload();
  };

  const stats = {
    pending: rows.filter(r => r.status.startsWith("Pending")).length,
    approved: rows.filter(r => r.status === "Approved").length,
    returned: rows.filter(r => r.status === "Returned for Revision").length,
    rejected: rows.filter(r => r.status === "Rejected").length,
  };

  const canDecide = (r: ApprovalRequest) =>
    (principal.role === "admin" && r.status === "Pending Admin") ||
    (principal.role === "superadmin" && (r.status === "Pending Superadmin" || r.status === "Pending Admin"));

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Inbox} label="Pending" value={String(stats.pending)} />
        <StatCard icon={CheckCircle2} label="Approved" value={String(stats.approved)} />
        <StatCard icon={RotateCcw} label="Returned" value={String(stats.returned)} />
        <StatCard icon={Trash2} label="Rejected" value={String(stats.rejected)} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-sm text-muted-foreground">
          {reviewer
            ? "Review submissions from staff. Approved items requiring final sign-off route to the Super Admin."
            : "Track the records and reports you have submitted to the Admin office."}
        </p>
        <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4"/>New submission</Button>
      </div>

      <TableShell
        head={["Title", "Category", "Submitted by", "Status", "Updated", ""]}
        rows={rows.map((r) => [
          <span className="font-medium">{r.title}</span>,
          <Badge variant="secondary">{r.category}</Badge>,
          r.submittedBy,
          approvalBadge(r.status),
          new Date(r.updatedAt).toLocaleString(),
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setOpen(r)}>
              {canDecide(r) ? "Review" : "View"}
            </Button>
          </div>,
        ])}
      />

      {creating && (
        <Dialog open onOpenChange={(o) => !o && setCreating(false)}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New submission</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Period 2 grade sheet — Grade 6" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {APPROVAL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Details</Label>
                <Textarea rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="What are you submitting and why?" />
              </div>
              <div>
                <Label>Attachments</Label>
                <Input type="file" multiple className="cursor-pointer"
                  onChange={(e) => { onPick(e.target.files); e.currentTarget.value = ""; }} />
                <p className="text-xs text-muted-foreground mt-1">PDF, images, spreadsheets or documents — max 4MB each.</p>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {files.map((f, i) => (
                      <li key={f.name + i} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2">
                        <span className="text-sm truncate">{f.name}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                          <Button size="sm" variant="ghost" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={form.requiresSuperadmin}
                  onChange={(e) => setForm({ ...form, requiresSuperadmin: e.target.checked })} />
                Requires final Super Admin approval
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={submit}>Submit for review</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{open.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {approvalBadge(open.status)}
                <Badge variant="secondary">{open.category}</Badge>
                {open.requiresSuperadmin && <Badge variant="outline">Super Admin sign-off required</Badge>}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{open.details || "No details provided."}</p>

              {!!open.attachments?.length && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Attachments</p>
                  <ul className="space-y-2">
                    {open.attachments.map((f, i) => (
                      <li key={f.name + i} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2">
                        <span className="text-sm truncate">{f.name}</span>
                        <a href={f.dataUrl} download={f.name} className="text-sm font-semibold text-primary shrink-0">Download</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Audit trail</p>
                <ol className="space-y-3 border-l border-border pl-4">
                  {open.history.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{h.action} — {h.actor} <span className="text-muted-foreground font-normal">({String(h.actorRole)})</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString()}</p>
                      {h.comment && <p className="text-sm mt-1">{h.comment}</p>}
                    </li>
                  ))}
                </ol>
              </div>

              {canDecide(open) && (
                <div>
                  <Label>Reviewer comment</Label>
                  <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional note for the submitter…" />
                </div>
              )}
            </div>
            <DialogFooter className="flex-wrap gap-2">
              {canDecide(open) ? (
                <>
                  <Button variant="ghost" onClick={() => act("reject")}>Reject</Button>
                  <Button variant="outline" onClick={() => act("return")}>Return for revision</Button>
                  {principal.role === "admin" && (
                    <Button variant="outline" onClick={() => act("forward")}>Forward to Super Admin</Button>
                  )}
                  <Button onClick={() => act("approve")}>Approve</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
