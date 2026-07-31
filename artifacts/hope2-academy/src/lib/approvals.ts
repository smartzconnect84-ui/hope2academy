/**
 * Hierarchical approval workflow.
 *
 * Staff (teachers, assistants, registrar, admissions) submit records/reports.
 * Admin reviews them; items flagged as requiring final sign-off are forwarded
 * to the Superadmin. Every transition writes a comment, a timestamp, an audit
 * trail entry and a notification for the next actor.
 */
import { mockDb, type AppRole } from "@/lib/mock-backend";

export type ApprovalStatus =
  | "Pending Admin"
  | "Pending Superadmin"
  | "Approved"
  | "Rejected"
  | "Returned for Revision";

export interface ApprovalEvent {
  at: string;
  actor: string;
  actorRole: AppRole | string;
  action: string;
  comment?: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  category: string;
  details: string;
  requiresSuperadmin: boolean;
  status: ApprovalStatus;
  submittedBy: string;
  submittedById: string;
  submitterRole: AppRole | string;
  createdAt: string;
  updatedAt: string;
  history: ApprovalEvent[];
}

export interface PortalNotification {
  id: string;
  audienceRole: string;
  audienceUserId?: string;
  title: string;
  body: string;
  at: string;
  read?: boolean;
}

const COL = "approvals";
const NOTIF = "notifications";
const AUDIT = "audit";

export const APPROVAL_CATEGORIES = [
  "Academic Record",
  "Grade Submission",
  "Lesson Plan",
  "Exam Paper",
  "Attendance Report",
  "Operational Request",
  "Procurement",
  "Leave Request",
  "Policy Change",
];

function now() { return new Date().toISOString(); }

function audit(actor: string, action: string) {
  mockDb.create<any>(AUDIT, { at: now().slice(0, 16).replace("T", " "), actor, action });
}

function notify(audienceRole: string, title: string, body: string, audienceUserId?: string) {
  mockDb.create<any>(NOTIF, { audienceRole, audienceUserId, title, body, at: now(), read: false });
}

export const approvalsStore = {
  all(): ApprovalRequest[] {
    return mockDb.list<ApprovalRequest>(COL);
  },

  /** Rows visible to a given actor: admins see the full queue, submitters see their own. */
  visible(userId: string, role: AppRole | null): ApprovalRequest[] {
    const rows = this.all();
    if (role === "superadmin" || role === "admin") return rows;
    return rows.filter((r) => r.submittedById === userId);
  },

  submit(input: {
    title: string; category: string; details: string; requiresSuperadmin: boolean;
    submittedBy: string; submittedById: string; submitterRole: AppRole | string;
  }): ApprovalRequest {
    const row: ApprovalRequest = {
      id: `apr_${Math.random().toString(36).slice(2, 9)}`,
      ...input,
      status: "Pending Admin",
      createdAt: now(),
      updatedAt: now(),
      history: [{
        at: now(), actor: input.submittedBy, actorRole: input.submitterRole,
        action: "Submitted", comment: input.details,
      }],
    };
    mockDb.create(COL, row);
    audit(input.submittedBy, `Submitted "${row.title}" for approval`);
    notify("admin", "New approval request", `${input.submittedBy} submitted "${row.title}".`);
    return row;
  },

  act(
    id: string,
    action: "approve" | "reject" | "return" | "forward",
    actor: { name: string; role: AppRole | string; id: string },
    comment = "",
  ): ApprovalRequest | null {
    const row = this.all().find((r) => r.id === id);
    if (!row) return null;

    let status: ApprovalStatus;
    let label: string;

    if (action === "reject") { status = "Rejected"; label = "Rejected"; }
    else if (action === "return") { status = "Returned for Revision"; label = "Returned for revision"; }
    else if (action === "forward") { status = "Pending Superadmin"; label = "Forwarded to Super Admin"; }
    else if (actor.role === "admin" && row.requiresSuperadmin) {
      status = "Pending Superadmin"; label = "Approved by Admin — forwarded to Super Admin";
    } else { status = "Approved"; label = "Approved"; }

    const history: ApprovalEvent[] = [...row.history, {
      at: now(), actor: actor.name, actorRole: actor.role, action: label, comment,
    }];
    const updated = mockDb.update<ApprovalRequest>(COL, id, { status, history, updatedAt: now() } as Partial<ApprovalRequest>);
    audit(actor.name, `${label}: "${row.title}"`);
    if (status === "Pending Superadmin") {
      notify("superadmin", "Awaiting final approval", `"${row.title}" needs your sign-off.`);
    } else {
      notify(String(row.submitterRole), `Request ${status.toLowerCase()}`,
        `"${row.title}" was ${status.toLowerCase()} by ${actor.name}.`, row.submittedById);
    }
    return updated;
  },

  notifications(userId: string, role: AppRole | null): PortalNotification[] {
    return mockDb.list<PortalNotification>(NOTIF)
      .filter((n) => (n.audienceUserId ? n.audienceUserId === userId : n.audienceRole === role))
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  },

  markAllRead(userId: string, role: AppRole | null) {
    for (const n of this.notifications(userId, role)) {
      if (!n.read) mockDb.update<any>(NOTIF, n.id, { read: true });
    }
  },
};
