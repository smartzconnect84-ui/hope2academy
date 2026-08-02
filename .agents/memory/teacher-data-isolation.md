---
name: Teacher data isolation
description: How per-teacher data isolation is implemented in mock-backend.ts and rbac.ts
---

## Rule
All operational teacher records (assignments, grades, attendance, timetable, lessonplans, exams) MUST have a `teacher` field set to the teacher's full name. The `reporter` field on behavior records also serves as ownership.

**Why:** scopeRows for the teacher role uses strict OWNER_FIELDS ownership. Records with a `teacher` / `reporter` / `createdBy` field are filtered to only match the signed-in teacher. Records WITHOUT any owner field fall through to an empty result for teachers (no `!hasOwner` fallback).

**How to apply:** When creating new seed records for teacher-owned collections, always include `teacher: "Teacher Full Name"`. When the teacher creates a record via the portal, `stampOwner` attaches `createdBy` automatically.

## Teacher reference tables (TEACHER_GLOBAL_READ)
Collections where teachers see ALL records (reference/lookup data):
`staff, directory, scholarships, admissions, transport, inventory, fees, bookstock, departments, team, counselling, ptmeetings`

## Public broadcast collections (PUBLIC_TO_ALL for non-teachers, TEACHER_PUBLIC for teachers)
`announcements, calendar, events, library, resources, jobs, posts` — visible to all roles in full.
`timetable` — in PUBLIC_TO_ALL for non-teacher roles; teachers see ONLY their own timetable records via ownership.

## Student grade-prefix matching
Students see class-level records (assignments, exams, attendance) where:
- `r.class === "Grade {student.grade}"` (exact prefix match), OR
- `r.class.startsWith("Grade {student.grade}")` (e.g. "Grade 9 — Mathematics")

Student profile has `grade: "9"` (number string). Assignments use `class: "Grade 9"` format (NOT "Grade 9 — Blue" or "Grade 9 — Mathematics" with the subject suffix from old format).

## Migration v6
Existing browsers get teacher fields stamped onto old records via `__migrated_v6` flag in localStorage data. Safe to re-run (uses `?? map[id]` pattern).

## Teachers in demo
- Grace Tubman (teacher@hope2.demo): Mathematics, Civics — Grades 7, 9, 12
- Ruth Gonpu (ruth.gonpu@hope2.demo): Biology, Chemistry — Grades 10, 11
- Amos Flomo (amos.flomo@hope2.demo): Literature, History — Grades 8, 11
- John Kollie (john.kollie@hope2.demo): Physics, Geography — Grades 10, 12 (new)
