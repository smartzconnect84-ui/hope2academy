import { useEffect, useState } from "react";
import { BookOpen, Users, Calendar, ClipboardCheck } from "lucide-react";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { mockDb, mockAuth } from "@/lib/mock-backend";

interface TimetableSlot { t: string; s: string; }
interface TimetableDay  { id?: string; day: string; teacher?: string; slots: TimetableSlot[]; }

interface TeacherStats {
  myStudents?: number;
  classesToday?: number;
  pendingGrades?: number;
  subjects?: string[];
  department?: string;
}

function TeacherPage() {
  const { profile } = useAuth();
  const [studentCount, setStudentCount] = useState<number>(0);
  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([]);
  const [pendingGrades, setPendingGrades] = useState<number>(0);
  const [openAssignments, setOpenAssignments] = useState<Array<{ id: string; title: string; due: string; status: string }>>([]);
  const [nextDay, setNextDay] = useState("Mon");

  const teacherName = profile?.name ?? (profile as any)?.full_name ?? "";

  useEffect(() => {
    if (!teacherName) return;

    (async () => {
      // ── Stats ──────────────────────────────────────────────────────────
      try {
        const stats = await apiClient.getStats() as TeacherStats;
        setStudentCount(stats.myStudents ?? 0);
        setPendingGrades(stats.pendingGrades ?? 0);
      } catch {
        // Fallback: count students in the system (institutional stat)
        mockAuth.listUsers().then((users) => {
          setStudentCount(users.filter((u) => u.role === "student").length);
        });
        // Pending grades: only this teacher's assignments
        const allAssignments = mockDb.list<{ status: string; teacher?: string }>("assignments");
        const myAssignments = allAssignments.filter(
          (a) => !a.teacher || a.teacher === teacherName,
        );
        setPendingGrades(myAssignments.filter((a) => a.status === "Grading").length);
      }

      // ── Timetable: today's schedule for THIS teacher ───────────────────
      try {
        const timetable = await apiClient.list<TimetableDay>("timetable");
        const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
        // API returns scoped data (only this teacher's records)
        const entry = timetable.find((d) => d.day === day);
        setTodaySlots(entry?.slots ?? defaultSlots);

        const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const today = new Date().getDay();
        for (let i = 1; i <= 7; i++) {
          const d = days[(today + i) % 7];
          if (timetable.some((e) => e.day === d && e.slots.length > 0)) {
            setNextDay(d.slice(0, 3)); break;
          }
        }
      } catch {
        // Fallback: filter timetable by this teacher's name
        const allTimetable = mockDb.list<TimetableDay>("timetable");
        const myTimetable = teacherName
          ? allTimetable.filter((t) => !t.teacher || t.teacher === teacherName)
          : allTimetable;
        const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const entry = myTimetable.find((d) => d.day === day);
        setTodaySlots(entry?.slots ?? defaultSlots);

        const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const today = new Date().getDay();
        for (let i = 1; i <= 7; i++) {
          const d = days[(today + i) % 7];
          if (myTimetable.some((e) => e.day === d && e.slots.length > 0)) {
            setNextDay(d.slice(0, 3)); break;
          }
        }
      }

      // ── Open assignments: only THIS teacher's ─────────────────────────
      try {
        const assignments = await apiClient.list<{ id: string; title: string; due: string; status: string }>("assignments");
        setOpenAssignments(assignments.filter((a) => a.status !== "Completed").slice(0, 4));
      } catch {
        const allAssignments = mockDb.list<{ id: string; title: string; due: string; status: string; teacher?: string }>("assignments");
        const mine = teacherName
          ? allAssignments.filter((a) => !a.teacher || a.teacher === teacherName)
          : allAssignments;
        setOpenAssignments(mine.filter((a) => a.status !== "Completed").slice(0, 4));
      }
    })();
  }, [teacherName]);

  const subjects = (profile as any)?.subjects ?? ["—"];
  const department = (profile as any)?.department;

  return (
    <PortalShell
      title="Teacher Dashboard"
      subtitle={department ? `${department} department` : "Plan lessons, track students, log attendance"}
    >
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}          label="My Students"    value={studentCount || "—"} />
        <StatCard icon={BookOpen}       label="Classes Today"  value={todaySlots.length}   accent="accent" />
        <StatCard icon={ClipboardCheck} label="Pending Grades" value={pendingGrades}        accent="secondary" />
        <StatCard icon={Calendar}       label="Next Class Day" value={nextDay} />
      </StaggerGroup>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Today's schedule</h3>
          {todaySlots.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No classes scheduled today.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {todaySlots.map((x) => (
                <li key={x.t} className="flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="font-display font-semibold text-primary tabular-nums">{x.t}</span>
                  <span className="text-sm">{x.s}</span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]" delay={0.1}>
          <h3 className="font-display text-xl font-semibold">My subjects</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {subjects.map((s: string) => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-xs font-semibold">{s}</span>
            ))}
          </div>

          <h3 className="font-display text-xl font-semibold mt-6">My open assignments</h3>
          {openAssignments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No open assignments right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {openAssignments.map((a) => (
                <li key={a.id} className="flex items-start justify-between text-sm gap-3">
                  <span className="truncate text-muted-foreground">{a.title}</span>
                  <span className="shrink-0 font-medium text-primary">{a.due}</span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </PortalShell>
  );
}

const defaultSlots: TimetableSlot[] = [
  { t: "08:00", s: "Grade 9 — Mathematics" },
  { t: "10:00", s: "Grade 7 — Civic Education" },
  { t: "12:30", s: "Grade 9 — Literature" },
  { t: "14:00", s: "Staff briefing" },
];

function RouteComponent() {
  return (
    <RequireAuth allow={["teacher", "superadmin"]}>
      <TeacherPage />
    </RequireAuth>
  );
}

export default RouteComponent;
