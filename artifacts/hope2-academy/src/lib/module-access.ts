/**
 * Module Access Control — per-account module enable/disable.
 * Role defaults remain supported for backwards compatibility, while account
 * overrides are stored separately in localStorage as h2l.module_access.users.
 */

const KEY = "h2l.module_access";

export type ModuleAccessMap = Record<string, Record<string, boolean>>;
type UserModuleAccessMap = Record<string, Record<string, boolean>>;

/** Staff roles that can have module access toggled by Admin/Superadmin. */
export const CONTROLLABLE_ROLES = [
  "admin_assistant",
  "registrar",
  "admissions_officer",
  "teacher",
  "nurse",
] as const;

export type ControllableRole = typeof CONTROLLABLE_ROLES[number];

/** Every account role shown in the Superadmin access panel. */
export const MODULE_ACCESS_ROLES = [
  "superadmin",
  "admin",
  ...CONTROLLABLE_ROLES,
  "student",
  "parent",
  "alumni",
] as const;

export type ModuleAccessRole = typeof MODULE_ACCESS_ROLES[number];

/** Roles that always have full access (not subject to module access control). */
export const ALWAYS_FULL_ACCESS_ROLES = ["superadmin", "admin"] as const;

/** Human-readable labels for controllable roles. */
export const CONTROLLABLE_ROLE_LABELS: Record<ControllableRole, string> = {
  admin_assistant: "Administrative Assistant",
  registrar: "Registrar",
  admissions_officer: "Admission Officer",
  teacher: "Teacher",
  nurse: "School Nurse",
};

export const MODULE_ACCESS_ROLE_LABELS: Record<ModuleAccessRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  ...CONTROLLABLE_ROLE_LABELS,
  student: "Student",
  parent: "Parent",
  alumni: "Alumni",
};

/** Modules available to each account role. */
export const ROLE_MODULE_KEYS: Record<ModuleAccessRole, string[]> = {
  superadmin: [],
  admin: [],
  admin_assistant: [
    "calendar", "announcements", "messages", "broadcast", "campaigns",
    "forms", "inquiries", "volunteers", "subscribers", "staff",
    "attendance", "resources", "inventory", "transport", "clinic",
    "events", "visitorlog", "approvals",
  ],
  registrar: [
    "classes", "timetable", "calendar", "grades", "gradesheet", "reportcard",
    "exams", "attendance", "behavior", "bookstock", "directory",
    "admissions", "scholarships", "finance", "fees", "receipts",
    "donations", "pledges", "payroll", "expenses",
    "announcements", "messages", "broadcast", "leaverequests", "approvals",
  ],
  admissions_officer: [
    "admissions", "scholarships", "classes", "messages", "broadcast",
    "campaigns", "forms", "announcements", "events", "calendar",
    "inquiries", "volunteers", "subscribers", "approvals",
  ],
  teacher: [
    "timetable", "attendance", "classes", "assignments", "submissions",
    "assessments", "lessonplans", "exams", "grades", "gradesheet",
    "reportcard", "behavior", "counselling", "bookstock", "ptmeetings",
    "resources", "library", "announcements", "messages", "calendar",
    "leaverequests", "approvals",
  ],
  nurse: [
    "clinic", "immunizations", "medications", "healthalerts",
    "medicalscreenings", "counselling", "directory", "messages",
    "announcements", "calendar", "resources", "approvals",
  ],
  student: [
    "classes", "assignments", "submissions", "assessments", "grades", "gradesheet",
    "reportcard", "timetable", "attendance", "announcements", "messages",
    "calendar", "resources", "library", "directory", "events", "jobs",
  ],
  parent: [
    "children", "grades", "gradesheet", "reportcard", "attendance", "timetable",
    "fees", "announcements", "messages", "calendar", "directory", "events",
  ],
  alumni: [
    "events", "jobs", "mentorship", "announcements", "messages", "calendar", "directory",
  ],
};

/** Human-readable labels for module keys. */
export const MODULE_LABELS: Record<string, string> = {
  calendar: "Academic Calendar",
  announcements: "Announcements",
  messages: "Messages",
  broadcast: "Internal Broadcast",
  campaigns: "Email Campaigns",
  forms: "Online Forms",
  inquiries: "Enquiries",
  volunteers: "Volunteer Sign-ups",
  subscribers: "Subscribers",
  staff: "Staff Directory / HR",
  attendance: "Attendance Register",
  resources: "Teaching Resources",
  inventory: "Asset Management",
  transport: "Transport",
  clinic: "Health Services",
  events: "Events",
  visitorlog: "Visitor Log",
  approvals: "Approvals",
  classes: "Classes & Enrolment",
  timetable: "Timetable",
  grades: "Grade Book",
  gradesheet: "Academic Transcripts",
  reportcard: "Progress Reports",
  exams: "Examinations",
  behavior: "Conduct Records",
  bookstock: "Library Catalogue",
  directory: "School Directory",
  admissions: "Admissions Register",
  scholarships: "Scholarships & Financial Aid",
  finance: "Finance Overview",
  fees: "Tuition & Fees",
  receipts: "Payment Receipts",
  donations: "Donations",
  pledges: "Pledges",
  payroll: "Payroll & Salaries",
  expenses: "Expenses & Payables",
  leaverequests: "Leave Management",
  assignments: "Assignments",
  submissions: "Submissions Register",
  assessments: "Assessments",
  lessonplans: "Lesson Plans",
  counselling: "Counselling Records",
  ptmeetings: "PTM Scheduler",
  library: "Digital Library",
  immunizations: "Immunisation Records",
  medications: "Medication Administration",
  healthalerts: "Health Alerts",
  medicalscreenings: "Health Screenings",
};

function read(): ModuleAccessMap {
  if (typeof localStorage === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function readUsers(): UserModuleAccessMap {
  if (typeof localStorage === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(`${KEY}.users`) || "{}"); } catch { return {}; }
}
function writeUsers(d: UserModuleAccessMap) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${KEY}.users`, JSON.stringify(d));
}
function write(d: ModuleAccessMap) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(d));
}

export const moduleAccessStore = {
  /**
   * Returns true (enabled) by default — missing key means enabled.
   * Admin and Superadmin always return true regardless.
   */
  isEnabled(role: string, moduleKey: string, userId?: string): boolean {
    if ((ALWAYS_FULL_ACCESS_ROLES as readonly string[]).includes(role)) return true;
    if (userId) {
      const userValue = readUsers()[userId]?.[moduleKey];
      if (typeof userValue === "boolean") return userValue;
    }
    const d = read();
    // If a role entry doesn't exist or the key isn't set, default = enabled.
    return d[role]?.[moduleKey] !== false;
  },

  setEnabled(role: string, moduleKey: string, enabled: boolean) {
    const d = read();
    if (!d[role]) d[role] = {};
    d[role][moduleKey] = enabled;
    write(d);
  },

  setUserEnabled(userId: string, role: string, moduleKey: string, enabled: boolean) {
    if ((ALWAYS_FULL_ACCESS_ROLES as readonly string[]).includes(role)) return;
    const d = readUsers();
    if (!d[userId]) d[userId] = {};
    d[userId][moduleKey] = enabled;
    writeUsers(d);
  },

  getForUser(userId: string): Record<string, boolean> {
    return readUsers()[userId] ?? {};
  },

  getForRole(role: string): Record<string, boolean> {
    return read()[role] ?? {};
  },

  getAll(): ModuleAccessMap {
    return read();
  },

  /** Enable all modules for a role (reset to defaults). */
  enableAll(role: string) {
    const d = read();
    delete d[role];
    write(d);
  },

  enableAllForUser(userId: string, role: string, moduleKeys: string[]) {
    if ((ALWAYS_FULL_ACCESS_ROLES as readonly string[]).includes(role)) return;
    const d = readUsers();
    d[userId] = Object.fromEntries(moduleKeys.map((key) => [key, true]));
    writeUsers(d);
  },
};
