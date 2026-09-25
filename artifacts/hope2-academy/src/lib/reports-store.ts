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
 *
 *   superadmin — RECEIVE and APPROVE only; cannot submit reports.
 */
import { mockDb, type AppRole } from "@/lib/mock-backend";
import { apiClient, isNetworkError } from "@/lib/api-client";

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
  url: string;
  objectPath?: string;
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

function hasApiSession() {
  return Boolean(apiClient.getToken());
}

function localVisible(rows: Report[], userId: string, role: AppRole | null): Report[] {
  if (role === "superadmin") {
    return rows.filter((report) => report.recipientRoles.split(",").includes("superadmin"));
  }
  if (role === "admin") {
    return rows.filter((report) =>
      report.recipientRoles.split(",").includes("admin") || report.submittedById === userId
    );
  }
  if (role === "teacher" || role === "admin_assistant") {
    return rows.filter((report) =>
      report.recipientRoles.split(",").includes(role) || report.submittedById === userId
    );
  }
  return rows.filter((report) => report.submittedById === userId);
}

async function withLocalFallback<T>(apiOperation: () => Promise<T>, localOperation: () => T): Promise<T> {
  if (!hasApiSession()) return localOperation();
  try {
    return await apiOperation();
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return localOperation();
  }
}

/** Which roles can submit to whom. Returns "" for roles that cannot submit. */
export function recipientRolesForSubmitter(role: AppRole | string | null): string {
  if (role === "superadmin") return ""; // Superadmin only receives; never submits.
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
  async all(): Promise<Report[]> {
    return withLocalFallback(
      () => apiClient.listReports(),
      () => mockDb.list<Report>(COL),
    );
  },

  /** Returns reports visible to the given user */
  async visible(userId: string, role: AppRole | null): Promise<Report[]> {
    if (hasApiSession()) {
      try {
        // The API already applies recipient/submitter visibility for this user.
        return await apiClient.listReports();
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }
    return localVisible(mockDb.list<Report>(COL), userId, role);
  },

  /** Returns reports where the user is a designated reviewer */
  async incomingFor(role: AppRole | null): Promise<Report[]> {
    if (!role) return [];
    return (await this.all()).filter(
      (r) =>
        r.recipientRoles.split(",").includes(role) &&
        r.status === "Submitted"
    );
  },

  async submit(input: {
    title: string;
    category: string;
    details: string;
    submittedBy: string;
    submittedById: string;
    submitterRole: AppRole | string;
    attachments?: ReportAttachment[];
  }): Promise<Report> {
    const recipientRoles = recipientRolesForSubmitter(input.submitterRole);
    if (!recipientRoles) {
      throw new Error("Superadmin accounts can review reports but cannot submit them.");
    }
    const apiInput = {
      title: input.title,
      category: input.category,
      details: input.details,
      attachments: input.attachments,
    };
    return withLocalFallback(
      () => apiClient.submitReport(apiInput),
      () => {
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
        notify(
          recipientRoles,
          "New report submitted",
          `${input.submittedBy} submitted "${row.title}" for review.`,
        );
        return row;
      },
    );
  },

  async review(
    id: string,
    action: "approve" | "reject" | "return",
    actor: { name: string; role: AppRole | string; id: string },
    comment = ""
  ): Promise<Report | null> {
    if (hasApiSession()) {
      try {
        return await apiClient.reviewReport(id, action, comment);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }
    const row = mockDb.list<Report>(COL).find((r) => r.id === id);
    if (!row || row.status !== "Submitted" || !row.recipientRoles.split(",").includes(actor.role)) return null;

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
