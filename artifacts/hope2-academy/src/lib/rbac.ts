/**
 * Role-Based Access Control + per-user data isolation.
 *
 * Every portal module funnels its rows through `scopeRows` so a signed-in user
 * only ever sees records that belong to them (or that their role is entitled to
 * supervise). `canWrite` gates create/update/delete on the same rules.
 */
import type { AppRole } from "@/lib/mock-backend";

export interface Principal {
  id: string;
  name: string;
  email?: string;
  role: AppRole | null;
  class_name?: string | null;
  grade?: string | null;
  linked_children?: string[] | null;
}

/** Roles with full institutional oversight. */
export const STAFF_ROLES: AppRole[] = [
  "superadmin", "admin", "admin_assistant", "registrar", "admissions_officer",
];

export const isStaff = (r: AppRole | null | undefined) => !!r && STAFF_ROLES.includes(r);
export const isAdminLevel = (r: AppRole | null | undefined) => r === "admin" || r === "superadmin";

/**
 * Collections only Admin / Super Admin may mutate. Everyone else — including
 * teachers, registrar, and administrative assistant — has read-only access.
 *
 * NOTE: announcements is intentionally NOT in this list so that
 * admin_assistant and admissions_officer can also post announcements.
 */
export const ADMIN_MANAGED_COLLECTIONS = [
  "students", "classes", "timetable", "calendar",
];

/**
 * Roles that may create and manage announcements
 * (in addition to admin / superadmin who can always write everything).
 */
export const ANNOUNCEMENT_WRITER_ROLES: AppRole[] = [
  "admin", "superadmin", "admin_assistant", "admissions_officer", "registrar",
];

/** Collections a non-staff role may never mutate, only read (their own slice). */
const READ_ONLY_FOR: Partial<Record<AppRole, string[]>> = {
  student: ["grades", "transcripts", "attendance", "fees", "exams", "assignments", "lessons", "resources", "behavior", "classes", "timetable", "announcements", "library", "calendar", "scholarships", "payroll", "expenses"],
  parent: ["grades", "transcripts", "attendance", "fees", "exams", "assignments", "lessons", "resources", "behavior", "children", "classes", "timetable", "announcements", "calendar", "scholarships", "transport", "payroll", "expenses"],
  alumni: ["grades", "transcripts", "exams", "assignments", "resources", "directory", "events", "jobs", "donations", "scholarships", "posts", "payroll", "expenses"],
  teacher: ["fees", "scholarships", "staff", "admissions", "transport", "inventory", "clinic", "payroll", "expenses", "campaigns", "forms"],
  admin_assistant: ["payroll", "expenses"],
  admissions_officer: ["payroll", "expenses"],
  nurse: ["grades", "transcripts", "exams", "assignments", "fees", "scholarships", "payroll", "expenses", "staff", "admissions", "classes", "timetable", "announcements", "calendar", "inventory", "transport", "campaigns", "forms"],
};

/** Medical / health collections owned by the School Nurse. */
export const MEDICAL_COLLECTIONS = [
  "clinic", "immunizations", "medications", "healthalerts", "medicalscreenings",
];

/** Payroll/salary data is confidential to Super Admin and Registrar only. */
export const CONFIDENTIAL_COLLECTIONS = ["payroll"];

/**
 * Academic records that Parents, Students and Alumni may VIEW and DOWNLOAD
 * (export / print) but never create, edit or delete.
 */
export const VIEW_DOWNLOAD_COLLECTIONS = [
  "grades", "transcripts", "exams", "attendance", "assignments",
  "behavior", "timetable", "calendar", "lessons", "resources",
];

const DOWNLOAD_ROLES: AppRole[] = ["student", "parent", "alumni"];

/** May this principal export/print rows of this collection? */
export function canDownload(collection: string, role: AppRole | null): boolean {
  if (!role) return false;
  if (CONFIDENTIAL_COLLECTIONS.includes(collection)) {
    return role === "superadmin" || role === "registrar";
  }
  if (isStaff(role) || role === "teacher") return true;
  if (role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) return true;
  return DOWNLOAD_ROLES.includes(role) && VIEW_DOWNLOAD_COLLECTIONS.includes(collection);
}

export function canWrite(
  collection: string,
  role: AppRole | null,
  lockedCollections: string[] = [],
): boolean {
  if (!role) return false;
  // Salary data: only Super Admin and Registrar may ever mutate it.
  if (CONFIDENTIAL_COLLECTIONS.includes(collection)) {
    return role === "superadmin" || role === "registrar";
  }
  if (role === "superadmin" || role === "admin") return true;
  // Announcements: wider set of roles can post (admin_assistant, admissions_officer, registrar).
  if (collection === "announcements") {
    return ANNOUNCEMENT_WRITER_ROLES.includes(role);
  }
  // The nurse owns medical records outright (unless frozen for approval).
  if (role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) {
    return !lockedCollections.includes(collection);
  }
  if (ADMIN_MANAGED_COLLECTIONS.includes(collection)) return false;
  // Records already submitted upward are frozen until returned for revision.
  if (lockedCollections.includes(collection)) return false;
  const blocked = READ_ONLY_FOR[role];
  if (blocked?.includes(collection)) return false;
  return true;
}

const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

const matchesAny = (value: unknown, names: string[]) =>
  names.some((n) => eq(value, n));

/** Names a principal is allowed to see personal records for. */
function ownedNames(p: Principal): string[] {
  if (p.role === "parent") return (p.linked_children ?? []).filter(Boolean) as string[];
  return [p.name];
}

/** Fields that identify the *subject* of a personal record. */
const SUBJECT_FIELDS = ["student", "student_name", "name", "child", "applicant"];
/** Fields that identify the *author/owner* of an operational record. */
const OWNER_FIELDS = ["teacher", "teacher_name", "reporter", "createdBy", "created_by", "author", "submittedBy", "owner", "nurse", "driver"];

/**
 * Institutional reference tables that teachers may read in full.
 * These do not carry personal ownership stamps so they fall outside
 * the strict ownership filter applied to operational records.
 */
const TEACHER_GLOBAL_READ = [
  "staff", "directory", "scholarships", "admissions", "transport",
  "inventory", "fees", "bookstock", "departments", "team",
  "counselling", "ptmeetings",
];

/**
 * Broadcast collections visible to every authenticated role.
 * Teachers are checked BEFORE this list so their timetable records
 * remain ownership-scoped while all other roles see the full schedule.
 */
const PUBLIC_TO_ALL = [
  "announcements", "calendar", "events", "library", "resources",
  "jobs", "directory", "posts", "departments", "team", "timetable",
];

/**
 * Filter a collection's rows down to what this principal may see.
 *
 * Teachers are checked first (before PUBLIC_TO_ALL) so their operational
 * data — timetable, assignments, grades, etc. — is scoped by ownership.
 * All other non-staff roles use PUBLIC_TO_ALL followed by personal isolation.
 */
export function scopeRows<T extends Record<string, any>>(
  collection: string,
  rows: T[],
  p: Principal | null,
): T[] {
  if (!p || !p.role) return [];
  if (isStaff(p.role)) return rows;

  // ── Teacher: strict per-teacher isolation for operational data ──────────
  if (p.role === "teacher") {
    // Broadcast collections teachers can read in full.
    const TEACHER_PUBLIC = [
      "announcements", "calendar", "events", "library", "resources",
      "jobs", "posts",
    ];
    if (TEACHER_PUBLIC.includes(collection)) return rows;
    // Reference / lookup tables teachers may read in full (no ownership stamp).
    if (TEACHER_GLOBAL_READ.includes(collection)) return rows;
    // Messages and broadcasts: scoped by participant.
    if ("from" in (rows[0] ?? {}) || "to" in (rows[0] ?? {})) {
      return rows.filter((r) =>
        matchesAny(r.from, [p.name]) ||
        matchesAny(r.to, [p.name]) ||
        eq(r.to, "All Staff") ||
        eq(r.to, "All") ||
        eq(r.to, "All Teachers"),
      );
    }
    // All other collections (assignments, grades, attendance, timetable,
    // lessonplans, exams, behavior, classes, leaverequests, approvals…):
    // show only records this teacher owns / authored / reported.
    return rows.filter((r) =>
      OWNER_FIELDS.some((f) => f in r && matchesAny(r[f], [p.name])),
    );
  }

  // ── Broadcast collections visible to every other role ───────────────────
  if (PUBLIC_TO_ALL.includes(collection)) return rows;

  // ── Nurse: full access to all health / medical records ──────────────────
  if (p.role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) return rows;

  const names = ownedNames(p);
  const klass = p.class_name ?? undefined;

  // ── Alumni: own academic history only ───────────────────────────────────
  if (p.role === "alumni") {
    return rows.filter((r) =>
      SUBJECT_FIELDS.every((f) => !(f in r)) ||
      matchesAny(r[SUBJECT_FIELDS.find((f) => f in r)!], names),
    );
  }

  // ── Student / Parent: strict personal isolation ─────────────────────────
  return rows.filter((r) => {
    // Records with a subject field (grades, behavior, fees, clinic…)
    const subjectField = SUBJECT_FIELDS.find((f) => f in r && r[f]);
    if (subjectField) return matchesAny(r[subjectField], names);

    // Messaging: scoped by sender/recipient
    if ("from" in r || "to" in r) {
      return (
        matchesAny(r.from, names) ||
        matchesAny(r.to, names) ||
        eq(r.to, "All")
      );
    }

    // Class-level records (assignments, exams, attendance summaries)
    // match the learner's class name or grade prefix.
    if ("class" in r || "class_name" in r) {
      const rClass = String(r.class ?? r.class_name ?? "").toLowerCase().trim();
      // Direct class_name match (e.g. "Grade 9 — Blue" === "Grade 9 — Blue")
      if (klass && rClass === klass.toLowerCase().trim()) return true;
      // Grade-prefix match: student in "Grade 9 — Blue" sees "Grade 9",
      // "Grade 9 — Mathematics", "Grade 9 — Blue" records.
      if (p.grade) {
        const gradePrefix = `grade ${p.grade}`.toLowerCase();
        if (rClass === gradePrefix || rClass.startsWith(`${gradePrefix} `) || rClass.startsWith(`${gradePrefix}—`) || rClass.startsWith(`${gradePrefix} —`)) {
          return true;
        }
      }
      // Parents: see class records for any of their children.
      // Since we don't store children's grades in the parent profile,
      // show all class-level records so parents can track school activity.
      if (p.role === "parent") return true;
      return false;
    }

    return false;
  });
}

/** Stamp ownership onto a row created by this principal. */
export function stampOwner<T extends Record<string, any>>(row: T, p: Principal | null): T {
  if (!p) return row;
  return { ...row, createdBy: p.name, createdById: p.id } as T;
}
