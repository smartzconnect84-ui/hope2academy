/**
 * Role-based report submission & review workflow.
 *
 * Hierarchy:
 *   admin_assistant | registrar | admissions_officer | teacher | nurse
 *     → submit reports → Admin for review/approval
 *   admin
 *     → submit reports → Superadmin for final approval
 *   student
 *     → submit reports → Teacher AND Admin Assistant for review
 */
import { mockDb, type AppRole } from "@/lib/mock-backend";

export type ReportStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Returned for Revision"
  | "Rejected";

export interface ReportEvent {
  at: string;
  actor: string;
  actorRole: AppRole | string;
  action: string;
  comment?: string;
}

export interface ReportAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface Report {
  id: string;
  title: string;
  category: string;
  details: string;
  submittedBy: string;
  submittedById: string;
  submitterRole: AppRole | string;
  /** Comma-separated roles that should review this report, e.g. "admin" or "teacher,admin_assistant" */
  recipientRoles: string;
  attachments?: ReportAttachment[];
  status: ReportStatus;
  reviewedBy?: string;
  reviewerComment?: string;
  createdAt: string;
  updatedAt: string;
  history: ReportEvent[];
}

export const REPORT_CATEGORIES_STAFF = [
  "Academic Progress Report",
  "Weekly Activity Report",
  "Monthly Summary Report",
  "Term End Report",
  "Incident Report",
  "Behavioral Report",
  "Health & Welfare Report",
  "Administrative Report",
  "Financial Report",
  "Operational Update",
];

export const REPORT_CATEGORIES_STUDENT = [
  "Academic Progress Update",
  "Assignment Query",
  "Exam Concern",
  "Attendance Issue",
  "General Inquiry",
  "Behavioral Concern",
];

const COL = "reports";
const NOTIF = "notifications";
const AUDIT = "audit";

/** Which roles can submit to whom */
export function recipientRolesForSubmitter(role: AppRole | string | null): string {
  if (role === "admin") return "superadmin";
  if (role === "student") return "teacher,admin_assistant";
  // admin_assistant | registrar | admissions_officer | teacher | nurse
  return "admin";
}

function now() { return new Date().toISOString(); }

function notify(audienceRole: string, title: string, body: string, audienceUserId?: string) {
  // Broadcast to each comma-separated role
  for (const r of audienceRole.split(",")) {
    mockDb.create<any>(NOTIF, { audienceRole: r.trim(), audienceUserId, title, body, at: now(), read: false });
  }
}

function audit(actor: string, action: string) {
  mockDb.create<any>(AUDIT, { at: now().slice(0, 16).replace("T", " "), actor, action });
}

export const reportsStore = {
  all(): Report[] {
    return mockDb.list<Report>(COL);
  },

  /** Returns reports visible to the given user */
  visible(userId: string, role: AppRole | null): Report[] {
    const rows = this.all();
    if (role === "superadmin") return rows;
    if (role === "admin") {
      // Admin sees: all reports submitted TO them (from staff) + their own (to superadmin)
      return rows.filter(
        (r) =>
          r.recipientRoles.includes("admin") ||
          r.submittedById === userId
      );
    }
    if (role === "teacher" || role === "admin_assistant") {
      // Teacher/assistant sees: reports submitted TO their role + their own submissions
      return rows.filter(
        (r) =>
          r.recipientRoles.includes(role) ||
          r.submittedById === userId
      );
    }
    // Everyone else: only their own submissions
    return rows.filter((r) => r.submittedById === userId);
  },

  /** Returns reports where the user is a designated reviewer */
  incomingFor(role: AppRole | null): Report[] {
    if (!role) return [];
    return this.all().filter(
      (r) =>
        r.recipientRoles.includes(role) &&
        r.status === "Submitted"
    );
  },

  submit(input: {
    title: string;
    category: string;
    details: string;
    submittedBy: string;
    submittedById: string;
    submitterRole: AppRole | string;
    attachments?: ReportAttachment[];
  }): Report {
    const recipientRoles = recipientRolesForSubmitter(input.submitterRole);
    const row: Report = {
      id: `rpt_${Math.random().toString(36).slice(2, 9)}`,
      ...input,
      recipientRoles,
      status: "Submitted",
      createdAt: now(),
      updatedAt: now(),
      history: [{
        at: now(),
        actor: input.submittedBy,
        actorRole: input.submitterRole,
        action: "Submitted",
        comment: input.details,
      }],
    };
    mockDb.create(COL, row);
    audit(input.submittedBy, `Submitted report "${row.title}"`);

    // Notify all designated reviewers
    const recipientLabel =
      recipientRoles === "superadmin"
        ? "Superadmin"
        : recipientRoles.includes(",")
        ? "Teacher and Administrative Assistant"
        : "Admin";
    notify(
      recipientRoles,
      "New report submitted",
      `${input.submittedBy} submitted "${row.title}" for review.`
    );
    return row;
  },

  review(
    id: string,
    action: "approve" | "reject" | "return",
    actor: { name: string; role: AppRole | string; id: string },
    comment = ""
  ): Report | null {
    const row = this.all().find((r) => r.id === id);
    if (!row) return null;

    const statusMap: Record<string, ReportStatus> = {
      approve: "Approved",
      reject: "Rejected",
      return: "Returned for Revision",
    };
    const labelMap: Record<string, string> = {
      approve: "Approved",
      reject: "Rejected",
      return: "Returned for Revision",
    };

    const newStatus = statusMap[action];
    const label = labelMap[action];
    const history: ReportEvent[] = [
      ...row.history,
      { at: now(), actor: actor.name, actorRole: actor.role, action: label, comment },
    ];

    const updated = mockDb.update<Report>(COL, id, {
      status: newStatus,
      reviewedBy: actor.name,
      reviewerComment: comment,
      history,
      updatedAt: now(),
    } as Partial<Report>);

    audit(actor.name, `${label}: report "${row.title}"`);
    notify(
      String(row.submitterRole),
      `Report ${newStatus.toLowerCase()}`,
      `"${row.title}" was ${newStatus.toLowerCase()} by ${actor.name}.${comment ? " Comment: " + comment : ""}`,
      row.submittedById
    );
    return updated;
  },
};
