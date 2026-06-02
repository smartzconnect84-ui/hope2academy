import { useParams, Link } from "react-router-dom";
import { useState, type ReactNode, type ReactElement } from "react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup, motion } from "@/components/Motion";
import { mockDb } from "@/lib/mock-backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Calendar, ClipboardList, Award, Users, BookOpen, Heart,
  DollarSign, Briefcase, Library, FileText, Image as ImageIcon, Newspaper,
  MessageSquare, Megaphone, BarChart3, FolderTree, Settings, Search,
  Plus, Inbox, CheckCircle2, Upload, Download, ArrowUpRight, Sparkles,
  Trash2, Edit3, Copy, ChevronUp, ChevronDown as ChevronDownIcon, ListTree, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";
import { cmsStore, useCmsVersion, readFileAsDataUrl, type CmsPage, type CmsMedia, type NavItem } from "@/lib/cms-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ModuleDef = {
  title: string;
  subtitle: string;
  icon: any;
  allow?: AppRole[];
  render: () => ReactElement;
};

function Toolbar({ children, action }: { children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9 bg-card" />
      </div>
      {children}
      {action}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] ${className}`}>{children}</div>;
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

const MODULES: Record<string, ModuleDef> = {
  classes: {
    title: "Classes", subtitle: "All active classes across campuses", icon: GraduationCap,
    render: () => <ClassesModule/>,
  },
  assignments: {
    title: "Assignments", subtitle: "Track open and graded work", icon: ClipboardList,
    render: () => <AssignmentsModule/>,
  },
  grades: {
    title: "Grades", subtitle: "Scores by student and subject", icon: Award,
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
            { name: "term", label: "Term", type: "select", options: ["Term 1","Term 2","Term 3"], required: true },
          ]}
          columns={[
            { key: "student", label: "Student" },
            { key: "subject", label: "Subject" },
            { key: "score", label: "Score", render: (v) => `${v}%` },
            { key: "grade", label: "Grade", render: (v) => <span className="font-display font-bold text-primary">{v}</span> },
            { key: "term", label: "Term" },
          ]}
        />
      </>
    ),
  },
  attendance: {
    title: "Attendance", subtitle: "Daily roll-call across classes", icon: Calendar,
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
    render: () => {
      const data = mockDb.list<any>("timetable");
      return (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((d: any, i) => (
            <Reveal key={d.day} delay={i*0.05}>
              <Card className="p-5">
                <h3 className="font-display text-lg font-semibold">{d.day}</h3>
                <ul className="mt-3 space-y-2">
                  {d.slots.map((s: any) => (
                    <li key={s.t+s.s} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
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
    },
  },
  announcements: {
    title: "Announcements", subtitle: "School-wide notices", icon: Megaphone,
    render: () => (
      <SimpleCrud
        collection="announcements"
        itemLabel="announcement"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "audience", label: "Audience", type: "select", options: ["All","Students","Parents","Staff","Alumni"], required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "body", label: "Body", type: "textarea", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "audience", label: "Audience", render: (v) => <Badge variant="secondary">{v}</Badge> },
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
    title: "Fees & Donations", subtitle: "Track tuition and contributions", icon: DollarSign,
    render: () => (
      <>
        <FeesStats/>
        <SimpleCrud
          collection="fees"
          itemLabel="fee"
          fields={[
            { name: "student", label: "Student", type: "text", required: true },
            { name: "item", label: "Item", type: "text", required: true, placeholder: "Term tuition, Lab fee…" },
            { name: "amount", label: "Amount (USD)", type: "number", required: true },
            { name: "due", label: "Due date", type: "date", required: true },
            { name: "status", label: "Status", type: "select", options: ["Outstanding","Paid"], required: true },
          ]}
          columns={[
            { key: "student", label: "Student" },
            { key: "item", label: "Item" },
            { key: "amount", label: "Amount", render: (v) => `$${v}` },
            { key: "due", label: "Due" },
            { key: "status", label: "Status", render: (v) => statusBadge(v) },
          ]}
        />
      </>
    ),
  },
  children: {
    title: "My Children", subtitle: "Linked student records", icon: Heart,
    render: () => {
      const data = mockDb.list<any>("children");
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((c: any, i) => (
            <Reveal key={c.id} delay={i*0.05}>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center font-bold text-xl">{c.name[0]}</div>
                  <div>
                    <p className="font-display text-lg font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.grade}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Attendance</p><p className="font-display font-bold text-primary text-lg">{c.attendance}</p></div>
                  <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">GPA</p><p className="font-display font-bold text-primary text-lg">{c.gpa}</p></div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      );
    },
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
    title: "Job Board", subtitle: "Opportunities shared with our network", icon: Briefcase,
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
    title: "Alumni Directory", subtitle: "Reconnect with classmates", icon: Users,
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
    title: "Mentorship", subtitle: "Guide a current student", icon: Heart,
    render: () => (
      <Card className="p-8 text-center">
        <Heart className="h-10 w-10 text-primary mx-auto"/>
        <h3 className="mt-3 font-display text-2xl font-semibold">Become a mentor</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">Pair with a student in their final two years and meet monthly. We provide structure, you provide perspective.</p>
        <Button className="mt-5" onClick={()=>toast.success("Application submitted — our team will reach out")}>Sign me up</Button>
      </Card>
    ),
  },
  donations: {
    title: "Donations", subtitle: "Recent contributions to the school", icon: DollarSign,
    render: () => (
      <>
        <DonationsStats/>
        <SimpleCrud
          collection="donations"
          itemLabel="donation"
          createLabel="Record donation"
          fields={[
            { name: "donor", label: "Donor", type: "text", required: true },
            { name: "fund", label: "Fund", type: "select", options: ["Scholarship","Capital","Library","General"], required: true },
            { name: "amount", label: "Amount (USD)", type: "number", required: true },
            { name: "date", label: "Date", type: "date", required: true },
          ]}
          columns={[
            { key: "donor", label: "Donor" },
            { key: "fund", label: "Fund" },
            { key: "amount", label: "Amount", render: (v) => `$${v}` },
            { key: "date", label: "Date" },
          ]}
        />
      </>
    ),
  },
  library: {
    title: "Library", subtitle: "Catalog and availability", icon: Library,
    render: () => (
      <SimpleCrud
        collection="library"
        itemLabel="book"
        createLabel="Add title"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "author", label: "Author", type: "text", required: true },
          { name: "available", label: "Copies available", type: "number", required: true },
        ]}
        columns={[
          { key: "title", label: "Title", render: (v) => <span className="font-medium">{v}</span> },
          { key: "author", label: "Author" },
          { key: "available", label: "Available" },
        ]}
      />
    ),
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
    title: "Pages (CMS)", subtitle: "Manage public website pages", icon: FileText,
    allow: ["superadmin", "admin"],
    render: () => <PagesModule/>,
  },
  posts: {
    title: "Posts & Stories", subtitle: "Editorial content for the website", icon: Newspaper,
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
    title: "Navigation",
    subtitle: "Manage the public website menu",
    icon: ListTree,
    allow: ["superadmin"],
    render: () => <NavigationModule/>,
  },
  settings: {
    title: "Site Settings", subtitle: "Branding, contact and configuration", icon: Settings,
    allow: ["superadmin"],
    render: () => {
      const data = mockDb.list<any>("settings");
      const [edits, setEdits] = useState<Record<string, string>>({});
      return (
        <Card className="p-6 max-w-2xl">
          <div className="space-y-4">
            {data.map((s: any) => (
              <div key={s.id}>
                <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{s.key}</label>
                <Input className="mt-1.5" defaultValue={s.value} onChange={(e)=>setEdits({...edits, [s.id]: e.target.value})}/>
              </div>
            ))}
            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Welcome message</label>
              <Textarea className="mt-1.5" rows={3} defaultValue="A movement of compassion across Liberia."/>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={()=>toast.success("Settings saved")}>Save settings</Button>
          </div>
        </Card>
      );
    },
  },
  departments: {
    title: "Departments", subtitle: "Organisational structure", icon: FolderTree,
    render: () => {
      const data = mockDb.list<any>("departments");
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((d: any, i) => (
            <Reveal key={d.id} delay={i*0.05}>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <FolderTree className="h-5 w-5 text-primary"/>
                  <h3 className="font-display text-lg font-semibold">{d.name}</h3>
                </div>
                <p className="mt-3 text-sm">Lead: <span className="font-semibold">{d.lead}</span></p>
                <p className="text-sm text-muted-foreground">{d.staff} staff members</p>
              </Card>
            </Reveal>
          ))}
        </div>
      );
    },
  },
  audit: {
    title: "Audit Logs", subtitle: "Recent administrator activity", icon: ClipboardList,
    allow: ["superadmin"],
    render: () => {
      const data = mockDb.list<any>("audit");
      return (
        <TableShell
          head={["When", "Actor", "Action"]}
          rows={data.map(a => [a.at, a.actor, a.action])}
        />
      );
    },
  },
  analytics: {
    title: "Analytics", subtitle: "Real-time platform health", icon: BarChart3,
    render: () => (
      <>
        <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard icon={Users} label="Active users (7d)" value={184} delta="+12%"/>
          <StatCard icon={BookOpen} label="Classes" value={42} accent="accent"/>
          <StatCard icon={ClipboardList} label="Assignments" value={89} accent="secondary"/>
          <StatCard icon={Heart} label="Donations (mo)" value="$3,240"/>
        </StaggerGroup>
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Engagement by role</h3>
          <div className="space-y-3">
            {[
              { r: "Students", v: 92 }, { r: "Teachers", v: 78 }, { r: "Parents", v: 64 },
              { r: "Alumni", v: 41 }, { r: "Admin", v: 96 },
            ].map(b => (
              <div key={b.r}>
                <div className="flex justify-between text-sm"><span>{b.r}</span><span className="font-semibold">{b.v}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${b.v}%` }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }} className="h-full bg-gradient-to-r from-primary to-accent"/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </>
    ),
  },
};

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

function ModuleRoute() {
  const { key } = useParams<{ key: string }>();
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
// Academics — Classes (full CRUD)
// =========================================================================
type ClassRow = { id: string; name: string; teacher: string; room: string; students: number; schedule: string };

function useTick() {
  const [, set] = useState(0);
  return () => set((n) => n + 1);
}

function ClassesModule() {
  const tick = useTick();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [creating, setCreating] = useState(false);
  const all = mockDb.list<ClassRow>("classes");
  const rows = all.filter((c) => !q || `${c.name} ${c.teacher} ${c.room}`.toLowerCase().includes(q.toLowerCase()));
  const remove = (c: ClassRow) => {
    if (!confirm(`Delete class "${c.name}"?`)) return;
    mockDb.remove("classes", c.id); toast.success("Class deleted"); tick();
  };
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search classes…" className="pl-9 bg-card" />
        </div>
        <Button className="gap-2" onClick={()=>setCreating(true)}><Plus className="h-4 w-4"/> New class</Button>
      </div>
      <TableShell
        head={["Class", "Teacher", "Room", "Students", "Schedule", ""]}
        rows={rows.map((c) => [
          <span className="font-medium">{c.name}</span>,
          c.teacher,
          c.room,
          c.students,
          c.schedule,
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setEditing(c)}><Edit3 className="h-3.5 w-3.5"/>Edit</Button>
            <Button size="sm" variant="ghost" onClick={()=>remove(c)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>,
        ])}
      />
      {(editing || creating) && (
        <ClassEditor
          row={editing}
          onClose={()=>{ setEditing(null); setCreating(false); tick(); }}
        />
      )}
    </>
  );
}

function ClassEditor({ row, onClose }: { row: ClassRow | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<ClassRow>>(row ?? { name: "", teacher: "", room: "", students: 0, schedule: "" });
  const save = () => {
    if (!form.name || !form.teacher) { toast.error("Name and teacher are required"); return; }
    if (row) { mockDb.update<ClassRow>("classes", row.id, form); toast.success("Class updated"); }
    else { mockDb.create<ClassRow>("classes", { ...(form as ClassRow), students: Number(form.students) || 0 }); toast.success("Class created"); }
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// Academics — Assignments (full CRUD)
// =========================================================================
type AssignmentRow = { id: string; title: string; class: string; due: string; submissions: number; status: string };

function AssignmentsModule() {
  const tick = useTick();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AssignmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const all = mockDb.list<AssignmentRow>("assignments");
  const classes = mockDb.list<ClassRow>("classes");
  const rows = all.filter((a) => !q || `${a.title} ${a.class}`.toLowerCase().includes(q.toLowerCase()));
  const remove = (a: AssignmentRow) => {
    if (!confirm(`Delete assignment "${a.title}"?`)) return;
    mockDb.remove("assignments", a.id); toast.success("Assignment deleted"); tick();
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
        head={["Title", "Class", "Due", "Submissions", "Status", ""]}
        rows={rows.map((a) => [
          <span className="font-medium">{a.title}</span>,
          a.class,
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
          onClose={()=>{ setEditing(null); setCreating(false); tick(); }}
        />
      )}
    </>
  );
}

function AssignmentEditor({ row, classes, onClose }: { row: AssignmentRow | null; classes: ClassRow[]; onClose: () => void }) {
  const [form, setForm] = useState<Partial<AssignmentRow>>(row ?? { title: "", class: classes[0]?.name ?? "", due: "", submissions: 0, status: "Open" });
  const save = () => {
    if (!form.title || !form.class || !form.due) { toast.error("Title, class and due date are required"); return; }
    if (row) { mockDb.update<AssignmentRow>("assignments", row.id, form); toast.success("Assignment updated"); }
    else { mockDb.create<AssignmentRow>("assignments", { ...(form as AssignmentRow), submissions: Number(form.submissions) || 0 }); toast.success("Assignment created"); }
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
