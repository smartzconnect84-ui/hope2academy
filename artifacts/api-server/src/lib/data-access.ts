import type { AppRole } from "./db-store.js";

export interface DataPrincipal {
  id: string;
  name: string;
  role: AppRole;
  grade?: string | null;
  class_name?: string | null;
  linked_children?: string[] | null;
}

const STAFF_ROLES: AppRole[] = [
  "superadmin", "admin", "admin_assistant", "registrar", "admissions_officer",
];
const ADMIN_MANAGED = ["students", "classes", "timetable", "calendar"];
const MEDICAL_COLLECTIONS = [
  "clinic", "immunizations", "medications", "healthalerts", "medicalscreenings",
];
const CONFIDENTIAL_COLLECTIONS = ["payroll"];
const READ_ROLE_OVERRIDES: Record<string, AppRole[]> = {
  audit: ["superadmin"],
  payroll: ["superadmin", "registrar"],
  expenses: ["superadmin", "admin", "registrar"],
  settings: ["superadmin", "admin"],
  pages: ["superadmin", "admin"],
  media: ["superadmin", "admin"],
  staff: ["superadmin", "admin", "admin_assistant", "registrar", "teacher"],
  clinic: ["superadmin", "admin", "nurse", "parent", "student"],
  immunizations: ["superadmin", "admin", "nurse", "parent", "student"],
  medications: ["superadmin", "admin", "nurse", "parent"],
  healthalerts: ["superadmin", "admin", "nurse", "parent"],
  medicalscreenings: ["superadmin", "admin", "nurse", "parent", "student"],
  behavior: ["superadmin", "admin", "teacher"],
  lessonplans: ["superadmin", "admin", "teacher"],
  transport: ["superadmin", "admin", "teacher"],
  inventory: ["superadmin", "admin", "teacher"],
  admissions: ["superadmin", "admin", "admin_assistant", "registrar", "admissions_officer", "teacher"],
  scholarships: ["superadmin", "admin", "teacher"],
  fees: ["superadmin", "admin", "registrar", "teacher", "student", "parent"],
  counselling: ["superadmin", "admin", "teacher", "nurse"],
  bookstock: ["superadmin", "admin", "teacher", "registrar"],
  ptmeetings: ["superadmin", "admin", "teacher", "parent"],
  leaverequests: ["superadmin", "admin", "teacher", "registrar"],
};
const WRITE_ROLE_OVERRIDES: Record<string, AppRole[]> = {
  audit: [],
  payroll: ["superadmin", "registrar"],
  expenses: ["superadmin", "admin", "registrar"],
  settings: ["superadmin", "admin"],
  pages: ["superadmin", "admin"],
  media: ["superadmin", "admin"],
  sitecontent: ["superadmin", "admin"],
  departments: ["superadmin", "admin"],
  team: ["superadmin", "admin"],
  posts: ["superadmin", "admin"],
  staff: ["superadmin", "admin", "admin_assistant", "registrar"],
  inventory: ["superadmin", "admin"],
  transport: ["superadmin", "admin"],
  scholarships: ["superadmin", "admin"],
  fees: ["superadmin", "admin", "registrar"],
  donations: ["superadmin", "admin", "registrar"],
  classes: ["superadmin", "admin"],
  timetable: ["superadmin", "admin"],
  calendar: ["superadmin", "admin"],
  children: ["superadmin", "admin"],
  clinic: ["superadmin", "admin", "nurse"],
  immunizations: ["superadmin", "admin", "nurse"],
  medications: ["superadmin", "admin", "nurse"],
  healthalerts: ["superadmin", "admin", "nurse"],
  medicalscreenings: ["superadmin", "admin", "nurse"],
  behavior: ["superadmin", "admin", "teacher"],
  lessonplans: ["superadmin", "admin", "teacher"],
  admissions: ["superadmin", "admin", "admin_assistant", "registrar", "admissions_officer"],
  counselling: ["superadmin", "admin", "teacher", "nurse"],
  bookstock: ["superadmin", "admin", "teacher", "registrar"],
  ptmeetings: ["superadmin", "admin", "teacher", "parent"],
  leaverequests: ["superadmin", "admin", "teacher", "registrar"],
};
const ANNOUNCEMENT_WRITERS: AppRole[] = [
  "admin", "superadmin", "admin_assistant", "admissions_officer", "registrar",
];
const READ_ONLY_FOR: Partial<Record<AppRole, string[]>> = {
  student: ["grades", "transcripts", "attendance", "fees", "exams", "assignments", "lessons", "resources", "behavior", "classes", "timetable", "announcements", "library", "calendar", "scholarships", "payroll", "expenses"],
  parent: ["grades", "transcripts", "attendance", "fees", "exams", "assignments", "lessons", "resources", "behavior", "children", "classes", "timetable", "announcements", "calendar", "scholarships", "transport", "payroll", "expenses"],
  alumni: ["grades", "transcripts", "exams", "assignments", "resources", "directory", "events", "jobs", "donations", "scholarships", "posts", "payroll", "expenses"],
  teacher: ["fees", "scholarships", "staff", "admissions", "transport", "inventory", "clinic", "payroll", "expenses", "campaigns", "forms"],
  admin_assistant: ["payroll", "expenses"],
  admissions_officer: ["payroll", "expenses"],
  nurse: ["grades", "transcripts", "exams", "assignments", "fees", "scholarships", "payroll", "expenses", "staff", "admissions", "classes", "timetable", "announcements", "calendar", "inventory", "transport", "campaigns", "forms"],
};

const PUBLIC_TO_ALL = [
  "announcements", "calendar", "events", "library", "resources",
  "jobs", "directory", "posts", "departments", "team", "timetable",
];
const TEACHER_PUBLIC = [
  "announcements", "calendar", "events", "library", "resources", "jobs", "posts",
];
const TEACHER_GLOBAL_READ = [
  "staff", "directory", "scholarships", "admissions", "transport",
  "inventory", "fees", "bookstock", "departments", "team", "counselling", "ptmeetings",
];
const OWNER_FIELDS = [
  "teacher", "teacher_name", "reporter", "createdBy", "created_by", "author",
  "submittedBy", "owner", "nurse", "driver",
];
const SUBJECT_FIELDS = ["student", "student_name", "name", "child", "applicant"];

const eq = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
const matchesAny = (value: unknown, names: string[]) => names.some((name) => eq(value, name));
const isStaff = (role: AppRole) => STAFF_ROLES.includes(role);

export function canReadCollection(collection: string, role: AppRole): boolean {
  const allowedRoles = READ_ROLE_OVERRIDES[collection];
  if (allowedRoles && !allowedRoles.includes(role)) return false;
  return !CONFIDENTIAL_COLLECTIONS.includes(collection)
    || role === "superadmin"
    || role === "registrar";
}

export function canWriteCollection(collection: string, role: AppRole): boolean {
  const allowedRoles = WRITE_ROLE_OVERRIDES[collection];
  if (allowedRoles) return allowedRoles.includes(role);
  if (CONFIDENTIAL_COLLECTIONS.includes(collection)) {
    return role === "superadmin" || role === "registrar";
  }
  if (role === "superadmin" || role === "admin") return true;
  if (collection === "announcements") return ANNOUNCEMENT_WRITERS.includes(role);
  if (role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) return true;
  if (ADMIN_MANAGED.includes(collection)) return false;
  return !READ_ONLY_FOR[role]?.includes(collection);
}

export function scopeDataRows<T extends Record<string, any>>(
  collection: string,
  rows: T[],
  principal: DataPrincipal,
): T[] {
  if (!canReadCollection(collection, principal.role)) return [];
  if (principal.role === "superadmin" || principal.role === "admin") return rows;
  if (isStaff(principal.role)) return rows;

  if (principal.role === "teacher") {
    if (TEACHER_PUBLIC.includes(collection) || TEACHER_GLOBAL_READ.includes(collection)) return rows;
    return rows.filter((row) => {
      if ("from" in row || "to" in row) {
        return matchesAny(row.from, [principal.name])
          || matchesAny(row.to, [principal.name])
          || ["All Staff", "All", "All Teachers"].some((to) => eq(row.to, to));
      }
      return OWNER_FIELDS.some((field) => field in row && matchesAny(row[field], [principal.name]));
    });
  }

  if (PUBLIC_TO_ALL.includes(collection)) return rows;
  if (principal.role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) return rows;

  if (principal.role === "alumni") {
    return rows.filter((row) => {
      const field = SUBJECT_FIELDS.find((key) => key in row);
      return !field || matchesAny(row[field], [principal.name]);
    });
  }

  const names = principal.role === "parent"
    ? (principal.linked_children ?? []).filter(Boolean)
    : [principal.name];
  return rows.filter((row) => {
    const subjectField = SUBJECT_FIELDS.find((field) => field in row && row[field]);
    if (subjectField) return matchesAny(row[subjectField], names);

    if ("from" in row || "to" in row) {
      return matchesAny(row.from, names) || matchesAny(row.to, names) || eq(row.to, "All");
    }

    if ("class" in row || "class_name" in row) {
      const recordClass = String(row.class ?? row.class_name ?? "").trim();
      if (principal.class_name && eq(recordClass, principal.class_name)) return true;
      if (principal.grade) {
        const gradePrefix = `grade ${principal.grade}`.toLowerCase();
        const normalized = recordClass.toLowerCase();
        if (normalized === gradePrefix
          || normalized.startsWith(`${gradePrefix} `)
          || normalized.startsWith(`${gradePrefix}—`)
          || normalized.startsWith(`${gradePrefix} —`)) return true;
      }
      return principal.role === "parent";
    }
    return false;
  });
}

export function canMutateExisting(
  collection: string,
  row: Record<string, any>,
  principal: DataPrincipal,
): boolean {
  if (isStaff(principal.role)) return true;
  if (principal.role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) return true;
  const actorFields = [...OWNER_FIELDS, "from", "createdById", "created_by_id", "authorId"];
  return actorFields.some((field) =>
    field in row && (eq(row[field], principal.name) || eq(row[field], principal.id))
  );
}

export function stampServerOwnership<T extends Record<string, any>>(
  collection: string,
  row: T,
  principal: DataPrincipal,
): T {
  const stamped: Record<string, any> = {
    ...row,
    createdBy: principal.name,
    createdById: principal.id,
  };
  for (const field of ["created_by", "author", "submittedBy", "owner", "reporter", "driver"]) {
    if (field in stamped) stamped[field] = principal.name;
  }
  if (collection === "messages") {
    stamped.from = principal.name;
    stamped.fromId = principal.id;
  }
  if (collection === "announcements") {
    stamped.author = principal.name;
    stamped.authorId = principal.id;
  }
  if (principal.role === "teacher") {
    if ("teacher" in stamped) stamped.teacher = principal.name;
    if ("teacher_name" in stamped) stamped.teacher_name = principal.name;
  }
  if (principal.role === "nurse" && MEDICAL_COLLECTIONS.includes(collection)) {
    stamped.nurse = principal.name;
  }
  return stamped as T;
}

export function stripClientOwnership<T extends Record<string, any>>(
  patch: T,
  principal: DataPrincipal,
): Partial<T> {
  const protectedFields = ["createdBy", "createdById", "created_by", "created_by_id", "authorId", "from", "fromId"];
  const isStaffEditor = isStaff(principal.role);
  if (!isStaffEditor) protectedFields.push("author", "submittedBy", "owner", "reporter", "nurse", "driver");
  if (principal.role === "teacher") protectedFields.push("teacher", "teacher_name");
  if (principal.role === "nurse") protectedFields.push("nurse");
  return Object.fromEntries(Object.entries(patch).filter(([key]) => !protectedFields.includes(key))) as Partial<T>;
}