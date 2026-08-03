/**
 * Mock backend — localStorage-only. No network calls.
 * Provides auth, profiles, and per-module data so the app runs end-to-end
 * for the demo without Appwrite/Supabase.
 */

export const APP_ROLES = [
  "superadmin",
  "admin",
  "admin_assistant",
  "registrar",
  "admissions_officer",
  "teacher",
  "nurse",
  "student",
  "parent",
  "alumni",
] as const;
export type AppRole = typeof APP_ROLES[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  admin_assistant: "Administrative Assistant",
  registrar: "Registrar",
  admissions_officer: "Admission Officer",
  teacher: "Teacher",
  nurse: "School Nurse",
  student: "Student",
  parent: "Parent",
  alumni: "Alumni",
};

export interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AppRole;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  emergency_contact?: string | null;
  grade?: string | null;
  class_name?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  graduation_year?: number | null;
  linked_children?: string[] | null;
  /** Unique school-issued ID for students: H2A-YYYY-NNNN */
  student_id?: string | null;
  /** Admission number assigned on application: ADM-YYYY-NNNN */
  admission_no?: string | null;
  createdAt: string;
}

const KEY_USERS = "h2l.users";
const KEY_SESSION = "h2l.session";
const KEY_DATA = "h2l.data";
const KEY_RESET = "h2l.resetTokens";
const KEY_REMEMBER = "h2l.rememberEmail";
/** Bumped when demo accounts change so existing browsers pick up new roles. */
const KEY_USERS_VERSION = "h2l.users.version";
const USERS_VERSION = "6";
const KEY_SID_COUNTER = "h2l.sid_counter";
const KEY_ADM_COUNTER = "h2l.adm_counter";

/** Generate the next school-issued Student ID: H2A-YYYY-NNNN */
export function nextStudentId(): string {
  if (!isBrowser()) return `H2A-${new Date().getFullYear()}-0001`;
  // Initialise counter from highest existing student_id to avoid duplicates.
  const key = KEY_SID_COUNTER;
  const stored = Number(localStorage.getItem(key) || "0");
  if (stored === 0) {
    const all = readUsers();
    const highest = all.reduce((max, u) => {
      const m = (u.student_id ?? "").match(/H2A-\d{4}-(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    localStorage.setItem(key, String(highest));
  }
  const n = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(n));
  return `H2A-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

/** Generate the next Admission Number: ADM-YYYY-NNNN */
export function nextAdmissionNo(): string {
  if (!isBrowser()) return `ADM-${new Date().getFullYear()}-0001`;
  const key = KEY_ADM_COUNTER;
  const n = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(n));
  return `ADM-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}

export const DEMO_CREDENTIALS: Array<{ role: AppRole; email: string; password: string; name: string }> = [
  { role: "superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole" },
  { role: "admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah" },
  { role: "admin_assistant",    email: "assistant@hope2.demo", password: "demo1234", name: "Bendu Sirleaf" },
  { role: "registrar",          email: "registrar@hope2.demo", password: "demo1234", name: "Emmanuel Gbaba" },
  { role: "admissions_officer", email: "admissions@hope2.demo", password: "demo1234", name: "Korto Nyanquoi" },
  { role: "teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman" },
  { role: "nurse",      email: "nurse@hope2.demo",      password: "demo1234", name: "Helen Wortor" },
  { role: "student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe" },
  { role: "parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe" },
  { role: "alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie" },
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

const ROLE_SEED_PROFILE: Partial<Record<AppRole, Partial<MockUser>>> = {
  superadmin: { bio: "Director of Programs and Governance." },
  admin: { department: "Operations", bio: "Manages campuses and staffing." },
  admin_assistant: { department: "Administration", bio: "Front office, correspondence, scheduling and school records support." },
  registrar: { department: "Registry", bio: "Custodian of student records, enrolment, transcripts and grade books." },
  admissions_officer: { department: "Admissions", bio: "Guides families through applications, interviews and enrolment offers." },
  teacher: { department: "Mathematics", subjects: ["Mathematics", "Civics", "Literature"], bio: "Lead teacher, Marshall Road Campus." },
  nurse: { department: "Health & Wellness", bio: "School nurse — clinic visits, immunisations, medications and health alerts." },
  student: { grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", student_id: "H2A-2026-0001" },
  parent: { linked_children: ["Mariama Doe", "Ezekiel Doe"], bio: "Father of two HOPE2 students." },
  alumni: { graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia." },
};

function readUsers(): MockUser[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(KEY_USERS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function writeUsers(u: MockUser[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_USERS, JSON.stringify(u));
}

function seedIfEmpty() {
  if (!isBrowser()) return;
  const existing = readUsers();
  const version = localStorage.getItem(KEY_USERS_VERSION);
  if (existing.length > 0) {
    // Upgrade: keep only DEMO_CREDENTIALS accounts + any real (non-@hope2.demo) accounts.
    if (version !== USERS_VERSION) {
      const now = new Date().toISOString();
      const demoEmails = new Set(DEMO_CREDENTIALS.map(c => c.email.toLowerCase()));
      // Retain real (non-demo) accounts and the canonical demo accounts; drop filler @hope2.demo extras.
      const retained = existing.filter(
        u => demoEmails.has(u.email.toLowerCase()) || !u.email.toLowerCase().endsWith("@hope2.demo")
      );
      // Ensure every DEMO_CREDENTIALS entry exists (in case a new role was added).
      const retainedEmails = new Set(retained.map(u => u.email.toLowerCase()));
      const toAdd = DEMO_CREDENTIALS.filter(c => !retainedEmails.has(c.email.toLowerCase())).map((c) => ({
        id: `usr_${c.role}`,
        email: c.email,
        password: c.password,
        name: c.name,
        role: c.role,
        phone: "+231 775 975 544",
        address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia",
        createdAt: now,
        ...(ROLE_SEED_PROFILE[c.role] ?? {}),
      })) as MockUser[];
      writeUsers([...retained, ...toAdd]);
      localStorage.setItem(KEY_USERS_VERSION, USERS_VERSION);
    }
    return;
  }
  localStorage.setItem(KEY_USERS_VERSION, USERS_VERSION);

  const now = new Date().toISOString();
  const base = ROLE_SEED_PROFILE;

  const seed: MockUser[] = DEMO_CREDENTIALS.map((c) => ({
    id: `usr_${c.role}`,
    email: c.email,
    password: c.password,
    name: c.name,
    role: c.role,
    phone: `+231 775 975 544`,
    address: "Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia",
    officeHours: "Mon–Fri · 7:00 AM – 4:00 PM",
    createdAt: now,
    ...(base[c.role] ?? {}),
  }));

  writeUsers(seed);
}

// ---------- Auth ----------
export const mockAuth = {
  init() { seedIfEmpty(); ensureSeedData(); },

  async signIn(email: string, password: string): Promise<MockUser> {
    seedIfEmpty();
    const u = readUsers().find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    if (isBrowser()) localStorage.setItem(KEY_SESSION, u.id);
    return u;
  },

  async getCurrent(): Promise<MockUser | null> {
    if (!isBrowser()) return null;
    seedIfEmpty();
    const id = localStorage.getItem(KEY_SESSION);
    if (!id) return null;
    return readUsers().find(u => u.id === id) ?? null;
  },

  async signOut() {
    if (isBrowser()) localStorage.removeItem(KEY_SESSION);
  },

  async updateProfile(id: string, patch: Partial<MockUser>) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx] = { ...users[idx], ...patch };
    writeUsers(users);
    return users[idx];
  },

  /** Self-service password change — requires the current password. */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    if (users[idx].password !== currentPassword) throw new Error("Current password is incorrect");
    if (newPassword.length < 8) throw new Error("New password must be at least 8 characters");
    if (newPassword === currentPassword) throw new Error("New password must be different");
    users[idx] = { ...users[idx], password: newPassword };
    writeUsers(users);
    return true;
  },

  /** Store an avatar (data URL) on the account. Pass null to remove it. */
  async setAvatar(id: string, dataUrl: string | null) {
    return this.updateProfile(id, { avatar: dataUrl ?? undefined } as Partial<MockUser>);
  },

  async listUsers(): Promise<MockUser[]> {
    seedIfEmpty();
    return readUsers();
  },

  async changeRole(id: string, role: AppRole) {
    return this.updateProfile(id, { role });
  },

  async createUser(input: {
    email: string;
    name: string;
    role: AppRole;
    password?: string;
    student_id?: string;
    admission_no?: string;
    grade?: string;
    class_name?: string;
  }) {
    const users = readUsers();
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new Error("Email already exists");
    // Auto-generate student_id if creating a student and none provided
    const student_id = input.role === "student"
      ? (input.student_id || nextStudentId())
      : undefined;
    const u: MockUser = {
      id: `usr_${Math.random().toString(36).slice(2, 9)}`,
      email: input.email,
      password: input.password || "demo1234",
      name: input.name,
      role: input.role,
      ...(student_id ? { student_id } : {}),
      ...(input.admission_no ? { admission_no: input.admission_no } : {}),
      ...(input.grade ? { grade: input.grade } : {}),
      ...(input.class_name ? { class_name: input.class_name } : {}),
      createdAt: new Date().toISOString(),
    };
    writeUsers([u, ...users]);
    return u;
  },

  async deleteUser(id: string) {
    writeUsers(readUsers().filter(u => u.id !== id));
  },

  // ---------- Password reset (demo flow: token surfaced in-app) ----------
  /** Issues a 6-digit reset code for the email. Throws if no such account. */
  async requestPasswordReset(email: string): Promise<string> {
    seedIfEmpty();
    const u = readUsers().find(x => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) throw new Error("No account found with that email");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (isBrowser()) {
      const all = JSON.parse(localStorage.getItem(KEY_RESET) || "{}");
      all[u.email.toLowerCase()] = { code, expires: Date.now() + 15 * 60 * 1000 };
      localStorage.setItem(KEY_RESET, JSON.stringify(all));
    }
    return code;
  },

  /** Completes a reset using the issued code. */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
    const key = email.trim().toLowerCase();
    const all = isBrowser() ? JSON.parse(localStorage.getItem(KEY_RESET) || "{}") : {};
    const entry = all[key];
    if (!entry || entry.code !== code.trim()) throw new Error("Invalid reset code");
    if (Date.now() > entry.expires) throw new Error("Reset code has expired");
    const users = readUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === key);
    if (idx === -1) throw new Error("No account found with that email");
    users[idx] = { ...users[idx], password: newPassword };
    writeUsers(users);
    delete all[key];
    if (isBrowser()) localStorage.setItem(KEY_RESET, JSON.stringify(all));
  },

  // ---------- Remember me ----------
  getRememberedEmail(): string {
    if (!isBrowser()) return "";
    return localStorage.getItem(KEY_REMEMBER) ?? "";
  },
  setRememberedEmail(email: string | null) {
    if (!isBrowser()) return;
    if (email) localStorage.setItem(KEY_REMEMBER, email);
    else localStorage.removeItem(KEY_REMEMBER);
  },
};

// ---------- Generic mock data store ----------
type DataShape = Record<string, any[]>;

function readData(): DataShape {
  if (!isBrowser()) return {};
  try { return JSON.parse(localStorage.getItem(KEY_DATA) || "{}"); }
  catch { return {}; }
}
function writeData(d: DataShape) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_DATA, JSON.stringify(d));
}

function ensureSeedData() {
  if (!isBrowser()) return;
  const d = readData();
  if (d.__seeded) {
    // One-shot migration: replace legacy departments with the four HOPE2 divisions.
    if (!d.__migrated_v2) {
      d.departments = [
        { id: "dp1", name: "HOPE2 MISSION",  lead: "Esther Pewee",    staff: 18 },
        { id: "dp2", name: "HOPE2 ACADEMY",  lead: "Grace Kollie",    staff: 42 },
        { id: "dp3", name: "HOPE2 CHURCH",   lead: "Joseph Wreh",     staff: 12 },
        { id: "dp4", name: "HOPE2 MEDIA",    lead: "Patience Kollie", staff: 7  },
      ];
      d.__migrated_v2 = [true];
      writeData(d);
    }
    // v3 migration: expand classes from Nursery through Grade 12.
    if (!d.__migrated_v3) {
      const classLevels = [
        "Nursery", "KG-1", "KG-2",
        "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
        "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
      ];
      const teachers = ["Grace Tubman", "Amos Flomo", "Ruth Gonpu", "Joseph Karpeh", "Esther Wonkeh", "Patience Kollie"];
      d.classes = classLevels.map((lvl, i) => ({
        id: `c${i + 1}`,
        name: lvl,
        teacher: teachers[i % teachers.length],
        room: `R-${100 + i}`,
        students: 18 + ((i * 3) % 18),
        schedule: i % 2 === 0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30",
      }));
      d.__migrated_v3 = [true];
      writeData(d);
    }
    // v4 migration: seed new school management modules.
    if (!d.__migrated_v4) {
      seedNewModules(d);
      d.__migrated_v4 = [true];
      writeData(d);
    }
    // v5 migration: retire the legacy "ABC" level — the roster now runs Nursery → Grade 12.
    if (!d.__migrated_v5) {
      d.classes = (d.classes ?? []).map((c: any) =>
        c?.name === "ABC" ? { ...c, name: "Nursery" } : c,
      ).filter((c: any, i: number, arr: any[]) => arr.findIndex((x) => x.name === c.name) === i);
      d.__migrated_v5 = [true];
      writeData(d);
    }
    // v7 migration: clear all demo/sample transactional data.
    // Structural reference data (classes, departments, settings, pages) is kept.
    // User accounts (login credentials) are stored separately and are not touched.
    if (!d.__migrated_v7) {
      const CLEAR = [
        "assignments","grades","attendance","timetable","lessonplans","exams",
        "announcements","messages","events","jobs","posts","media","donations",
        "fees","children","admissions","behavior","transport","audit","resources",
        "library","inventory","staff","scholarships","directory","calendar",
        "clinic","immunizations","medications","healthalerts","medicalscreenings",
        "leaverequests","ptmeetings","counselling","bookstock","approvals","payroll",
        "expenses","campaigns","forms",
      ];
      for (const col of CLEAR) d[col] = [];
      d.__migrated_v7 = [true];
      writeData(d);
    }
    // v8 migration: clear any residual fake/demo seed data for existing users,
    // and wipe module-level fake entries seeded by seedNewModules.
    // Demo user accounts are stored separately and are never touched.
    if (!d.__migrated_v8) {
      const CLEAR_V8 = [
        "assignments","grades","attendance","timetable","lessonplans","exams",
        "admissions","behavior","transport","clinic","immunizations","medications",
        "healthalerts","medicalscreenings","calendar","inventory","staff",
        "scholarships","reports","notifications",
      ];
      for (const col of CLEAR_V8) d[col] = [];
      d.__migrated_v8 = [true];
      writeData(d);
    }
    // v6 migration: stamp teacher ownership on all operational records so per-teacher
    // data isolation works correctly in RBAC.
    if (!d.__migrated_v6) {
      // assignments
      const aMap: Record<string,string> = { a1:"Grace Tubman",a2:"Amos Flomo",a3:"Ruth Gonpu",a4:"Grace Tubman" };
      d.assignments = (d.assignments ?? []).map((a: any) => ({ ...a, teacher: a.teacher ?? aMap[a.id] ?? "Grace Tubman",
        class: a.class ? (a.class.includes("—") ? a.class.split("—")[0].trim() : a.class) : a.class }));
      // grades
      const gMap: Record<string,string> = { g1:"Grace Tubman",g2:"Amos Flomo",g3:"Ruth Gonpu",g4:"Amos Flomo",g5:"Grace Tubman",g6:"Grace Tubman" };
      d.grades = (d.grades ?? []).map((g: any) => ({ ...g, teacher: g.teacher ?? gMap[g.id] ?? "Grace Tubman" }));
      // attendance
      const atMap: Record<string,string> = { at1:"Grace Tubman",at2:"Amos Flomo",at3:"Ruth Gonpu",at4:"Grace Tubman" };
      d.attendance = (d.attendance ?? []).map((a: any) => ({ ...a, teacher: a.teacher ?? atMap[a.id] ?? "Grace Tubman" }));
      // timetable: replace with per-teacher records
      d.timetable = [
        { id:"tt_g1",day:"Monday",    teacher:"Grace Tubman",slots:[{t:"08:00",s:"Grade 9 — Mathematics"},{t:"10:30",s:"Grade 7 — Civic Education"},{t:"14:00",s:"Staff Briefing"}]},
        { id:"tt_g2",day:"Tuesday",   teacher:"Grace Tubman",slots:[{t:"09:00",s:"Grade 12 — Mathematics"},{t:"11:00",s:"Office Hours"}]},
        { id:"tt_g3",day:"Wednesday", teacher:"Grace Tubman",slots:[{t:"08:00",s:"Grade 9 — Mathematics"},{t:"12:30",s:"Grade 7 — Civic Education"}]},
        { id:"tt_g4",day:"Thursday",  teacher:"Grace Tubman",slots:[{t:"09:00",s:"Grade 12 — Mathematics"}]},
        { id:"tt_g5",day:"Friday",    teacher:"Grace Tubman",slots:[{t:"08:00",s:"Grade 9 — Mathematics"},{t:"15:00",s:"Assembly"}]},
        { id:"tt_r1",day:"Monday",    teacher:"Ruth Gonpu",  slots:[{t:"08:30",s:"Grade 10 — Biology"},{t:"11:00",s:"Grade 11 — Chemistry"}]},
        { id:"tt_r2",day:"Tuesday",   teacher:"Ruth Gonpu",  slots:[{t:"09:00",s:"Grade 10 — Biology"},{t:"13:00",s:"Lab Prep"}]},
        { id:"tt_r3",day:"Wednesday", teacher:"Ruth Gonpu",  slots:[{t:"08:30",s:"Grade 11 — Chemistry"},{t:"11:00",s:"Grade 10 — Biology"}]},
        { id:"tt_r4",day:"Thursday",  teacher:"Ruth Gonpu",  slots:[{t:"10:00",s:"Grade 10 — Biology"}]},
        { id:"tt_r5",day:"Friday",    teacher:"Ruth Gonpu",  slots:[{t:"08:30",s:"Grade 11 — Chemistry"},{t:"15:00",s:"Assembly"}]},
        { id:"tt_a1",day:"Monday",    teacher:"Amos Flomo",  slots:[{t:"09:00",s:"Grade 11 — Literature"},{t:"12:00",s:"Grade 8 — History"}]},
        { id:"tt_a2",day:"Tuesday",   teacher:"Amos Flomo",  slots:[{t:"08:00",s:"Grade 8 — History"},{t:"10:30",s:"Grade 11 — Literature"}]},
        { id:"tt_a3",day:"Wednesday", teacher:"Amos Flomo",  slots:[{t:"09:00",s:"Grade 11 — Literature"}]},
        { id:"tt_a4",day:"Thursday",  teacher:"Amos Flomo",  slots:[{t:"08:00",s:"Grade 8 — History"},{t:"10:30",s:"Grade 11 — Literature"}]},
        { id:"tt_a5",day:"Friday",    teacher:"Amos Flomo",  slots:[{t:"09:00",s:"Grade 8 — History"},{t:"15:00",s:"Assembly"}]},
        { id:"tt_j1",day:"Monday",    teacher:"John Kollie", slots:[{t:"08:00",s:"Grade 12 — Physics"},{t:"11:00",s:"Grade 10 — Geography"}]},
        { id:"tt_j2",day:"Tuesday",   teacher:"John Kollie", slots:[{t:"09:00",s:"Grade 10 — Geography"},{t:"12:00",s:"Grade 12 — Physics"}]},
        { id:"tt_j3",day:"Wednesday", teacher:"John Kollie", slots:[{t:"08:00",s:"Grade 12 — Physics"}]},
        { id:"tt_j4",day:"Thursday",  teacher:"John Kollie", slots:[{t:"09:00",s:"Grade 10 — Geography"},{t:"11:00",s:"Grade 12 — Physics"}]},
        { id:"tt_j5",day:"Friday",    teacher:"John Kollie", slots:[{t:"08:00",s:"Grade 12 — Physics"},{t:"15:00",s:"Assembly"}]},
      ];
      // lessonplans
      const lpMap: Record<string,string> = { lp1:"Grace Tubman",lp2:"Amos Flomo",lp3:"Ruth Gonpu" };
      d.lessonplans = (d.lessonplans ?? []).map((l: any) => ({ ...l, teacher: l.teacher ?? lpMap[l.id] ?? "Grace Tubman" }));
      // exams
      const exMap: Record<string,string> = { ex1:"Grace Tubman",ex2:"Amos Flomo",ex3:"Ruth Gonpu",ex4:"Grace Tubman" };
      d.exams = (d.exams ?? []).map((e: any) => ({ ...e, teacher: e.teacher ?? exMap[e.id] ?? "Grace Tubman" }));
      d.__migrated_v6 = [true];
      writeData(d);
    }
    return;
  }

  // Full class roster from Nursery through 12th grade.
  const classLevels = [
    "Nursery", "KG-1", "KG-2",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  ];
  const teachers = ["Grace Tubman", "Amos Flomo", "Ruth Gonpu", "Joseph Karpeh", "Esther Wonkeh", "Patience Kollie"];
  d.classes = classLevels.map((lvl, i) => ({
    id: `c${i + 1}`,
    name: lvl,
    teacher: teachers[i % teachers.length],
    room: `R-${100 + i}`,
    students: 18 + ((i * 3) % 18),
    schedule: i % 2 === 0 ? "Mon/Wed/Fri 08:00" : "Tue/Thu 10:30",
  }));
  // Transactional / academic records start empty — enter real data via the portal.
  d.assignments = [];
  d.grades      = [];
  d.attendance  = [];
  d.timetable   = [];
  // Transactional collections start empty — real data is entered by staff.
  d.announcements = [];
  d.messages      = [];
  d.fees          = [];
  d.children      = [];
  d.events        = [];
  d.jobs          = [];
  d.directory     = [];
  d.donations     = [];
  d.posts         = [];
  d.media         = [];
  d.audit         = [];
  d.resources     = [];
  d.library       = [];

  // Structural / configuration data — always seeded.
  d.pages = [
    { id: "p1", title: "Home",     slug: "/",            status: "Published", updated: "2026-05-15" },
    { id: "p2", title: "About",    slug: "/about",       status: "Published", updated: "2026-05-15" },
    { id: "p3", title: "Programs", slug: "/departments", status: "Published", updated: "2026-05-14" },
    { id: "p4", title: "Contact",  slug: "/contact",     status: "Published", updated: "2026-05-10" },
  ];
  d.departments = [
    { id: "dp1", name: "HOPE2 MISSION",  lead: "", staff: 0 },
    { id: "dp2", name: "HOPE2 ACADEMY",  lead: "", staff: 0 },
    { id: "dp3", name: "HOPE2 CHURCH",   lead: "", staff: 0 },
    { id: "dp4", name: "HOPE2 MEDIA",    lead: "", staff: 0 },
  ];
  d.settings = [
    { id: "s1", key: "Site name",      value: "HOPE2 ACADEMY" },
    { id: "s2", key: "Contact email",  value: "info@hope2academy.org" },
    { id: "s3", key: "Primary color",  value: "Crimson 600" },
    { id: "s4", key: "Timezone",       value: "Africa/Monrovia" },
  ];
  d.__seeded = [true];
  seedNewModules(d);
  d.__migrated_v4 = [true];
  d.__migrated_v5 = [true];
  d.__migrated_v6 = [true];
  d.__migrated_v7 = [true];
  d.__migrated_v8 = [true];
  writeData(d);
}

function seedNewModules(d: DataShape) {
  // All module collections start empty — real data is entered through the portal.
  d.admissions        = d.admissions        ?? [];
  d.exams             = d.exams             ?? [];
  d.behavior          = d.behavior          ?? [];
  d.lessonplans       = d.lessonplans       ?? [];
  d.transport         = d.transport         ?? [];
  d.clinic            = d.clinic            ?? [];
  d.immunizations     = d.immunizations     ?? [];
  d.medications       = d.medications       ?? [];
  d.healthalerts      = d.healthalerts      ?? [];
  d.medicalscreenings = d.medicalscreenings ?? [];
  d.calendar          = d.calendar          ?? [];
  d.inventory         = d.inventory         ?? [];
  d.staff             = d.staff             ?? [];
  d.scholarships      = d.scholarships      ?? [];
  d.reports           = d.reports           ?? [];
}

export const mockDb = {
  list<T = any>(col: string): T[] {
    ensureSeedData();
    return (readData()[col] as T[]) ?? [];
  },
  create<T extends { id?: string } = any>(col: string, item: T): T {
    ensureSeedData();
    const d = readData();
    const withId = { ...item, id: item.id ?? `${col}_${Math.random().toString(36).slice(2, 9)}` } as T;
    d[col] = [withId as any, ...((d[col] as any[]) ?? [])];
    writeData(d);
    return withId;
  },
  update<T extends { id: string } = any>(col: string, id: string, patch: Partial<T>): T | null {
    ensureSeedData();
    const d = readData();
    const rows = (d[col] as any[]) ?? [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch };
    d[col] = rows;
    writeData(d);
    return rows[idx];
  },
  remove(col: string, id: string): boolean {
    ensureSeedData();
    const d = readData();
    const before = ((d[col] as any[]) ?? []).length;
    d[col] = ((d[col] as any[]) ?? []).filter((r) => r.id !== id);
    writeData(d);
    return ((d[col] as any[]) ?? []).length < before;
  },
  reset(col?: string) {
    if (!isBrowser()) return;
    if (!col) { localStorage.removeItem(KEY_DATA); ensureSeedData(); return; }
    const d = readData();
    delete d[col];
    delete d.__seeded;
    writeData(d);
    ensureSeedData();
  },
};