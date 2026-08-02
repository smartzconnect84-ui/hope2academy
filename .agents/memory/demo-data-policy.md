---
name: Demo data policy
description: Which data is seeded for demo vs. left empty; filler user removal history.
---

## Policy (as of Aug 2026)

**Keep**: 10 canonical demo login accounts (one per role, all `demo1234`):
superadmin, admin, admin_assistant, registrar, admissions_officer, teacher, nurse, student, parent, alumni.

**Do NOT seed**: Extra filler users (Ruth Gonpu, Kollie Boima, Fatu Kanneh, Moses Weah, Elizabeth Tarr, Amos Flomo, John Kollie) — removed intentionally.

**Do NOT seed**: Any transactional demo records (assignments, grades, attendance, timetable, announcements, fees, children, events, jobs, directory, donations, audit, resources, library, admissions, exams, behavior, lessonplans, transport, clinic, calendar, inventory, staff, scholarships, posts, media). All start empty.

**DO seed** (structural reference data only):
- `departments` — 4 HOPE2 divisions, empty lead/staff
- `settings` — 4 system settings
- `pages` — 4 published site pages

**Why**: User explicitly requested all demo data/stats deleted; only demo login credentials preserved.

## Client-side migration

`USERS_VERSION = "6"` in mock-backend.ts. Migration for v5→v6 drops extra `@hope2.demo` accounts not in `DEMO_CREDENTIALS`, retaining any real (non-@hope2.demo) user-created accounts.
