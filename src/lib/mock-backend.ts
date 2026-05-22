/**
 * Mock backend — localStorage-only. No network calls.
 * Provides auth, profiles, and per-module data so the app runs end-to-end
 * for the demo without Appwrite/Supabase.
 */

export const APP_ROLES = ["superadmin", "admin", "teacher", "student", "parent", "alumni"] as const;
export type AppRole = typeof APP_ROLES[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
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

export const DEMO_CREDENTIALS: Array<{ role: AppRole; email: string; password: string; name: string }> = [
  { role: "superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole" },
  { role: "admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah" },
  { role: "teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman" },
  { role: "student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe" },
  { role: "parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe" },
  { role: "alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie" },
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

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
  if (readUsers().length > 0) return;

  const now = new Date().toISOString();
  const base: Partial<Record<AppRole, Partial<MockUser>>> = {
    superadmin: { bio: "Director of Programs and Governance." },
    admin: { department: "Operations", bio: "Manages campuses and staffing." },
    teacher: { department: "Mathematics", subjects: ["Mathematics", "Civics", "Literature"], bio: "Lead teacher, Sinkor Campus." },
    student: { grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer." },
    parent: { linked_children: ["Mariama Doe", "Ezekiel Doe"], bio: "Father of two HOPE2 students." },
    alumni: { graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia." },
  };

  const seed: MockUser[] = DEMO_CREDENTIALS.map((c, i) => ({
    id: `usr_${c.role}`,
    email: c.email,
    password: c.password,
    name: c.name,
    role: c.role,
    phone: `+231 77 010 ${1000 + i}`,
    address: "Sinkor, Tubman Boulevard, Monrovia, Liberia",
    createdAt: now,
    ...(base[c.role] ?? {}),
  }));

  // Add a few extra realistic users so admin list isn't bare
  const extras: MockUser[] = [
    { id: "usr_2", email: "ruth.gonpu@hope2.demo", password: "demo1234", name: "Ruth Gonpu", role: "teacher", department: "Science", subjects: ["Biology","Chemistry"], createdAt: now },
    { id: "usr_3", email: "kollie.boima@hope2.demo", password: "demo1234", name: "Kollie Boima", role: "student", grade: "11", class_name: "Grade 11 — Gold", createdAt: now },
    { id: "usr_4", email: "fatu.kanneh@hope2.demo", password: "demo1234", name: "Fatu Kanneh", role: "student", grade: "7", class_name: "Grade 7 — Red", createdAt: now },
    { id: "usr_5", email: "moses.weah@hope2.demo", password: "demo1234", name: "Moses Weah", role: "alumni", graduation_year: 2016, createdAt: now },
    { id: "usr_6", email: "elizabeth.tarr@hope2.demo", password: "demo1234", name: "Elizabeth Tarr", role: "parent", linked_children: ["Kollie Boima"], createdAt: now },
    { id: "usr_7", email: "amos.flomo@hope2.demo", password: "demo1234", name: "Amos Flomo", role: "teacher", department: "Literature", subjects: ["Literature","History"], createdAt: now },
  ];
  writeUsers([...seed, ...extras]);
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
  if (d.__seeded) return;

  d.classes = [
    { id: "c1", name: "Grade 9 — Mathematics", teacher: "Grace Tubman", room: "A-12", students: 28, schedule: "Mon/Wed/Fri 08:00" },
    { id: "c2", name: "Grade 11 — Literature", teacher: "Amos Flomo", room: "B-04", students: 22, schedule: "Tue/Thu 10:30" },
    { id: "c3", name: "Grade 7 — Civic Education", teacher: "Grace Tubman", room: "A-03", students: 31, schedule: "Mon/Wed 12:30" },
    { id: "c4", name: "Grade 10 — Biology", teacher: "Ruth Gonpu", room: "Lab-1", students: 26, schedule: "Tue/Thu/Fri 09:00" },
  ];
  d.assignments = [
    { id: "a1", title: "Quadratic Equations — Set 4", class: "Grade 9 — Mathematics", due: "2026-05-27", status: "Open", submissions: 12 },
    { id: "a2", title: "Essay: The Things They Carried", class: "Grade 11 — Literature", due: "2026-05-29", status: "Open", submissions: 8 },
    { id: "a3", title: "Photosynthesis Lab Report", class: "Grade 10 — Biology", due: "2026-05-24", status: "Grading", submissions: 26 },
    { id: "a4", title: "Civic Duty Reflection", class: "Grade 7 — Civic Education", due: "2026-06-02", status: "Open", submissions: 0 },
  ];
  d.grades = [
    { id: "g1", student: "Mariama Doe", subject: "Mathematics", grade: "A-", score: 91, term: "Term 2" },
    { id: "g2", student: "Mariama Doe", subject: "English", grade: "B+", score: 87, term: "Term 2" },
    { id: "g3", student: "Mariama Doe", subject: "Biology", grade: "A", score: 95, term: "Term 2" },
    { id: "g4", student: "Kollie Boima", subject: "Literature", grade: "A", score: 94, term: "Term 2" },
    { id: "g5", student: "Kollie Boima", subject: "Mathematics", grade: "B", score: 82, term: "Term 2" },
    { id: "g6", student: "Fatu Kanneh", subject: "Civics", grade: "A+", score: 98, term: "Term 2" },
  ];
  d.attendance = [
    { id: "at1", date: "2026-05-21", class: "Grade 9 — Mathematics", present: 26, absent: 2, late: 0 },
    { id: "at2", date: "2026-05-21", class: "Grade 11 — Literature", present: 20, absent: 1, late: 1 },
    { id: "at3", date: "2026-05-20", class: "Grade 10 — Biology", present: 25, absent: 0, late: 1 },
    { id: "at4", date: "2026-05-20", class: "Grade 7 — Civic Education", present: 29, absent: 2, late: 0 },
  ];
  d.timetable = [
    { day: "Monday",    slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "10:30", s: "Grade 11 — Literature" }, { t: "12:30", s: "Grade 7 — Civic Education" }] },
    { day: "Tuesday",   slots: [{ t: "09:00", s: "Grade 10 — Biology" }, { t: "11:00", s: "Staff briefing" }] },
    { day: "Wednesday", slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "12:30", s: "Grade 7 — Civic Education" }] },
    { day: "Thursday",  slots: [{ t: "10:30", s: "Grade 11 — Literature" }, { t: "09:00", s: "Grade 10 — Biology" }] },
    { day: "Friday",    slots: [{ t: "08:00", s: "Grade 9 — Mathematics" }, { t: "09:00", s: "Grade 10 — Biology" }, { t: "15:00", s: "Assembly" }] },
  ];
  d.announcements = [
    { id: "an1", title: "Parent-Teacher meeting Friday 4pm", body: "All parents invited to Sinkor auditorium.", audience: "All", date: "2026-05-22" },
    { id: "an2", title: "Library now open until 7pm", body: "Extended hours for exam season.", audience: "Students", date: "2026-05-20" },
    { id: "an3", title: "Vaccination drive complete", body: "All participants reported healthy.", audience: "Parents", date: "2026-05-19" },
    { id: "an4", title: "Donor visit on Tuesday", body: "Staff please prepare classroom showcases.", audience: "Staff", date: "2026-05-18" },
  ];
  d.messages = [
    { id: "m1", from: "Grace Tubman", to: "Samuel Doe", subject: "Mariama's mid-term progress", preview: "I wanted to share some great news…", date: "2026-05-21", unread: true },
    { id: "m2", from: "Admin Office", to: "All Staff", subject: "Payroll cycle update", preview: "Please confirm bank details by Friday.", date: "2026-05-20", unread: true },
    { id: "m3", from: "Patience Kollie", to: "Alumni Network", subject: "Mentor sign-up open", preview: "We have 12 spots remaining.", date: "2026-05-18", unread: false },
  ];
  d.fees = [
    { id: "f1", student: "Mariama Doe", item: "Term 2 Tuition", amount: 320, due: "2026-06-01", status: "Outstanding" },
    { id: "f2", student: "Ezekiel Doe", item: "Term 2 Tuition", amount: 280, due: "2026-06-01", status: "Outstanding" },
    { id: "f3", student: "Mariama Doe", item: "Lab fee", amount: 45, due: "2026-05-15", status: "Paid" },
  ];
  d.children = [
    { id: "ch1", name: "Mariama Doe", grade: "Grade 9 — Blue", attendance: "96%", gpa: 3.7 },
    { id: "ch2", name: "Ezekiel Doe", grade: "Grade 6 — Red", attendance: "92%", gpa: 3.4 },
  ];
  d.events = [
    { id: "e1", title: "Monrovia Alumni Mixer", date: "2026-08-12", location: "Royal Hotel" },
    { id: "e2", title: "Annual Reunion", date: "2026-12-21", location: "Sinkor Campus" },
    { id: "e3", title: "Career Fair", date: "2027-01-14", location: "Sinkor Campus" },
  ];
  d.jobs = [
    { id: "j1", title: "Junior Software Engineer", company: "Liberia Telecoms", location: "Monrovia", posted: "2026-05-12" },
    { id: "j2", title: "Project Coordinator", company: "Liberia Water Trust", location: "Buchanan", posted: "2026-05-10" },
    { id: "j3", title: "Field Nurse", company: "HOPE2 Health", location: "Gbarnga", posted: "2026-05-08" },
  ];
  d.directory = [
    { id: "dir1", name: "Patience Kollie", year: 2019, role: "Software Engineer", city: "Monrovia" },
    { id: "dir2", name: "Moses Weah", year: 2016, role: "Civil Engineer", city: "Buchanan" },
    { id: "dir3", name: "Bendu Sirleaf", year: 2020, role: "Teacher", city: "Gbarnga" },
    { id: "dir4", name: "Prince Karpeh", year: 2018, role: "Public Health Officer", city: "Monrovia" },
  ];
  d.donations = [
    { id: "d1", donor: "Patience Kollie", amount: 250, fund: "Scholarship", date: "2026-05-12" },
    { id: "d2", donor: "Anonymous", amount: 1000, fund: "Capital", date: "2026-05-09" },
    { id: "d3", donor: "Moses Weah", amount: 75, fund: "Library", date: "2026-05-02" },
  ];
  d.pages = [
    { id: "p1", title: "Home", slug: "/", status: "Published", updated: "2026-05-15" },
    { id: "p2", title: "About", slug: "/about", status: "Published", updated: "2026-05-15" },
    { id: "p3", title: "Programs", slug: "/departments", status: "Published", updated: "2026-05-14" },
    { id: "p4", title: "Contact", slug: "/contact", status: "Published", updated: "2026-05-10" },
  ];
  d.posts = [
    { id: "po1", title: "How clean water changed Gbarnga", author: "Editorial", status: "Published", date: "2026-05-10" },
    { id: "po2", title: "Top of class — meet Mariama", author: "Editorial", status: "Draft", date: "2026-05-18" },
    { id: "po3", title: "Volunteer week recap", author: "Editorial", status: "Published", date: "2026-05-04" },
  ];
  d.media = [
    { id: "md1", name: "campus-hero.jpg", type: "image/jpeg", size: "1.2 MB", folder: "Hero" },
    { id: "md2", name: "classroom-7.jpg", type: "image/jpeg", size: "880 KB", folder: "Classrooms" },
    { id: "md3", name: "graduation-2024.mp4", type: "video/mp4", size: "12.4 MB", folder: "Events" },
    { id: "md4", name: "annual-report.pdf", type: "application/pdf", size: "3.1 MB", folder: "Reports" },
    { id: "md5", name: "logo.svg", type: "image/svg+xml", size: "8 KB", folder: "Brand" },
    { id: "md6", name: "water-project.jpg", type: "image/jpeg", size: "1.0 MB", folder: "Projects" },
  ];
  d.departments = [
    { id: "dp1", name: "Education", lead: "Joseph Mensah", staff: 22 },
    { id: "dp2", name: "Health", lead: "Dr. Korto Pelham", staff: 14 },
    { id: "dp3", name: "Water & Sanitation", lead: "Eng. Sundiata Bah", staff: 9 },
    { id: "dp4", name: "Community Development", lead: "Hawa Sherif", staff: 11 },
  ];
  d.audit = [
    { id: "au1", actor: "superadmin@hope2.demo", action: "Updated role for Kollie Boima → student", at: "2026-05-22 09:14" },
    { id: "au2", actor: "admin@hope2.demo",      action: "Published page /departments",            at: "2026-05-21 17:02" },
    { id: "au3", actor: "teacher@hope2.demo",    action: "Submitted grades for Grade 9 Math",      at: "2026-05-21 11:48" },
  ];
  d.resources = [
    { id: "r1", title: "Curriculum Framework 2026", type: "PDF", size: "2.4 MB" },
    { id: "r2", title: "Lesson plan template", type: "DOCX", size: "120 KB" },
    { id: "r3", title: "Classroom management guide", type: "PDF", size: "1.1 MB" },
  ];
  d.library = [
    { id: "lb1", title: "Things Fall Apart", author: "Chinua Achebe", available: 4 },
    { id: "lb2", title: "Half of a Yellow Sun", author: "C. N. Adichie", available: 2 },
    { id: "lb3", title: "A Long Way Gone", author: "Ishmael Beah", available: 6 },
  ];
  d.settings = [
    { id: "s1", key: "Site name", value: "HOPE2-LIBERIA" },
    { id: "s2", key: "Contact email", value: "info@hope2liberia.org" },
    { id: "s3", key: "Primary color", value: "Crimson 600" },
    { id: "s4", key: "Timezone", value: "Africa/Monrovia" },
  ];
  d.__seeded = [true];
  writeData(d);
}

export const mockDb = {
  list<T = any>(col: string): T[] {
    ensureSeedData();
    return (readData()[col] as T[]) ?? [];
  },
};