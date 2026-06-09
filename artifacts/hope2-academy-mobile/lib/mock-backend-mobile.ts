import * as SecureStore from "expo-secure-store";

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

export const ROLE_COLOR: Record<AppRole, string> = {
  superadmin: "#6B2D6B",
  admin: "#C43427",
  teacher: "#2B6B3B",
  student: "#1A5276",
  parent: "#D4A040",
  alumni: "#5B7060",
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
  grade?: string | null;
  class_name?: string | null;
  department?: string | null;
  subjects?: string[] | null;
  graduation_year?: number | null;
  linked_children?: string[] | null;
  createdAt: string;
}

export const DEMO_CREDENTIALS: Array<{ role: AppRole; email: string; password: string; name: string }> = [
  { role: "superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole" },
  { role: "admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah" },
  { role: "teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman" },
  { role: "student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe" },
  { role: "parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe" },
  { role: "alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie" },
];

const SESSION_KEY = "h2l.session";

const now = new Date().toISOString();

const SEED_USERS: MockUser[] = [
  { id: "usr_superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole",    role: "superadmin", bio: "Director of Programs and Governance.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah",   role: "admin",      department: "Operations", bio: "Manages campuses and staffing.", phone: "+231 775 975 544", createdAt: now },
  { id: "usr_teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman",    role: "teacher",    department: "Mathematics", subjects: ["Mathematics","Civics","Literature"], bio: "Lead teacher, Marshall Road Campus.", phone: "+231 775 975 544", createdAt: now },
  { id: "usr_student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe",     role: "student",    grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", phone: "+231 775 975 544", createdAt: now },
  { id: "usr_parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe",      role: "parent",     linked_children: ["Mariama Doe","Ezekiel Doe"], bio: "Father of two HOPE2 students.", phone: "+231 775 975 544", createdAt: now },
  { id: "usr_alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie", role: "alumni",     graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia.", phone: "+231 775 975 544", createdAt: now },
];

const SEED_ANNOUNCEMENTS = [
  { id: "an1", title: "Parent-Teacher meeting Friday 4pm", body: "All parents invited to Marshall Road auditorium.", audience: "All", date: "2026-05-22" },
  { id: "an2", title: "Library now open until 7pm", body: "Extended hours for exam season. Students are encouraged to use the space for revision.", audience: "Students", date: "2026-05-20" },
  { id: "an3", title: "Vaccination drive complete", body: "All participants reported healthy. Thank you for your cooperation.", audience: "Parents", date: "2026-05-19" },
  { id: "an4", title: "Donor visit on Tuesday", body: "Staff please prepare classroom showcases. Dress in uniform.", audience: "Staff", date: "2026-05-18" },
  { id: "an5", title: "Term 2 Mid-term Exams", body: "Exams run from May 28 to June 5. Timetables are posted on the notice board.", audience: "Students", date: "2026-05-16" },
  { id: "an6", title: "Career Fair — January 2027", body: "Alumni are invited to participate as mentors. Registration open now.", audience: "Alumni", date: "2026-05-14" },
];

const SEED_SCHEDULE = [
  { t: "08:00", s: "Grade 9 — Mathematics" },
  { t: "10:00", s: "Grade 7 — Civic Education" },
  { t: "12:30", s: "Grade 9 — Literature" },
  { t: "14:00", s: "Staff briefing" },
];

const SEED_GRADES = [
  { course: "Mathematics", grade: "A-" },
  { course: "English", grade: "B+" },
  { course: "Science", grade: "A" },
  { course: "Civics", grade: "A" },
];

const SEED_CHILDREN = [
  { id: "ch1", name: "Mariama Doe", grade: "Grade 9 — Blue", attendance: "96%", gpa: 3.7 },
  { id: "ch2", name: "Ezekiel Doe", grade: "Grade 6 — Red", attendance: "92%", gpa: 3.4 },
];

const SEED_EVENTS = [
  { id: "e1", title: "Monrovia Alumni Mixer", date: "2026-08-12", location: "Royal Hotel" },
  { id: "e2", title: "Annual Reunion", date: "2026-12-21", location: "Marshall Road Campus" },
  { id: "e3", title: "Career Fair", date: "2027-01-14", location: "Marshall Road Campus" },
];

const SEED_JOBS = [
  { id: "j1", title: "Junior Software Engineer", company: "Liberia Telecoms", location: "Monrovia" },
  { id: "j2", title: "Project Coordinator", company: "Liberia Water Trust", location: "Buchanan" },
  { id: "j3", title: "Field Nurse", company: "HOPE2 Health", location: "Gbarnga" },
];

export const mockDb = {
  getAnnouncements() { return SEED_ANNOUNCEMENTS; },
  getSchedule() { return SEED_SCHEDULE; },
  getGrades() { return SEED_GRADES; },
  getChildren() { return SEED_CHILDREN; },
  getEvents() { return SEED_EVENTS; },
  getJobs() { return SEED_JOBS; },
};

async function getSessionUserId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

async function setSessionUserId(id: string | null) {
  try {
    if (id) {
      await SecureStore.setItemAsync(SESSION_KEY, id);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch {}
}

export const mockAuth = {
  async signIn(email: string, password: string): Promise<MockUser> {
    const u = SEED_USERS.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    await setSessionUserId(u.id);
    return u;
  },

  async getCurrent(): Promise<MockUser | null> {
    const id = await getSessionUserId();
    if (!id) return null;
    return SEED_USERS.find(x => x.id === id) ?? null;
  },

  async signOut(): Promise<void> {
    await setSessionUserId(null);
  },
};
