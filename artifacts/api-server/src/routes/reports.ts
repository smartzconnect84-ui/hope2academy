import { Router } from "express";
import { dbStore, type AppRole } from "../lib/db-store.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

type ReportStatus = "Submitted" | "Under Review" | "Approved" | "Returned for Revision" | "Rejected";
type ReportAction = "approve" | "reject" | "return";
type Report = {
  id: string;
  title: string;
  category: string;
  details: string;
  submittedBy: string;
  submittedById: string;
  submitterRole: AppRole;
  recipientRoles: string;
  attachments?: Array<{ name: string; type: string; size: number; url: string; objectPath?: string }>;
  status: ReportStatus;
  reviewedBy?: string;
  reviewerComment?: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{ at: string; actor: string; actorRole: AppRole; action: string; comment?: string }>;
};

function recipientsFor(role: AppRole): string | null {
  if (role === "superadmin") return null;
  if (role === "admin") return "superadmin";
  if (role === "student") return "teacher,admin_assistant";
  return "admin";
}

function isVisibleTo(report: Report, id: string, role: AppRole): boolean {
  if (role === "superadmin") return report.recipientRoles.split(",").includes("superadmin");
  if (role === "admin") {
    return report.recipientRoles.split(",").includes("admin") || report.submittedById === id;
  }
  if (role === "teacher" || role === "admin_assistant") {
    return report.recipientRoles.split(",").includes(role) || report.submittedById === id;
  }
  return report.submittedById === id;
}

async function principal(req: any, res: any) {
  const user = await dbStore.findUserById(req.jwtPayload.sub);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  return user;
}

function recordAudit(actor: string, action: string) {
  return dbStore.create("audit", {
    id: `audit_${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    actor,
    action,
  });
}

function notify(role: string, title: string, body: string, audienceUserId?: string) {
  return Promise.all(role.split(",").map((audienceRole) =>
    dbStore.create("notifications", {
      id: `notif_${Math.random().toString(36).slice(2, 9)}`,
      audienceRole: audienceRole.trim(),
      audienceUserId,
      title,
      body,
      at: new Date().toISOString(),
      read: false,
    })
  ));
}

router.get("/reports", requireAuth, async (req, res) => {
  const user = await principal(req, res);
  if (!user) return;
  const reports = await dbStore.list<Report>("reports");
  res.json(reports.filter((report) => isVisibleTo(report, user.id, user.role)));
});

router.post("/reports", requireAuth, async (req, res) => {
  const user = await principal(req, res);
  if (!user) return;
  const recipientRoles = recipientsFor(user.role);
  if (!recipientRoles) {
    res.status(403).json({ error: "Superadmin accounts can review reports but cannot submit them." });
    return;
  }

  const { title, category, details } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()
    || typeof category !== "string" || !category.trim()
    || typeof details !== "string" || !details.trim()) {
    res.status(400).json({ error: "Title, category, and details are required" });
    return;
  }

  const attachments = Array.isArray(req.body.attachments)
    ? req.body.attachments
      .filter((file: any) => file && typeof file.name === "string" && typeof file.url === "string")
      .map((file: any) => ({
        name: file.name.slice(0, 255),
        type: String(file.type ?? "application/octet-stream").slice(0, 120),
        size: Math.max(0, Number(file.size) || 0),
        url: file.url,
        ...(typeof file.objectPath === "string" ? { objectPath: file.objectPath } : {}),
      }))
    : [];

  const now = new Date().toISOString();
  const report: Report = {
    id: `rpt_${Math.random().toString(36).slice(2, 10)}`,
    title: title.trim(),
    category: category.trim(),
    details: details.trim(),
    submittedBy: user.name,
    submittedById: user.id,
    submitterRole: user.role,
    recipientRoles,
    ...(attachments.length ? { attachments } : {}),
    status: "Submitted",
    createdAt: now,
    updatedAt: now,
    history: [{ at: now, actor: user.name, actorRole: user.role, action: "Submitted", comment: details.trim() }],
  };

  await dbStore.create("reports", report);
  await recordAudit(user.name, `Submitted report "${report.title}"`);
  await notify(recipientRoles, "New report submitted", `${user.name} submitted "${report.title}" for review.`);
  res.status(201).json(report);
});

router.patch("/reports/:id", requireAuth, async (req, res) => {
  const user = await principal(req, res);
  if (!user) return;
  const { action, comment = "" } = req.body ?? {};
  if (!["approve", "reject", "return"].includes(action)) {
    res.status(400).json({ error: "Action must be approve, reject, or return" });
    return;
  }

  const report = await dbStore.get<Report>("reports", String(req.params.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  if (report.status !== "Submitted" || !report.recipientRoles.split(",").includes(user.role)) {
    res.status(403).json({ error: "You cannot review this report" });
    return;
  }

  const statusByAction: Record<ReportAction, ReportStatus> = {
    approve: "Approved",
    reject: "Rejected",
    return: "Returned for Revision",
  };
  const status = statusByAction[action as ReportAction];
  const safeComment = typeof comment === "string" ? comment.trim().slice(0, 4000) : "";
  const updated = await dbStore.update<Report>("reports", report.id, {
    status,
    reviewedBy: user.name,
    reviewerComment: safeComment,
    updatedAt: new Date().toISOString(),
    history: [
      ...report.history,
      { at: new Date().toISOString(), actor: user.name, actorRole: user.role, action: status, ...(safeComment ? { comment: safeComment } : {}) },
    ],
  });
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  await recordAudit(user.name, `${status}: report "${report.title}"`);
  await notify(String(report.submitterRole), `Report ${status.toLowerCase()}`, `"${report.title}" was ${status.toLowerCase()} by ${user.name}.${safeComment ? ` Comment: ${safeComment}` : ""}`, report.submittedById);
  res.json(updated);
});

export default router;