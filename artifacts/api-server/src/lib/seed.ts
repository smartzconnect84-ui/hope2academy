/**
 * Seeds the database with initial demo data if tables are empty.
 * Called once at server startup. Safe to call multiple times (idempotent).
 */
import { db } from "@workspace/db";
import { usersTable, itemsTable } from "@workspace/db/schema";
import { dbStore } from "./db-store.js";
import { sql } from "drizzle-orm";

const now = new Date().toISOString();

const SEED_USERS = [
  { id: "usr_superadmin", email: "superadmin@hope2.demo", password: "demo1234", name: "Aaliyah Cole",     role: "superadmin" as const, bio: "Director of Programs and Governance.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admin",      email: "admin@hope2.demo",      password: "demo1234", name: "Joseph Mensah",   role: "admin" as const,      department: "Operations", bio: "Manages campuses and staffing.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_teacher",    email: "teacher@hope2.demo",    password: "demo1234", name: "Grace Tubman",    role: "teacher" as const,    department: "Mathematics", subjects: ["Mathematics","Civics","Literature"], bio: "Lead teacher, Marshall Road Campus.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_student",    email: "student@hope2.demo",    password: "demo1234", name: "Mariama Doe",     role: "student" as const,    grade: "9", class_name: "Grade 9 — Blue", bio: "Aspiring engineer.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_parent",     email: "parent@hope2.demo",     password: "demo1234", name: "Samuel Doe",      role: "parent" as const,     linked_children: ["Mariama Doe","Ezekiel Doe"], bio: "Father of two HOPE2 students.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_alumni",     email: "alumni@hope2.demo",     password: "demo1234", name: "Patience Kollie", role: "alumni" as const,     graduation_year: 2019, bio: "Class of 2019. Software engineer in Monrovia.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_assistant",  email: "assistant@hope2.demo",  password: "demo1234", name: "Bendu Sirleaf",   role: "admin_assistant" as const,    department: "Administration", bio: "Administrative Assistant.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_registrar",  email: "registrar@hope2.demo",  password: "demo1234", name: "Emmanuel Gbaba",  role: "registrar" as const,          department: "Registry", bio: "Registrar.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_nurse",      email: "nurse@hope2.demo",      password: "demo1234", name: "Helen Wortor",    role: "nurse" as const,          department: "Health & Wellness", bio: "School Nurse.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
  { id: "usr_admissions", email: "admissions@hope2.demo", password: "demo1234", name: "Korto Nyanquoi",  role: "admissions_officer" as const, department: "Admissions", bio: "Admission Officer.", phone: "+231 775 975 544", address: "Marshall Road, Liberia", createdAt: now },
];

// Structural reference data only — departments, settings, pages.
// All transactional collections start empty so real staff enter live data.
const SEED_ITEMS: Array<{ collection: string; id: string; data: Record<string, any> }> = [
  // departments
  { collection: "departments", id: "dp1", data: { id: "dp1", name: "HOPE2 MISSION",  lead: "", staff: 0 } },
  { collection: "departments", id: "dp2", data: { id: "dp2", name: "HOPE2 ACADEMY",  lead: "", staff: 0 } },
  { collection: "departments", id: "dp3", data: { id: "dp3", name: "HOPE2 CHURCH",   lead: "", staff: 0 } },
  { collection: "departments", id: "dp4", data: { id: "dp4", name: "HOPE2 MEDIA",    lead: "", staff: 0 } },
  // settings
  { collection: "settings", id: "s1", data: { id: "s1", key: "Site name",     value: "HOPE2 ACADEMY"        } },
  { collection: "settings", id: "s2", data: { id: "s2", key: "Contact email", value: "info@hope2academy.org" } },
  { collection: "settings", id: "s3", data: { id: "s3", key: "Primary color", value: "Crimson 600"           } },
  { collection: "settings", id: "s4", data: { id: "s4", key: "Timezone",      value: "Africa/Monrovia"       } },
  // pages
  { collection: "pages", id: "p1", data: { id: "p1", title: "Home",     slug: "/",            status: "Published", updated: "2026-05-15" } },
  { collection: "pages", id: "p2", data: { id: "p2", title: "About",    slug: "/about",       status: "Published", updated: "2026-05-15" } },
  { collection: "pages", id: "p3", data: { id: "p3", title: "Programs", slug: "/departments", status: "Published", updated: "2026-05-14" } },
  { collection: "pages", id: "p4", data: { id: "p4", title: "Contact",  slug: "/contact",     status: "Published", updated: "2026-05-10" } },
];

export async function seedIfEmpty() {
  const userCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(usersTable);
  const count = parseInt(userCount[0]?.count ?? "0", 10);
  if (count > 0) {
    console.log(`[seed] Database already has ${count} users — skipping seed.`);
    await ensureDemoUsers();
    return;
  }

  console.log("[seed] Seeding database with demo data…");

  for (const u of SEED_USERS) {
    await dbStore.createUser(u as any);
  }

  for (const item of SEED_ITEMS) {
    await db.insert(itemsTable).values({
      collection: item.collection,
      id: item.id,
      data: item.data,
    });
  }

  console.log(`[seed] Done. Inserted ${SEED_USERS.length} users and ${SEED_ITEMS.length} items.`);
}

/** Inserts any demo accounts that are missing (e.g. roles added after first seed). */
export async function ensureDemoUsers() {
  for (const u of SEED_USERS) {
    const existing = await dbStore.findUserByEmail(u.email);
    if (!existing) {
      await dbStore.createUser(u as any);
      console.log(`[seed] Added missing demo user ${u.email}`);
    }
  }
}
