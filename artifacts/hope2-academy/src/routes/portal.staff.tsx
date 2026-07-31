import { Link } from "react-router-dom";
import {
  ClipboardList, Users, Calendar, Award, MessageSquare, GraduationCap,
  Megaphone, FolderTree, Inbox, FileText,
} from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth, ROLE_LABEL, type AppRole } from "@/hooks/use-auth";
import { mockDb } from "@/lib/mock-backend";

type StaffRole = "admin_assistant" | "registrar" | "admissions_officer";

const CONFIG: Record<StaffRole, {
  subtitle: string;
  duties: string[];
  quick: { to: string; label: string; icon: any }[];
}> = {
  admin_assistant: {
    subtitle: "Front office, correspondence, scheduling and records support",
    duties: [
      "Manage the school calendar and daily schedules",
      "Handle incoming messages and publish announcements",
      "Maintain the staff directory and attendance paperwork",
      "Track assets, transport and clinic logs",
    ],
    quick: [
      { to: "/portal/m/calendar", label: "School Calendar", icon: Calendar },
      { to: "/portal/m/messages", label: "Messages", icon: MessageSquare },
      { to: "/portal/m/announcements", label: "Announcements", icon: Megaphone },
      { to: "/portal/m/inventory", label: "Assets & Inventory", icon: FolderTree },
    ],
  },
  registrar: {
    subtitle: "Custodian of enrolment, grade books, transcripts and academic records",
    duties: [
      "Maintain class rosters and enrolment records",
      "Verify grades, exam results and issue transcripts",
      "Audit attendance and behavior records",
      "Confirm admissions records and scholarship placements",
    ],
    quick: [
      { to: "/portal/m/classes", label: "Classes & Enrolment", icon: GraduationCap },
      { to: "/portal/m/grades", label: "Grades & Transcripts", icon: Award },
      { to: "/portal/m/exams", label: "Exams & Reports", icon: FileText },
      { to: "/portal/m/attendance", label: "Attendance", icon: ClipboardList },
    ],
  },
  admissions_officer: {
    subtitle: "Applications, family engagement, interviews and enrolment offers",
    duties: [
      "Review and progress the application pipeline",
      "Respond to prospective families and schedule visits",
      "Match applicants with scholarships and financial aid",
      "Plan open days and admissions events",
    ],
    quick: [
      { to: "/portal/m/admissions", label: "Applications", icon: Inbox },
      { to: "/portal/m/scholarships", label: "Scholarships & Aid", icon: Award },
      { to: "/portal/m/messages", label: "Messages", icon: MessageSquare },
      { to: "/portal/m/events", label: "Open Days & Events", icon: Calendar },
    ],
  },
};

function StaffDashboard({ role }: { role: StaffRole }) {
  const { profile } = useAuth();
  const cfg = CONFIG[role];
  const admissions = mockDb.list<any>("admissions");
  const classes = mockDb.list<any>("classes");
  const announcements = mockDb.list<any>("announcements");
  const messages = mockDb.list<any>("messages");

  const stats = role === "registrar"
    ? [
        { icon: GraduationCap, label: "Active Classes", value: classes.length },
        { icon: ClipboardList, label: "Records on File", value: mockDb.list<any>("grades").length },
        { icon: Inbox, label: "Admissions", value: admissions.length },
        { icon: Award, label: "Scholarships", value: mockDb.list<any>("scholarships").length },
      ]
    : role === "admissions_officer"
    ? [
        { icon: Inbox, label: "Applications", value: admissions.length },
        { icon: ClipboardList, label: "Pending Review", value: admissions.filter((a) => (a.status ?? "").toLowerCase() === "pending").length },
        { icon: Award, label: "Scholarships", value: mockDb.list<any>("scholarships").length },
        { icon: Calendar, label: "Upcoming Events", value: mockDb.list<any>("events").length },
      ]
    : [
        { icon: MessageSquare, label: "Messages", value: messages.length },
        { icon: Megaphone, label: "Announcements", value: announcements.length },
        { icon: Calendar, label: "Calendar Entries", value: mockDb.list<any>("calendar").length },
        { icon: Users, label: "Staff Records", value: mockDb.list<any>("staff").length },
      ];

  return (
    <PortalShell title={`${ROLE_LABEL[role as AppRole]} Dashboard`} subtitle={cfg.subtitle}>
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={i % 3 === 1 ? "secondary" : i % 3 === 2 ? "accent" : "primary"} />
        ))}
      </StaggerGroup>

      <Reveal className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Quick actions</h3>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {cfg.quick.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:border-primary hover:text-primary transition"
              >
                <q.icon className="h-5 w-5" />
                <span className="font-medium text-sm">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Your responsibilities</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {cfg.duties.map((d) => (
              <li key={d} className="flex gap-2"><span className="text-primary">·</span>{d}</li>
            ))}
          </ul>
          {profile?.department && (
            <p className="mt-5 text-xs text-muted-foreground">
              Department: <span className="font-semibold text-foreground">{profile.department}</span>
            </p>
          )}
        </div>
      </Reveal>
    </PortalShell>
  );
}

export function AdminAssistantRoute() {
  return (
    <RequireAuth allow={["admin_assistant", "admin", "superadmin"]}>
      <StaffDashboard role="admin_assistant" />
    </RequireAuth>
  );
}

export function RegistrarRoute() {
  return (
    <RequireAuth allow={["registrar", "admin", "superadmin"]}>
      <StaffDashboard role="registrar" />
    </RequireAuth>
  );
}

export function AdmissionsOfficerRoute() {
  return (
    <RequireAuth allow={["admissions_officer", "admin", "superadmin"]}>
      <StaffDashboard role="admissions_officer" />
    </RequireAuth>
  );
}

export default StaffDashboard;
