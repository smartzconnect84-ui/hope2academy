/**
 * Server-side in-memory mock data store.
 * Mirrors the shape of the client-side mock-backend.ts so the API server
 * can serve realistic data without a real database.
 */

export const APP_ROLES = [
  "superadmin", "admin", "admin_assistant", "registrar", "admissions_officer",
  "teacher", "nurse", "student", "parent", "alumni",
] as const;
export type AppRole = (typeof APP_ROLES)[number];

export interface User {
  id: string;
  username: string;
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

const now = new Date().toISOString();

const USERS: User[] = [
  { id: "usr_superadmin", username: "aaliyah@hope2academy", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole",     role: "superadmin", bio: "Director of Programs and Governance.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admin",      username: "joseph@hope2academy", email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah",   role: "admin",      department: "Operations", bio: "Manages campuses and staffing.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_teacher",    username: "grace@hope2academy", email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman",    role: "teacher",    department: "Mathematics", subjects: ["Mathematics","Civics","Literature"], bio: "Lead teacher, Marshall Road Campus.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_student",    username: "mariama@hope2academy", email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe",     role: "student",    grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_parent",     username: "samuel@hope2academy", email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe",      role: "parent",     linked_children: ["Mariama Doe","Ezekiel Doe"], bio: "Father of two HOPE2 students.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_alumni",     username: "patience@hope2academy", email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie", role: "alumni",     graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_assistant",  username: "bendu@hope2academy", email: "assistant@hope2.demo",  password: "demo1234", name: "Bendu Sirleaf",   role: "admin_assistant",    department: "Administration", bio: "Administrative Assistant.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_registrar",  username: "emmanuel@hope2academy", email: "registrar@hope2.demo",  password: "demo1234", name: "Emmanuel Gbaba",  role: "registrar",          department: "Registry", bio: "Registrar.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_nurse",      username: "helen@hope2academy", email: "nurse@hope2.demo",      password: "demo1234", name: "Helen Wortor",    role: "nurse",          department: "Health & Wellness", bio: "School Nurse.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admissions", username: "korto@hope2academy", email: "admissions@hope2.demo", password: "demo1234", name: "Korto Nyanquoi",  role: "admissions_officer", department: "Admissions", bio: "Admission Officer.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
];

type DataShape = Record<string, any[]>;

export const DB: DataShape = {
  users: USERS,

  // Classes — start empty; administrators create live class records
  classes: [],

  // Transactional collections — start empty so real staff enter live data
  assignments: [],
  grades: [],
  attendance: [],
  timetable: [],
  announcements: [],
  fees: [],
  children: [],
  events: [],
  jobs: [],
  directory: [],
  donations: [],
  audit: [],
  resources: [],
  library: [],
  admissions: [],
  exams: [],
  behavior: [],
  lessonplans: [],
  transport: [],
  clinic: [],
  immunizations: [],
  medications: [],
  healthalerts: [],
  medicalscreenings: [],
  calendar: [],
  inventory: [],
  staff: [],
  scholarships: [],
  posts: [],
  media: [],
  leaverequests: [],
  ptmeetings: [],
  counselling: [],
  bookstock: [],
  approvals: [],
  payroll: [],
  expenses: [],
  campaigns: [],
  forms: [],
  messages: [],

  // Structural reference data — always kept
  departments: [
    { id: "dp1", name: "HOPE2 MISSION",  lead: "", staff: 0 },
    { id: "dp2", name: "HOPE2 ACADEMY",  lead: "", staff: 0 },
    { id: "dp3", name: "HOPE2 CHURCH",   lead: "", staff: 0 },
    { id: "dp4", name: "HOPE2 MEDIA",    lead: "", staff: 0 },
  ],

  settings: [
    { id: "s1", key: "Site name",     value: "HOPE2 ACADEMY"        },
    { id: "s2", key: "Contact email", value: "info@hope2academy.org" },
    { id: "s3", key: "Primary color", value: "Crimson 600"           },
    { id: "s4", key: "Timezone",      value: "Africa/Monrovia"       },
  ],

  pages: [
    { id: "p1", title: "Home",     slug: "/",            status: "Published", updated: "2026-05-15" },
    { id: "p2", title: "About",    slug: "/about",       status: "Published", updated: "2026-05-15" },
    { id: "p3", title: "Programs", slug: "/departments", status: "Published", updated: "2026-05-14" },
    { id: "p4", title: "Contact",  slug: "/contact",     status: "Published", updated: "2026-05-10" },
  ],
};

/** Generic CRUD helpers operating on in-memory DB */
export const mockStore = {
  list<T = any>(col: string): T[] {
    return (DB[col] as T[]) ?? [];
  },

  get<T = any>(col: string, id: string): T | null {
    const rows = (DB[col] as any[]) ?? [];
    return (rows.find((r: any) => r.id === id) as T) ?? null;
  },

  create<T extends { id?: string }>(col: string, item: T): T {
    const withId = { ...item, id: item.id ?? `${col}_${Math.random().toString(36).slice(2, 9)}` } as T;
    DB[col] = [withId as any, ...(DB[col] ?? [])];
    return withId;
  },

  update<T extends { id: string }>(col: string, id: string, patch: Partial<T>): T | null {
    const rows = (DB[col] as any[]) ?? [];
    const idx = rows.findIndex((r: any) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch };
    return rows[idx] as T;
  },

  remove(col: string, id: string): boolean {
    const before = (DB[col] ?? []).length;
    DB[col] = ((DB[col] as any[]) ?? []).filter((r: any) => r.id !== id);
    return DB[col].length < before;
  },

  findUserByEmail(email: string): User | null {
    return (DB.users as User[]).find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    ) ?? null;
  },

  findUserByUsername(username: string): User | null {
    return (DB.users as User[]).find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
    ) ?? null;
  },

  findUserById(id: string): User | null {
    return (DB.users as User[]).find((u) => u.id === id) ?? null;
  },

  updateUser(id: string, patch: Partial<User>): User | null {
    return this.update<User & { id: string }>("users", id, patch);
  },
};
