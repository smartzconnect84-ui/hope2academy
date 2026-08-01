/**
 * Grade sheet + printable report card.
 * Columns: 1st, 2nd, 3rd, 1st Sem Exam, 1st Sem Ave, 4th, 5th, 6th,
 * Final Exam, 2nd Sem Ave, Yearly Ave.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Search, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  marksStore, useAcademicsVersion, computeReport, letterFor,
  GRADE_LEVELS, SUBJECTS, PERIOD_COLUMNS,
  type MarkRow, type PeriodKey,
} from "@/lib/academics";

const YEAR = String(new Date().getFullYear());
const HEAD = [
  "Student", "Subject", "1st", "2nd", "3rd", "1st Sem Exam", "1st Sem Ave",
  "4th", "5th", "6th", "Final Exam", "2nd Sem Ave", "Yearly Ave", "Grade",
];

const cell = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v);

function useScopedMarks() {
  useAcademicsVersion();
  const { profile, primaryRole } = useAuth();
  const me = profile?.full_name ?? profile?.name ?? "";
  const children = profile?.linked_children ?? [];
  const rows = marksStore.list().map(computeReport);
  if (primaryRole === "student" || primaryRole === "alumni") return rows.filter((r) => r.student === me);
  if (primaryRole === "parent") return rows.filter((r) => children.includes(r.student) || children.includes(r.studentId ?? ""));
  return rows;
}

export function GradeSheetModule() {
  const rows = useScopedMarks();
  const { primaryRole } = useAuth();
  const canEdit = primaryRole !== "student" && primaryRole !== "parent" && primaryRole !== "alumni";
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<MarkRow | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return rows.filter((r) => !term || `${r.student} ${r.subject} ${r.class}`.toLowerCase().includes(term));
  }, [rows, q]);

  const exportCsv = () => {
    const lines = [HEAD.join(",")].concat(filtered.map((r) => [
      r.student, r.subject, cell(r.marks.p1), cell(r.marks.p2), cell(r.marks.p3), cell(r.marks.sem1exam),
      cell(r.sem1Ave), cell(r.marks.p4), cell(r.marks.p5), cell(r.marks.p6), cell(r.marks.finalexam),
      cell(r.sem2Ave), cell(r.yearlyAve), r.letter,
    ].join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "grade-sheet.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student or subject…" className="pl-9 bg-card" />
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv}><Download className="h-4 w-4" /> Download CSV</Button>
        {canEdit && <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New record</Button>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{[...HEAD, ...(canEdit ? [""] : [])].map((h) => <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-3 font-medium whitespace-nowrap">{r.student}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.subject}</td>
                <td className="px-3 py-3">{cell(r.marks.p1)}</td>
                <td className="px-3 py-3">{cell(r.marks.p2)}</td>
                <td className="px-3 py-3">{cell(r.marks.p3)}</td>
                <td className="px-3 py-3">{cell(r.marks.sem1exam)}</td>
                <td className="px-3 py-3 font-semibold text-primary">{cell(r.sem1Ave)}</td>
                <td className="px-3 py-3">{cell(r.marks.p4)}</td>
                <td className="px-3 py-3">{cell(r.marks.p5)}</td>
                <td className="px-3 py-3">{cell(r.marks.p6)}</td>
                <td className="px-3 py-3">{cell(r.marks.finalexam)}</td>
                <td className="px-3 py-3 font-semibold text-primary">{cell(r.sem2Ave)}</td>
                <td className="px-3 py-3 font-display font-bold">{cell(r.yearlyAve)}</td>
                <td className="px-3 py-3 font-display font-bold text-primary">{r.letter}</td>
                {canEdit && (
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)}><Edit3 className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this record?")) { marksStore.remove(r.id); toast.success("Record deleted"); } }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={HEAD.length + 1} className="px-3 py-10 text-center text-muted-foreground">No grade records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && <MarkEditor row={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </>
  );
}

function MarkEditor({ row, onClose }: { row: MarkRow | null; onClose: () => void }) {
  const [form, setForm] = useState<MarkRow>(row ?? {
    id: "", student: "", class: GRADE_LEVELS[3], subject: SUBJECTS[0], year: YEAR, marks: {}, updatedAt: "",
  });

  const setMark = (k: PeriodKey, v: string) =>
    setForm({ ...form, marks: { ...form.marks, [k]: v === "" ? null : Number(v) } });

  const save = () => {
    if (!form.student.trim()) { toast.error("Student name is required"); return; }
    const data = { ...form, updatedAt: new Date().toISOString() };
    if (row) marksStore.update(row.id, data);
    else marksStore.create(data as Omit<MarkRow, "id">);
    toast.success("Grade record saved");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{row ? "Edit grade record" : "New grade record"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label>Student</Label><Input value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} /></div>
            <div>
              <Label>Class</Label>
              <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            {PERIOD_COLUMNS.map((p) => (
              <div key={p.key}>
                <Label>{p.label}</Label>
                <Input type="number" min={0} max={100}
                  value={form.marks[p.key] ?? ""}
                  onChange={(e) => setMark(p.key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReportCardModule() {
  const rows = useScopedMarks();
  const students = Array.from(new Set(rows.map((r) => r.student))).sort();
  const [student, setStudent] = useState(students[0] ?? "");
  const active = students.includes(student) ? student : students[0] ?? "";
  const mine = rows.filter((r) => r.student === active);
  const overall = mine.length
    ? Math.round((mine.reduce((s, r) => s + (r.yearlyAve ?? 0), 0) / mine.filter((r) => r.yearlyAve !== null).length || 0) * 10) / 10
    : null;

  if (students.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No report card data yet.</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 print:hidden">
        <Select value={active} onValueChange={setStudent}>
          <SelectTrigger className="sm:w-72 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{students.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 sm:ml-auto" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / PDF
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold">HOPE2 ACADEMY</h2>
          <p className="text-sm text-muted-foreground">Barber's Joe Town, Marshall Road, Lower Margibi County, Liberia</p>
          <p className="mt-2 font-semibold">Student Report Card</p>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-2 text-sm">
          <p><span className="text-muted-foreground">Student:</span> <span className="font-medium">{active}</span></p>
          <p><span className="text-muted-foreground">Class:</span> <span className="font-medium">{mine[0]?.class ?? "—"}</span></p>
          <p><span className="text-muted-foreground">Academic year:</span> <span className="font-medium">{mine[0]?.year ?? YEAR}</span></p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>{["Subject", "1st", "2nd", "3rd", "1st Sem Exam", "1st Sem Ave", "4th", "5th", "6th", "Final Exam", "2nd Sem Ave", "Yearly Ave", "Grade"]
                .map((h) => <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{r.subject}</td>
                  <td className="px-2 py-2">{cell(r.marks.p1)}</td>
                  <td className="px-2 py-2">{cell(r.marks.p2)}</td>
                  <td className="px-2 py-2">{cell(r.marks.p3)}</td>
                  <td className="px-2 py-2">{cell(r.marks.sem1exam)}</td>
                  <td className="px-2 py-2 font-semibold text-primary">{cell(r.sem1Ave)}</td>
                  <td className="px-2 py-2">{cell(r.marks.p4)}</td>
                  <td className="px-2 py-2">{cell(r.marks.p5)}</td>
                  <td className="px-2 py-2">{cell(r.marks.p6)}</td>
                  <td className="px-2 py-2">{cell(r.marks.finalexam)}</td>
                  <td className="px-2 py-2 font-semibold text-primary">{cell(r.sem2Ave)}</td>
                  <td className="px-2 py-2 font-display font-bold">{cell(r.yearlyAve)}</td>
                  <td className="px-2 py-2 font-display font-bold text-primary">{r.letter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-sm">
          <p><span className="text-muted-foreground">Overall yearly average:</span>{" "}
            <span className="font-display text-xl font-bold text-primary">{overall ?? "—"}</span>
            {overall !== null && <span className="ml-2">Grade {letterFor(overall)}</span>}
          </p>
          <p className="text-muted-foreground">Grading: A 90–100 · B 80–89 · C 70–79 · D 60–69 · F below 60</p>
        </div>
      </div>
    </>
  );
}