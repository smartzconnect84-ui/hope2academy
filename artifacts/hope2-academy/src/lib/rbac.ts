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
 * teachers, registrar, admissions officer and administrative assistant —
 * has read-only access.
 */
export const ADMIN_MANAGED_COLLECTIONS = [
  "students", "classes", "timetable", "calendar", "announcements",
];

/** Collections a non-staff role may never mutate, only read (their own slice). */
const READ_ONLY_FOR: Partial<Record<AppRole, string[]>> = {
  student: ["grades", "transcripts", "attendance", "fees", "exams", "assignments", "lessons", "resources", "behavior", "classes", "timetable", "announcements", "library", "calendar", "scholarships", "payroll", "expenses"],
  parent: ["grades", "transcripts", "attendance", "fees", "exams", "assignments", "lessons", "resources", "behavior", "children", "classes", "timetable", "announcements", "calendar", "scholarships", "transport", "payroll", "expenses"],
  alumni: ["grades", "transcripts", "exams", "assignments", "resources", "directory", "events", "jobs", "donations", "scholarships", "posts", "payroll", "expenses"],
  teacher: ["fees", "scholarships", "staff", "admissions", "transport", "inventory", "clinic", "payroll", "expenses", "campaigns", "forms"],
  admin_assistant: ["payroll", "expenses"],
  admissions_officer: ["payroll", "expenses"],
};

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
 * Filter a collection's rows down to what this principal may see.
 * Staff roles get everything; teachers get their own + their classes;
 * students/parents/alumni get only their own records.
 */
export function scopeRows<T extends Record<string, any>>(
  collection: string,
  rows: T[],
  p: Principal | null,
): T[] {
  if (!p || !p.role) return [];
  if (isStaff(p.role)) return rows;

  const names = ownedNames(p);
  const klass = p.class_name ?? undefined;

  // Broadcast collections everyone may read in full.
  const PUBLIC_TO_ALL = ["announcements", "calendar", "events", "library", "resources", "jobs", "directory", "posts", "departments", "team"];
  if (PUBLIC_TO_ALL.includes(collection)) return rows;

  if (p.role === "teacher") {
    // Teachers see what they authored, teach, or supervise; otherwise class-level rows.
    return rows.filter((r) => {
      const owned = OWNER_FIELDS.some((f) => f in r && matchesAny(r[f], [p.name]));
      const hasOwner = OWNER_FIELDS.some((f) => f in r && r[f]);
      return owned || !hasOwner;
    });
  }

  if (p.role === "alumni") {
    return rows.filter((r) => SUBJECT_FIELDS.every((f) => !(f in r)) || matchesAny(r[SUBJECT_FIELDS.find((f) => f in r)!], names));
  }

  // Student / parent — strict personal isolation.
  return rows.filter((r) => {
    const subjectField = SUBJECT_FIELDS.find((f) => f in r && r[f]);
    if (subjectField) return matchesAny(r[subjectField], names);
    // Messaging is scoped by participants.
    if ("from" in r || "to" in r) return matchesAny(r.from, names) || matchesAny(r.to, names) || eq(r.to, "All");
    // Class-level rows (timetable, attendance summaries) match the learner's class.
    if (klass && ("class" in r || "class_name" in r)) return eq(r.class ?? r.class_name, klass);
    return false;
  });
}

/** Stamp ownership onto a row created by this principal. */
export function stampOwner<T extends Record<string, any>>(row: T, p: Principal | null): T {
  if (!p) return row;
  return { ...row, createdBy: p.name, createdById: p.id } as T;
}