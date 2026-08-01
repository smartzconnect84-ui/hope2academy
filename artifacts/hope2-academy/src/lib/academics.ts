/**
 * academics.ts — shared academic engine for HOPE2 ACADEMY.
 *
 * Covers:
 *  - Grade levels (Nursery → Grade 12) used across the whole system.
 *  - Assignment submissions (student upload / submit, teacher accept + grade).
 *  - Assessments (quiz / test / exam) with automatic grading.
 *  - Marking periods, grade sheet and report card computation.
 *
 * Storage is localStorage-backed so it works with the demo backend, and the
 * shapes stay flat so they can be pushed to the API without changes.
 */
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Grade levels                                                        */
/* ------------------------------------------------------------------ */

/** Every level the academy runs, Nursery through Grade 12. */
export const GRADE_LEVELS = [
  "Nursery", "KG-1", "KG-2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const SUBJECTS = [
  "Mathematics", "English", "Science", "Biology", "Chemistry", "Physics",
  "Social Studies", "Civics", "Literature", "Computer Science",
  "French", "Health Science", "Agriculture", "Bible Studies", "Physical Education",
] as const;

/* ------------------------------------------------------------------ */
/* Marking periods                                                     */
/* ------------------------------------------------------------------ */

export type PeriodKey =
  | "p1" | "p2" | "p3" | "sem1exam"
  | "p4" | "p5" | "p6" | "finalexam";

export const PERIOD_COLUMNS: { key: PeriodKey; label: string }[] = [
  { key: "p1", label: "1st" },
  { key: "p2", label: "2nd" },
  { key: "p3", label: "3rd" },
  { key: "sem1exam", label: "1st Sem Exam" },
  { key: "p4", label: "4th" },
  { key: "p5", label: "5th" },
  { key: "p6", label: "6th" },
  { key: "finalexam", label: "Final Exam" },
];

export type MarkRow = {
  id: string;
  student: string;
  studentId?: string;
  class: string;
  subject: string;
  teacher?: string;
  year: string;
  marks: Partial<Record<PeriodKey, number | null>>;
  updatedAt: string;
};

export interface ReportRow extends MarkRow {
  sem1Ave: number | null;
  sem2Ave: number | null;
  yearlyAve: number | null;
  letter: string;
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return v === null || v === undefined || v === "" || Number.isNaN(n) ? null : n;
};

function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 10) / 10;
}

/** Liberian secondary scale. */
export function letterFor(score: number | null): string {
  if (score === null) return "—";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function computeReport(row: MarkRow): ReportRow {
  const m = row.marks ?? {};
  const sem1Ave = average([num(m.p1), num(m.p2), num(m.p3), num(m.sem1exam)]);
  const sem2Ave = average([num(m.p4), num(m.p5), num(m.p6), num(m.finalexam)]);
  const yearlyAve = average([sem1Ave, sem2Ave]);
  return { ...row, sem1Ave, sem2Ave, yearlyAve, letter: letterFor(yearlyAve) };
}

/* ------------------------------------------------------------------ */
/* Submissions                                                         */
/* ------------------------------------------------------------------ */

export type SubmissionFile = { name: string; size: number; type: string; dataUrl: string };

export type SubmissionStatus = "Draft" | "Submitted" | "Accepted" | "Returned" | "Graded";

export type Submission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  class: string;
  studentId: string;
  student: string;
  note: string;
  files: SubmissionFile[];
  status: SubmissionStatus;
  score: number | null;
  feedback: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* Assessments (quiz / test / exam) with auto-grading                  */
/* ------------------------------------------------------------------ */

export type QuestionType = "mcq" | "tf" | "short";

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: string;
  points: number;
};

export type AssessmentKind = "Quiz" | "Test" | "Exam";

export type Assessment = {
  id: string;
  title: string;
  kind: AssessmentKind;
  subject: string;
  class: string;
  period: PeriodKey;
  year: string;
  published: boolean;
  createdBy: string;
  questions: Question[];
  updatedAt: string;
};

export type Attempt = {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  kind: AssessmentKind;
  subject: string;
  class: string;
  period: PeriodKey;
  studentId: string;
  student: string;
  answers: Record<string, string>;
  score: number;          // percentage 0–100
  earned: number;
  total: number;
  breakdown: { questionId: string; correct: boolean; points: number }[];
  takenAt: string;
};

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Automatic grading — MCQ / true-false exact match, short answer normalised match. */
export function autoGrade(assessment: Assessment, answers: Record<string, string>): {
  earned: number; total: number; score: number;
  breakdown: { questionId: string; correct: boolean; points: number }[];
} {
  let earned = 0;
  let total = 0;
  const breakdown = assessment.questions.map((q) => {
    const pts = Number(q.points) || 1;
    total += pts;
    const given = answers[q.id] ?? "";
    const accepted = q.answer.split("|").map(normalise);
    const correct = given !== "" && accepted.includes(normalise(given));
    if (correct) earned += pts;
    return { questionId: q.id, correct, points: correct ? pts : 0 };
  });
  const score = total > 0 ? Math.round((earned / total) * 1000) / 10 : 0;
  return { earned, total, score, breakdown };
}

/* ------------------------------------------------------------------ */
/* Tiny reactive localStorage collection store                         */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch { return fallback; }
}
function write<T>(key: string, rows: T[]) {
  try { localStorage.setItem(key, JSON.stringify(rows)); } catch { /* quota */ }
  emit();
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

function collection<T extends { id: string }>(key: string, seed: T[] = []) {
  return {
    list(): T[] { return read<T>(key, seed); },
    get(id: string): T | undefined { return read<T>(key, seed).find((r) => r.id === id); },
    create(row: Omit<T, "id"> & { id?: string }): T {
      const created = { ...(row as T), id: row.id ?? uid(key.split(".").pop() ?? "row") };
      write(key, [created, ...read<T>(key, seed)]);
      return created;
    },
    update(id: string, patch: Partial<T>): T | null {
      const rows = read<T>(key, seed);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return null;
      rows[idx] = { ...rows[idx], ...patch };
      write(key, rows);
      return rows[idx];
    },
    remove(id: string) {
      write(key, read<T>(key, seed).filter((r) => r.id !== id));
    },
    replaceAll(rows: T[]) { write(key, rows); },
  };
}

export const submissionsStore = collection<Submission>("h2l.submissions.v1");
export const assessmentsStore = collection<Assessment>("h2l.assessments.v1");
export const attemptsStore = collection<Attempt>("h2l.attempts.v1");
export const marksStore = collection<MarkRow>("h2l.marks.v1");

/** Re-render helper — any component reading these stores stays in sync. */
export function useAcademicsVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const fn = () => setV((x) => x + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return v;
}

/** Push an auto-graded attempt into the grade sheet for its marking period. */
export function postAttemptToMarks(attempt: Attempt, year = String(new Date().getFullYear())) {
  const existing = marksStore.list().find(
    (m) => m.student === attempt.student && m.subject === attempt.subject && m.year === year,
  );
  const score = Math.round(attempt.score);
  if (existing) {
    marksStore.update(existing.id, {
      marks: { ...existing.marks, [attempt.period]: score },
      updatedAt: new Date().toISOString(),
    });
  } else {
    marksStore.create({
      student: attempt.student,
      studentId: attempt.studentId,
      class: attempt.class,
      subject: attempt.subject,
      year,
      marks: { [attempt.period]: score },
      updatedAt: new Date().toISOString(),
    } as Omit<MarkRow, "id">);
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

export function downloadFile(name: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}