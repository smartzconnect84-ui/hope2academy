import { createFileRoute, useParams, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";

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
    render: () => {
      const data = mockDb.list<any>("classes");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Plus className="h-4 w-4"/> New class</Button>}/>
          <TableShell
            head={["Class", "Teacher", "Room", "Students", "Schedule"]}
            rows={data.map(c => [c.name, c.teacher, c.room, c.students, c.schedule])}
          />
        </>
      );
    },
  },
  assignments: {
    title: "Assignments", subtitle: "Track open and graded work", icon: ClipboardList,
    render: () => {
      const data = mockDb.list<any>("assignments");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Plus className="h-4 w-4"/> New assignment</Button>}/>
          <TableShell
            head={["Title", "Class", "Due", "Submissions", "Status"]}
            rows={data.map(a => [a.title, a.class, a.due, `${a.submissions}`, statusBadge(a.status)])}
          />
        </>
      );
    },
  },
  grades: {
    title: "Grades", subtitle: "Scores by student and subject", icon: Award,
    render: () => {
      const data = mockDb.list<any>("grades");
      const avg = Math.round(data.reduce((s, g) => s + g.score, 0) / Math.max(1, data.length));
      return (
        <>
          <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
            <StatCard icon={Award} label="Entries" value={data.length}/>
            <StatCard icon={BarChart3} label="Class Average" value={`${avg}%`} accent="accent"/>
            <StatCard icon={CheckCircle2} label="Above 90%" value={data.filter(d=>d.score>=90).length} accent="secondary"/>
          </StaggerGroup>
          <TableShell
            head={["Student", "Subject", "Score", "Grade", "Term"]}
            rows={data.map(g => [g.student, g.subject, `${g.score}%`, <span className="font-display font-bold text-primary">{g.grade}</span>, g.term])}
          />
        </>
      );
    },
  },
  attendance: {
    title: "Attendance", subtitle: "Daily roll-call across classes", icon: Calendar,
    render: () => {
      const data = mockDb.list<any>("attendance");
      return (
        <>
          <Toolbar/>
          <TableShell
            head={["Date", "Class", "Present", "Absent", "Late"]}
            rows={data.map(a => [a.date, a.class, a.present, a.absent, a.late])}
          />
        </>
      );
    },
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
    render: () => {
      const data = mockDb.list<any>("announcements");
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map((a: any, i) => (
            <Reveal key={a.id} delay={i*0.04}>
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{a.audience}</Badge>
                  <span className="text-xs text-muted-foreground">{a.date}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      );
    },
  },
  messages: {
    title: "Messages", subtitle: "Direct messages and broadcasts", icon: MessageSquare,
    render: () => {
      const data = mockDb.list<any>("messages");
      const unread = data.filter(m=>m.unread).length;
      return (
        <>
          <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
            <StatCard icon={Inbox} label="Inbox" value={data.length}/>
            <StatCard icon={Sparkles} label="Unread" value={unread} accent="accent"/>
            <StatCard icon={CheckCircle2} label="Replied" value={data.length - unread} accent="secondary"/>
          </StaggerGroup>
          <Card className="divide-y divide-border">
            {data.map((m: any) => (
              <div key={m.id} className="p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {m.unread && <span className="h-2 w-2 rounded-full bg-primary"/>}
                    <p className="font-semibold">{m.from}</p>
                    <span className="text-xs text-muted-foreground">→ {m.to}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.date}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{m.subject}</p>
                <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
              </div>
            ))}
          </Card>
        </>
      );
    },
  },
  fees: {
    title: "Fees & Donations", subtitle: "Track tuition and contributions", icon: DollarSign,
    render: () => {
      const data = mockDb.list<any>("fees");
      const outstanding = data.filter(f=>f.status==="Outstanding").reduce((s,f)=>s+f.amount,0);
      const paid = data.filter(f=>f.status==="Paid").reduce((s,f)=>s+f.amount,0);
      return (
        <>
          <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
            <StatCard icon={DollarSign} label="Outstanding" value={`$${outstanding}`}/>
            <StatCard icon={CheckCircle2} label="Paid this term" value={`$${paid}`} accent="secondary"/>
            <StatCard icon={Heart} label="Donations YTD" value="$1,325" accent="accent"/>
          </StaggerGroup>
          <TableShell
            head={["Student", "Item", "Amount", "Due", "Status", ""]}
            rows={data.map(f => [f.student, f.item, `$${f.amount}`, f.due, statusBadge(f.status), <Button size="sm" variant="outline" onClick={()=>toast.success("Receipt downloaded")}><Download className="h-3 w-3 mr-1"/>Receipt</Button>])}
          />
        </>
      );
    },
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
    render: () => {
      const data = mockDb.list<any>("events");
      return (
        <div className="grid md:grid-cols-3 gap-4">
          {data.map((e: any, i) => (
            <Reveal key={e.id} delay={i*0.05}>
              <Card className="p-5">
                <Calendar className="h-6 w-6 text-primary"/>
                <h3 className="mt-3 font-display text-lg font-semibold">{e.title}</h3>
                <p className="text-sm text-muted-foreground">{e.location}</p>
                <p className="mt-3 text-sm font-semibold text-primary">{e.date}</p>
                <Button size="sm" className="mt-4 w-full">RSVP</Button>
              </Card>
            </Reveal>
          ))}
        </div>
      );
    },
  },
  jobs: {
    title: "Job Board", subtitle: "Opportunities shared with our network", icon: Briefcase,
    render: () => {
      const data = mockDb.list<any>("jobs");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Plus className="h-4 w-4"/> Post a job</Button>}/>
          <div className="grid md:grid-cols-2 gap-4">
            {data.map((j: any, i) => (
              <Reveal key={j.id} delay={i*0.04}>
                <Card className="p-5 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{j.title}</h3>
                      <p className="text-sm text-muted-foreground">{j.company} · {j.location}</p>
                    </div>
                    <Badge variant="secondary">{j.posted}</Badge>
                  </div>
                  <Button variant="outline" className="mt-4 self-start gap-2">Apply <ArrowUpRight className="h-3.5 w-3.5"/></Button>
                </Card>
              </Reveal>
            ))}
          </div>
        </>
      );
    },
  },
  directory: {
    title: "Alumni Directory", subtitle: "Reconnect with classmates", icon: Users,
    render: () => {
      const data = mockDb.list<any>("directory");
      return (
        <>
          <Toolbar/>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((p: any, i) => (
              <Reveal key={p.id} delay={i*0.04}>
                <Card className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-primary text-primary-foreground grid place-items-center font-bold">{p.name[0]}</div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Class of {p.year}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm">{p.role}</p>
                  <p className="text-xs text-muted-foreground">{p.city}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </>
      );
    },
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
    render: () => {
      const data = mockDb.list<any>("donations");
      const total = data.reduce((s,d)=>s+d.amount,0);
      return (
        <>
          <StaggerGroup className="grid sm:grid-cols-3 gap-4 mb-5">
            <StatCard icon={DollarSign} label="Total raised" value={`$${total.toLocaleString()}`}/>
            <StatCard icon={Users} label="Donors" value={data.length} accent="accent"/>
            <StatCard icon={Heart} label="Recurring" value={3} accent="secondary"/>
          </StaggerGroup>
          <TableShell
            head={["Donor", "Fund", "Amount", "Date"]}
            rows={data.map(d => [d.donor, d.fund, `$${d.amount}`, d.date])}
          />
        </>
      );
    },
  },
  library: {
    title: "Library", subtitle: "Catalog and availability", icon: Library,
    render: () => {
      const data = mockDb.list<any>("library");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Plus className="h-4 w-4"/> Add title</Button>}/>
          <TableShell
            head={["Title", "Author", "Copies available", ""]}
            rows={data.map(b => [b.title, b.author, b.available, <Button size="sm" variant="outline" onClick={()=>toast.success("Reserved")}>Reserve</Button>])}
          />
        </>
      );
    },
  },
  resources: {
    title: "Teaching Resources", subtitle: "Shared documents for staff", icon: Library,
    render: () => {
      const data = mockDb.list<any>("resources");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Upload className="h-4 w-4"/> Upload</Button>}/>
          <Card className="divide-y divide-border">
            {data.map((r: any) => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary"/>
                  <div><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.type} · {r.size}</p></div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2"><Download className="h-4 w-4"/>Download</Button>
              </div>
            ))}
          </Card>
        </>
      );
    },
  },
  // ----- CMS / Super-admin
  pages: {
    title: "Pages (CMS)", subtitle: "Manage public website pages", icon: FileText,
    render: () => {
      const data = mockDb.list<any>("pages");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Plus className="h-4 w-4"/> New page</Button>}/>
          <TableShell
            head={["Title", "Slug", "Status", "Updated", ""]}
            rows={data.map(p => [p.title, <code className="text-xs">{p.slug}</code>, statusBadge(p.status), p.updated, <Button size="sm" variant="outline">Edit</Button>])}
          />
        </>
      );
    },
  },
  posts: {
    title: "Posts & Stories", subtitle: "Editorial content for the website", icon: Newspaper,
    render: () => {
      const data = mockDb.list<any>("posts");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Plus className="h-4 w-4"/> Write a post</Button>}/>
          <TableShell
            head={["Title", "Author", "Status", "Date", ""]}
            rows={data.map(p => [p.title, p.author, statusBadge(p.status), p.date, <Button size="sm" variant="outline">Edit</Button>])}
          />
        </>
      );
    },
  },
  media: {
    title: "Media Library", subtitle: "Images, videos and documents", icon: ImageIcon,
    render: () => {
      const data = mockDb.list<any>("media");
      return (
        <>
          <Toolbar action={<Button className="gap-2"><Upload className="h-4 w-4"/> Upload media</Button>}/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((m: any, i) => (
              <Reveal key={m.id} delay={i*0.03}>
                <Card className="overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/30 grid place-items-center">
                    <ImageIcon className="h-8 w-8 text-primary/70"/>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.folder} · {m.size}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </>
      );
    },
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

export const Route = createFileRoute("/portal/m/$key")({
  component: ModuleRoute,
});

function ModuleRoute() {
  const { key } = useParams({ from: "/portal/m/$key" });
  const def = MODULES[key];

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