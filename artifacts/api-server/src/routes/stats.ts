/**
 * GET /api/stats — aggregated dashboard statistics for each role.
 * Requires a valid JWT; response is scoped to the caller's role.
 */
import { Router } from "express";
import { mockStore, type User } from "../lib/mock-store.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/stats", requireAuth, (req, res) => {
  const { sub, role } = req.jwtPayload!;
  const user = mockStore.findUserById(sub);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const users       = mockStore.list<User>("users");
  const students    = users.filter((u) => u.role === "student");
  const teachers    = users.filter((u) => u.role === "teacher");
  const alumni      = users.filter((u) => u.role === "alumni");

  const grades      = mockStore.list("grades");
  const attendance  = mockStore.list<any>("attendance");
  const assignments = mockStore.list<any>("assignments");
  const fees        = mockStore.list<any>("fees");
  const classes     = mockStore.list<any>("classes");
  const behavior    = mockStore.list<any>("behavior");
  const lessonplans = mockStore.list<any>("lessonplans");
  const exams       = mockStore.list<any>("exams");
  const admissions  = mockStore.list<any>("admissions");
  const jobs        = mockStore.list<any>("jobs");
  const events      = mockStore.list<any>("events");
  const donations   = mockStore.list<any>("donations");
  const scholarships= mockStore.list<any>("scholarships");

  switch (role) {
    case "superadmin":
    case "admin": {
      const totalFees = fees.reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0);
      const outstanding = fees.filter((f: any) => f.status === "Outstanding").reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0);
      res.json({
        totalUsers: users.length,
        students: students.length,
        teachers: teachers.length,
        alumni: alumni.length,
        classes: classes.length,
        pendingAdmissions: admissions.filter((a: any) => a.status === "Pending" || a.status === "Interview").length,
        totalFeesUsd: totalFees,
        outstandingFeesUsd: outstanding,
      });
      break;
    }

    case "teacher": {
      const dept = user.department ?? "";
      const teacherSubjects = user.subjects ?? [];
      const myGrades = grades.filter((g: any) => teacherSubjects.includes(g.subject));
      const myAttendance = attendance.filter((a: any) =>
        teacherSubjects.some((s) => a.class.includes(s)),
      );
      const todaySlots = (() => {
        const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const tt = mockStore.list<any>("timetable").find((d: any) => d.day === day);
        return tt?.slots?.length ?? 0;
      })();
      res.json({
        myStudents: students.length,
        classesToday: todaySlots,
        pendingGrades: assignments.filter((a: any) => a.status === "Grading").length,
        lessonPlans: lessonplans.length,
        behaviorLogs: behavior.length,
        subjects: teacherSubjects,
        department: dept,
      });
      break;
    }

    case "student": {
      const name = user.name;
      const myGrades = grades.filter((g: any) => g.student === name);
      const avgScore = myGrades.length
        ? Math.round(myGrades.reduce((s: number, g: any) => s + (g.score ?? 0), 0) / myGrades.length)
        : 0;
      const upcomingExams = exams.filter((e: any) => e.status === "Scheduled" && (e.class ?? "").includes(user.grade ?? "")).length;
      res.json({
        activeCourses: user.subjects?.length ?? 6,
        gpa: avgScore >= 90 ? "A" : avgScore >= 80 ? "B+" : avgScore >= 70 ? "B" : "C+",
        upcomingTests: upcomingExams,
        attendance: "96%",
        grades: myGrades,
        className: user.class_name ?? null,
      });
      break;
    }

    case "parent": {
      const children = (user.linked_children ?? []).map((cName: string) => {
        const childGrades = grades.filter((g: any) => g.student === cName);
        const childFees   = fees.filter((f: any) => f.student === cName);
        return { name: cName, grades: childGrades, fees: childFees };
      });
      res.json({
        children,
        upcomingEvents: events.length,
        outstandingFees: fees
          .filter((f: any) => (user.linked_children ?? []).includes(f.student) && f.status === "Outstanding")
          .reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0),
      });
      break;
    }

    case "alumni": {
      res.json({
        jobListings: jobs.length,
        upcomingEvents: events.length,
        donations: donations.filter((d: any) => d.donor === user.name).length,
        scholarships: scholarships.length,
        graduationYear: user.graduation_year,
      });
      break;
    }

    default:
      res.json({});
  }
});

export default router;
