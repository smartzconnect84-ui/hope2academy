import { Router } from "express";
import { dbStore } from "../lib/db-store.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

export type ModuleConfig = {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  updatedAt?: string;
};

const MODULE_MANIFEST = [
  ["classes", "Classes & Enrolment"], ["assignments", "Assignments"], ["submissions", "Submissions Register"],
  ["assessments", "Assessments"], ["gradesheet", "Academic Transcripts"], ["reportcard", "Progress Reports"],
  ["grades", "Grade Book"], ["attendance", "Attendance Register"], ["timetable", "Timetable"],
  ["announcements", "Announcements"], ["messages", "Messages"], ["fees", "Tuition & Fees"],
  ["children", "My Children"], ["events", "Events & Reunions"], ["jobs", "Career Board"],
  ["directory", "School Directory"], ["mentorship", "Mentorship Programme"], ["donations", "Donations"],
  ["library", "Digital Library"], ["resources", "Teaching Resources"], ["pages", "Custom Pages"],
  ["posts", "News & Stories"], ["media", "Media Library"], ["navigation", "Site Navigation"],
  ["settings", "System Settings"], ["departments", "Departments"], ["audit", "System Audit Log"],
  ["analytics", "School Analytics"], ["moduleaccess", "Module Access Control"], ["hero", "Hero Banner"],
  ["team", "Team Page"], ["homepage", "Homepage Content"], ["projectspage", "Projects Content"],
  ["storiespage", "Stories Content"], ["divisionspage", "Departments Content"], ["admissions", "Admissions Register"],
  ["inquiries", "Enquiries"], ["volunteers", "Volunteer Sign-ups"], ["subscribers", "Subscribers"],
  ["pledges", "Pledges"], ["exams", "Examinations"], ["behavior", "Conduct Records"],
  ["lessonplans", "Lesson Plans"], ["transport", "Transport"], ["clinic", "Health Services"],
  ["immunizations", "Immunisation Records"], ["medications", "Medication Administration"],
  ["healthalerts", "Health Alerts"], ["medicalscreenings", "Health Screenings"], ["calendar", "Academic Calendar"],
  ["inventory", "Asset Management"], ["staff", "Human Resources"], ["payroll", "Payroll & Salaries"],
  ["expenses", "Expenses & Payables"], ["finance", "Finance Overview"], ["campaigns", "Email Campaigns"],
  ["forms", "Online Forms"], ["broadcast", "Internal Broadcast"], ["scholarships", "Scholarships & Financial Aid"],
  ["approvals", "Approvals Centre"], ["reports", "Reports Inbox"], ["receipts", "Payment Receipts"],
  ["visitorlog", "Visitor Log"], ["academicyear", "Academic Year Setup"], ["counselling", "Counselling Records"],
  ["bookstock", "Library Catalogue"], ["ptmeetings", "PTM Scheduler"], ["leaverequests", "Staff Leave Management"],
].map(([key, title]) => ({
  key,
  title,
  subtitle: `Manage ${title.toLowerCase()} in the portal`,
}));

async function ensureModules(): Promise<ModuleConfig[]> {
  const current = await dbStore.list<ModuleConfig>("modules");
  const existing = new Set(current.map((module) => module.key));
  for (const item of MODULE_MANIFEST) {
    if (!existing.has(item.key)) {
      await dbStore.create("modules", {
        id: `module_${item.key}`,
        ...item,
        enabled: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return dbStore.list<ModuleConfig>("modules");
}

const router = Router();

/** GET /api/modules — the single backend registry used by portal settings and navigation. */
router.get("/modules", requireAuth, async (_req, res) => {
  res.json(await ensureModules());
});

/** PATCH /api/modules/:id — Superadmin-only rename/description/enable flow. */
router.patch("/modules/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  const id = String(req.params.id);
  const patch: Partial<ModuleConfig> = {};
  if (typeof req.body?.title === "string" && req.body.title.trim()) patch.title = req.body.title.trim();
  if (typeof req.body?.subtitle === "string") patch.subtitle = req.body.subtitle.trim();
  if (typeof req.body?.enabled === "boolean") patch.enabled = req.body.enabled;
  if (!Object.keys(patch).length) {
    res.status(400).json({ error: "Provide title, subtitle or enabled" });
    return;
  }
  const updated = await dbStore.update<ModuleConfig>("modules", id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  } as Partial<ModuleConfig> as any);
  if (!updated) {
    res.status(404).json({ error: "Module not found" });
    return;
  }
  res.json(updated);
});

export default router;