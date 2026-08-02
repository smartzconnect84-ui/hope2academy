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
  student: { grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer." },
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

  async createUser(input: { email: string; name: string; role: AppRole; password?: string }) {
    const users = readUsers();
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new Error("Email already exists");
    const u: MockUser = {
      id: `usr_${Math.random().toString(36).slice(2, 9)}`,
      email: input.email,
      password: input.password || "demo1234",
      name: input.name,
      role: input.role,
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
  d.assignments = [
    { id: "a1", title: "Quadratic Equations — Set 4",        class: "Grade 9",  due: "2026-05-27", status: "Open",    submissions: 12, teacher: "Grace Tubman" },
    { id: "a2", title: "Essay: The Things They Carried",     class: "Grade 11", due: "2026-05-29", status: "Open",    submissions: 8,  teacher: "Amos Flomo" },
    { id: "a3", title: "Photosynthesis Lab Report",          class: "Grade 10", due: "2026-05-24", status: "Grading", submissions: 26, teacher: "Ruth Gonpu" },
    { id: "a4", title: "Civic Duty Reflection",              class: "Grade 7",  due: "2026-06-02", status: "Open",    submissions: 0,  teacher: "Grace Tubman" },
    { id: "a5", title: "Newton's Laws — Problem Set 3",      class: "Grade 12", due: "2026-06-05", status: "Open",    submissions: 3,  teacher: "John Kollie" },
    { id: "a6", title: "World War II — Causes & Effects",    class: "Grade 8",  due: "2026-06-03", status: "Open",    submissions: 5,  teacher: "Amos Flomo" },
    { id: "a7", title: "Map Reading & Coordinates",          class: "Grade 10", due: "2026-06-07", status: "Open",    submissions: 9,  teacher: "John Kollie" },
    { id: "a8", title: "Chemical Bonding Quiz",              class: "Grade 11", due: "2026-05-30", status: "Grading", submissions: 18, teacher: "Ruth Gonpu" },
    { id: "a9", title: "Algebra Mid-Period Test",            class: "Grade 12", due: "2026-05-28", status: "Grading", submissions: 14, teacher: "Grace Tubman" },
  ];
  d.grades = [
    { id: "g1", student: "Mariama Doe",  subject: "Mathematics",  grade: "A-", score: 91, term: "Period 2", teacher: "Grace Tubman" },
    { id: "g2", student: "Mariama Doe",  subject: "Literature",   grade: "B+", score: 87, term: "Period 2", teacher: "Amos Flomo" },
    { id: "g3", student: "Mariama Doe",  subject: "Biology",      grade: "A",  score: 95, term: "Period 2", teacher: "Ruth Gonpu" },
    { id: "g4", student: "Kollie Boima", subject: "Literature",   grade: "A",  score: 94, term: "Period 2", teacher: "Amos Flomo" },
    { id: "g5", student: "Kollie Boima", subject: "Mathematics",  grade: "B",  score: 82, term: "Period 2", teacher: "Grace Tubman" },
    { id: "g6", student: "Fatu Kanneh",  subject: "Civics",       grade: "A+", score: 98, term: "Period 2", teacher: "Grace Tubman" },
    { id: "g7", student: "Mariama Doe",  subject: "Civics",       grade: "A",  score: 92, term: "Period 2", teacher: "Grace Tubman" },
    { id: "g8", student: "Kollie Boima", subject: "History",      grade: "B+", score: 88, term: "Period 2", teacher: "Amos Flomo" },
    { id: "g9", student: "Fatu Kanneh",  subject: "Biology",      grade: "B",  score: 83, term: "Period 2", teacher: "Ruth Gonpu" },
  ];
  d.attendance = [
    { id: "at1", date: "2026-05-21", class: "Grade 9",  subject: "Mathematics",    present: 26, absent: 2, late: 0, teacher: "Grace Tubman" },
    { id: "at2", date: "2026-05-21", class: "Grade 11", subject: "Literature",     present: 20, absent: 1, late: 1, teacher: "Amos Flomo" },
    { id: "at3", date: "2026-05-20", class: "Grade 10", subject: "Biology",        present: 25, absent: 0, late: 1, teacher: "Ruth Gonpu" },
    { id: "at4", date: "2026-05-20", class: "Grade 7",  subject: "Civic Education",present: 29, absent: 2, late: 0, teacher: "Grace Tubman" },
    { id: "at5", date: "2026-05-22", class: "Grade 12", subject: "Physics",        present: 16, absent: 1, late: 0, teacher: "John Kollie" },
    { id: "at6", date: "2026-05-22", class: "Grade 8",  subject: "History",        present: 28, absent: 3, late: 1, teacher: "Amos Flomo" },
    { id: "at7", date: "2026-05-22", class: "Grade 11", subject: "Chemistry",      present: 22, absent: 0, late: 0, teacher: "Ruth Gonpu" },
  ];
  /* Per-teacher timetable — each record belongs to one teacher.
     scopeRows filters these so each teacher sees only their own schedule.
     Students/parents/others see the merged school-wide schedule. */
  d.timetable = [
    { id: "tt_g1", day: "Monday",    teacher: "Grace Tubman", slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "10:30", s: "Grade 7 — Civic Education" }, { t: "14:00", s: "Staff Briefing" }] },
    { id: "tt_g2", day: "Tuesday",   teacher: "Grace Tubman", slots: [{ t: "09:00", s: "Grade 12 — Mathematics" }, { t: "11:00", s: "Office Hours" }] },
    { id: "tt_g3", day: "Wednesday", teacher: "Grace Tubman", slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "12:30", s: "Grade 7 — Civic Education" }] },
    { id: "tt_g4", day: "Thursday",  teacher: "Grace Tubman", slots: [{ t: "09:00", s: "Grade 12 — Mathematics" }] },
    { id: "tt_g5", day: "Friday",    teacher: "Grace Tubman", slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "15:00", s: "Assembly" }] },
    { id: "tt_r1", day: "Monday",    teacher: "Ruth Gonpu",   slots: [{ t: "08:30", s: "Grade 10 — Biology" }, { t: "11:00", s: "Grade 11 — Chemistry" }] },
    { id: "tt_r2", day: "Tuesday",   teacher: "Ruth Gonpu",   slots: [{ t: "09:00", s: "Grade 10 — Biology" }, { t: "13:00", s: "Lab Prep" }] },
    { id: "tt_r3", day: "Wednesday", teacher: "Ruth Gonpu",   slots: [{ t: "08:30", s: "Grade 11 — Chemistry" }, { t: "11:00", s: "Grade 10 — Biology" }] },
    { id: "tt_r4", day: "Thursday",  teacher: "Ruth Gonpu",   slots: [{ t: "10:00", s: "Grade 10 — Biology" }] },
    { id: "tt_r5", day: "Friday",    teacher: "Ruth Gonpu",   slots: [{ t: "08:30", s: "Grade 11 — Chemistry" }, { t: "15:00", s: "Assembly" }] },
    { id: "tt_a1", day: "Monday",    teacher: "Amos Flomo",   slots: [{ t: "09:00", s: "Grade 11 — Literature" }, { t: "12:00", s: "Grade 8 — History" }] },
    { id: "tt_a2", day: "Tuesday",   teacher: "Amos Flomo",   slots: [{ t: "08:00", s: "Grade 8 — History" }, { t: "10:30", s: "Grade 11 — Literature" }] },
    { id: "tt_a3", day: "Wednesday", teacher: "Amos Flomo",   slots: [{ t: "09:00", s: "Grade 11 — Literature" }] },
    { id: "tt_a4", day: "Thursday",  teacher: "Amos Flomo",   slots: [{ t: "08:00", s: "Grade 8 — History" }, { t: "10:30", s: "Grade 11 — Literature" }] },
    { id: "tt_a5", day: "Friday",    teacher: "Amos Flomo",   slots: [{ t: "09:00", s: "Grade 8 — History" }, { t: "15:00", s: "Assembly" }] },
    { id: "tt_j1", day: "Monday",    teacher: "John Kollie",  slots: [{ t: "08:00", s: "Grade 12 — Physics" }, { t: "11:00", s: "Grade 10 — Geography" }] },
    { id: "tt_j2", day: "Tuesday",   teacher: "John Kollie",  slots: [{ t: "09:00", s: "Grade 10 — Geography" }, { t: "12:00", s: "Grade 12 — Physics" }] },
    { id: "tt_j3", day: "Wednesday", teacher: "John Kollie",  slots: [{ t: "08:00", s: "Grade 12 — Physics" }] },
    { id: "tt_j4", day: "Thursday",  teacher: "John Kollie",  slots: [{ t: "09:00", s: "Grade 10 — Geography" }, { t: "11:00", s: "Grade 12 — Physics" }] },
    { id: "tt_j5", day: "Friday",    teacher: "John Kollie",  slots: [{ t: "08:00", s: "Grade 12 — Physics" }, { t: "15:00", s: "Assembly" }] },
  ];
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
  writeData(d);
}

function seedNewModules(d: DataShape) {
  d.admissions = d.admissions ?? [
    { id: "ad1", applicant: "Hawa Konneh",   grade: "Grade 1",  guardian: "Musa Konneh",  phone: "+231 770 111 222", submitted: "2026-05-12", status: "Interview" },
    { id: "ad2", applicant: "Daniel Tarr",   grade: "KG-2",     guardian: "Elizabeth Tarr",phone: "+231 770 333 444", submitted: "2026-05-15", status: "Pending" },
    { id: "ad3", applicant: "Naomi Flomo",   grade: "Grade 7",  guardian: "Amos Flomo",   phone: "+231 770 555 666", submitted: "2026-05-18", status: "Accepted" },
    { id: "ad4", applicant: "Joseph Karpeh", grade: "Grade 10", guardian: "Prince Karpeh",phone: "+231 770 777 888", submitted: "2026-05-20", status: "Waitlist" },
  ];
  d.exams = d.exams ?? [
    { id: "ex1", subject: "Mathematics", class: "Grade 9",  term: "Period 2",    date: "2026-06-04", room: "R-108", status: "Scheduled",  teacher: "Grace Tubman" },
    { id: "ex2", subject: "Literature",  class: "Grade 11", term: "Period 2",    date: "2026-06-05", room: "R-110", status: "Scheduled",  teacher: "Amos Flomo" },
    { id: "ex3", subject: "Biology",     class: "Grade 10", term: "Mid-Period",  date: "2026-05-28", room: "Lab-1", status: "Completed",  teacher: "Ruth Gonpu" },
    { id: "ex4", subject: "Civics",      class: "Grade 7",  term: "Period 2",    date: "2026-06-02", room: "R-105", status: "Scheduled",  teacher: "Grace Tubman" },
    { id: "ex5", subject: "Physics",     class: "Grade 12", term: "Period 2",    date: "2026-06-06", room: "Lab-2", status: "Scheduled",  teacher: "John Kollie" },
    { id: "ex6", subject: "Chemistry",   class: "Grade 11", term: "Period 2",    date: "2026-06-07", room: "Lab-1", status: "Scheduled",  teacher: "Ruth Gonpu" },
    { id: "ex7", subject: "Mathematics", class: "Grade 12", term: "Period 2",    date: "2026-06-04", room: "R-112", status: "Scheduled",  teacher: "Grace Tubman" },
  ];
  d.behavior = d.behavior ?? [
    { id: "bh1", student: "Mariama Doe",  class: "Grade 9",  type: "Commendation", description: "Top score in Math quiz",       date: "2026-05-19", reporter: "Grace Tubman" },
    { id: "bh2", student: "Kollie Boima", class: "Grade 11", type: "Warning",      description: "Late submission of essay",     date: "2026-05-18", reporter: "Amos Flomo" },
    { id: "bh3", student: "Fatu Kanneh",  class: "Grade 7",  type: "Commendation", description: "Helped classmate",             date: "2026-05-17", reporter: "Grace Tubman" },
    { id: "bh4", student: "Kollie Boima", class: "Grade 10", type: "Commendation", description: "Excellent lab technique",      date: "2026-05-20", reporter: "Ruth Gonpu" },
    { id: "bh5", student: "Mariama Doe",  class: "Grade 8",  type: "Warning",      description: "Incomplete history homework",  date: "2026-05-21", reporter: "Amos Flomo" },
  ];
  d.lessonplans = d.lessonplans ?? [
    { id: "lp1", title: "Quadratic Equations",    subject: "Mathematics", class: "Grade 9",  week: "Week 8", objectives: "Solve quadratics by factoring and the quadratic formula.", status: "Approved",  teacher: "Grace Tubman" },
    { id: "lp2", title: "Romeo & Juliet Act 2",   subject: "Literature",  class: "Grade 11", week: "Week 8", objectives: "Analyse character motivations in Act 2.",                 status: "Submitted", teacher: "Amos Flomo" },
    { id: "lp3", title: "Cell Division",           subject: "Biology",     class: "Grade 10", week: "Week 8", objectives: "Compare mitosis and meiosis.",                           status: "Draft",     teacher: "Ruth Gonpu" },
    { id: "lp4", title: "Newton's Laws of Motion", subject: "Physics",     class: "Grade 12", week: "Week 8", objectives: "Apply Newton's three laws to real-world problems.",      status: "Approved",  teacher: "John Kollie" },
    { id: "lp5", title: "World War II Overview",   subject: "History",     class: "Grade 8",  week: "Week 8", objectives: "Identify causes, events, and consequences of WWII.",    status: "Submitted", teacher: "Amos Flomo" },
    { id: "lp6", title: "Mid-period Revision",     subject: "Mathematics", class: "Grade 12", week: "Week 9", objectives: "Review algebra and calculus for mid-period exam.",       status: "Draft",     teacher: "Grace Tubman" },
  ];
  d.transport = d.transport ?? [
    { id: "tr1", route: "Marshall Road Loop",   driver: "James Roberts", vehicle: "LR-2210", departure: "06:30", riders: 32, feeUsd: 20 },
    { id: "tr2", route: "Barber's Joe → Campus",driver: "Peter Cooper",  vehicle: "LR-3318", departure: "06:45", riders: 28, feeUsd: 18 },
    { id: "tr3", route: "Margibi East Line",    driver: "Alfred Saah",   vehicle: "LR-1102", departure: "06:15", riders: 24, feeUsd: 22 },
  ];
  d.clinic = d.clinic ?? [
    { id: "cl1", student: "Mariama Doe", visitDate: "2026-05-19", reason: "Mild headache", action: "Paracetamol, rest 30 min", nurse: "Nurse Helen", status: "Treated" },
    { id: "cl2", student: "Ezekiel Doe", visitDate: "2026-05-17", reason: "Scraped knee",  action: "Cleaned & bandaged", nurse: "Nurse Helen", status: "Treated" },
    { id: "cl3", student: "Fatu Kanneh", visitDate: "2026-05-16", reason: "Fever",          action: "Referred to clinic", nurse: "Nurse Helen", status: "Referred" },
  ];
  d.immunizations = d.immunizations ?? [
    { id: "im1", student: "Mariama Doe", vaccine: "Measles (MR)", doseDate: "2026-03-12", nextDue: "2027-03-12", administeredBy: "Helen Wortor", status: "Complete" },
    { id: "im2", student: "Ezekiel Doe", vaccine: "Polio (OPV)",  doseDate: "2026-02-08", nextDue: "2026-08-08", administeredBy: "Helen Wortor", status: "Due" },
  ];
  d.medications = d.medications ?? [
    { id: "md1", student: "Fatu Kanneh", medication: "Amoxicillin 250mg", dosage: "1 tablet", schedule: "Twice daily · 12:00, 16:00", startDate: "2026-05-16", endDate: "2026-05-23", consent: "Parent consent on file", status: "Active" },
  ];
  d.healthalerts = d.healthalerts ?? [
    { id: "ha1", student: "Mariama Doe", condition: "Asthma", severity: "Moderate", instructions: "Inhaler kept in clinic. Avoid strenuous outdoor drills on dusty days.", emergencyContact: "+231 775 975 544", status: "Active" },
  ];
  d.medicalscreenings = d.medicalscreenings ?? [
    { id: "ms1", student: "Ezekiel Doe", screening: "Vision", date: "2026-04-10", result: "Normal", followUp: "None", status: "Cleared" },
  ];
  d.calendar = d.calendar ?? [
    { id: "ca1", title: "Period 2 Mid-period Exams", type: "Exam",    startDate: "2026-05-28", endDate: "2026-06-05", audience: "Students" },
    { id: "ca2", title: "Independence Day",      type: "Holiday", startDate: "2026-07-26", endDate: "2026-07-26", audience: "All" },
    { id: "ca3", title: "PTA Meeting",           type: "PTA",     startDate: "2026-06-13", endDate: "2026-06-13", audience: "Parents" },
    { id: "ca4", title: "Inter-house Sports Day",type: "Sports",  startDate: "2026-06-20", endDate: "2026-06-20", audience: "All" },
  ];
  d.inventory = d.inventory ?? [
    { id: "in1", item: "Student desks",      category: "Furniture",   quantity: 240, location: "Marshall Campus", condition: "Good" },
    { id: "in2", item: "Laptop (Dell)",      category: "Electronics", quantity: 18,  location: "Computer Lab",    condition: "Good" },
    { id: "in3", item: "Microscope",         category: "Lab",         quantity: 12,  location: "Science Lab",     condition: "Fair" },
    { id: "in4", item: "Football kit",       category: "Sports",      quantity: 4,   location: "Sports Store",    condition: "New" },
    { id: "in5", item: "Curriculum books G9",category: "Books",       quantity: 60,  location: "Library",         condition: "Good" },
  ];
  d.staff = d.staff ?? [
    { id: "st1", name: "Grace Tubman",   role: "Lead Teacher",  department: "HOPE2 ACADEMY", phone: "+231 775 975 544", salaryUsd: 320, status: "Active" },
    { id: "st2", name: "Joseph Wreh",    role: "Pastor",        department: "HOPE2 CHURCH",  phone: "+231 770 222 333", salaryUsd: 280, status: "Active" },
    { id: "st3", name: "Esther Pewee",   role: "Field Director",department: "HOPE2 MISSION", phone: "+231 770 444 555", salaryUsd: 360, status: "Active" },
    { id: "st4", name: "Patience Kollie",role: "Media Lead",    department: "HOPE2 MEDIA",   phone: "+231 770 666 777", salaryUsd: 240, status: "Active" },
    { id: "st5", name: "Amos Flomo",     role: "Teacher",       department: "HOPE2 ACADEMY", phone: "+231 770 888 999", salaryUsd: 250, status: "On Leave" },
  ];
  d.scholarships = d.scholarships ?? [
    { id: "sc1", student: "Mariama Doe",  sponsor: "Patience Kollie", amountUsd: 320, term: "Period 2", status: "Active" },
    { id: "sc2", student: "Kollie Boima", sponsor: "Anonymous",        amountUsd: 480, term: "Annual", status: "Paid" },
    { id: "sc3", student: "Fatu Kanneh",  sponsor: "Moses Weah",       amountUsd: 200, term: "Period 2", status: "Outstanding" },
  ];
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