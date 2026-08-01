/**
 * Quizzes, tests and exams with automatic grading.
 * Teachers/Admins build question banks; students take them and are graded
 * instantly, with the result posted to the grade sheet for that period.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Search, Play, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  assessmentsStore, attemptsStore, autoGrade, postAttemptToMarks, useAcademicsVersion,
  GRADE_LEVELS, SUBJECTS, PERIOD_COLUMNS, letterFor,
  type Assessment, type Question, type AssessmentKind, type PeriodKey,
} from "@/lib/academics";

const KINDS: AssessmentKind[] = ["Quiz", "Test", "Exam"];
const uid = () => `q_${Math.random().toString(36).slice(2, 9)}`;
const YEAR = String(new Date().getFullYear());

export function AssessmentsModule() {
  useAcademicsVersion();
  const { profile, primaryRole } = useAuth();
  const isStudent = primaryRole === "student";
  const me = profile?.full_name ?? profile?.name ?? "";
  const myId = profile?.$id ?? profile?.id ?? "";

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [creating, setCreating] = useState(false);
  const [taking, setTaking] = useState<Assessment | null>(null);

  const all = assessmentsStore.list();
  const attempts = attemptsStore.list();

  const rows = useMemo(() => {
    const visible = isStudent ? all.filter((a) => a.published) : all;
    const term = q.toLowerCase();
    return visible.filter((a) => !term || `${a.title} ${a.subject} ${a.class}`.toLowerCase().includes(term));
  }, [all, isStudent, q]);

  const myAttempt = (id: string) => attempts.find((t) => t.assessmentId === id && (t.studentId === myId || t.student === me));

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search quizzes, tests and exams…" className="pl-9 bg-card" />
        </div>
        {!isStudent && (
          <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New assessment</Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No assessments yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => {
            const attempt = myAttempt(a.id);
            const taken = attempts.filter((t) => t.assessmentId === a.id);
            const avg = taken.length ? Math.round(taken.reduce((s, t) => s + t.score, 0) / taken.length) : null;
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.subject} · {a.class}</p>
                  </div>
                  <Badge variant="secondary">{a.kind}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.questions.length} question{a.questions.length === 1 ? "" : "s"} ·{" "}
                  {PERIOD_COLUMNS.find((p) => p.key === a.period)?.label ?? "—"} · {a.published ? "Published" : "Draft"}
                </p>
                {isStudent ? (
                  <div className="mt-4">
                    {attempt ? (
                      <p className="text-sm">
                        <span className="font-display text-2xl font-bold text-primary">{attempt.score}%</span>
                        <span className="ml-2 text-muted-foreground">Grade {letterFor(attempt.score)}</span>
                      </p>
                    ) : (
                      <Button className="gap-2" onClick={() => setTaking(a)}><Play className="h-4 w-4" /> Start</Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(a)}>
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm(`Delete "${a.title}"?`)) { assessmentsStore.remove(a.id); toast.success("Assessment deleted"); }
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {taken.length} taken{avg !== null ? ` · avg ${avg}%` : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <AssessmentEditor row={editing} author={me} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
      {taking && (
        <TakeAssessment assessment={taking} student={me} studentId={myId} onClose={() => setTaking(null)} />
      )}
    </>
  );
}

function AssessmentEditor({ row, author, onClose }: { row: Assessment | null; author: string; onClose: () => void }) {
  const [form, setForm] = useState<Assessment>(row ?? {
    id: "", title: "", kind: "Quiz", subject: SUBJECTS[0], class: GRADE_LEVELS[3],
    period: "p1", year: YEAR, published: false, createdBy: author, questions: [], updatedAt: "",
  });

  const setQuestion = (id: string, patch: Partial<Question>) =>
    setForm({ ...form, questions: form.questions.map((qq) => (qq.id === id ? { ...qq, ...patch } : qq)) });

  const addQuestion = () =>
    setForm({
      ...form,
      questions: [...form.questions, { id: uid(), type: "mcq", prompt: "", options: ["", "", "", ""], answer: "", points: 1 }],
    });

  const save = (published: boolean) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (published && form.questions.length === 0) { toast.error("Add at least one question before publishing"); return; }
    const data = { ...form, published, createdBy: author, updatedAt: new Date().toISOString() };
    if (row) assessmentsStore.update(row.id, data);
    else assessmentsStore.create(data as Omit<Assessment, "id">);
    toast.success(published ? "Assessment published" : "Draft saved");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row ? "Edit assessment" : "New assessment"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as AssessmentKind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marking period</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as PeriodKey })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PERIOD_COLUMNS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Questions (auto-graded)</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={addQuestion}><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
            {form.questions.map((qq, i) => (
              <div key={qq.id} className="rounded-lg bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Question {i + 1}</span>
                  <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, questions: form.questions.filter((x) => x.id !== qq.id) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Textarea rows={2} placeholder="Question prompt" value={qq.prompt} onChange={(e) => setQuestion(qq.id, { prompt: e.target.value })} />
                <div className="grid sm:grid-cols-3 gap-2">
                  <Select value={qq.type} onValueChange={(v) => setQuestion(qq.id, { type: v as Question["type"], answer: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple choice</SelectItem>
                      <SelectItem value="tf">True / False</SelectItem>
                      <SelectItem value="short">Short answer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={1} value={qq.points} onChange={(e) => setQuestion(qq.id, { points: Number(e.target.value) || 1 })} placeholder="Points" />
                  {qq.type === "tf" ? (
                    <Select value={qq.answer || "True"} onValueChange={(v) => setQuestion(qq.id, { answer: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="True">True</SelectItem><SelectItem value="False">False</SelectItem></SelectContent>
                    </Select>
                  ) : (
                    <Input value={qq.answer} onChange={(e) => setQuestion(qq.id, { answer: e.target.value })} placeholder="Correct answer" />
                  )}
                </div>
                {qq.type === "mcq" && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {qq.options.map((opt, oi) => (
                      <Input key={oi} value={opt} placeholder={`Option ${oi + 1}`}
                        onChange={(e) => setQuestion(qq.id, { options: qq.options.map((o, x) => (x === oi ? e.target.value : o)) })} />
                    ))}
                  </div>
                )}
                {qq.type === "short" && (
                  <p className="text-[11px] text-muted-foreground">Separate accepted answers with “|”.</p>
                )}
              </div>
            ))}
            {form.questions.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => save(false)}>Save draft</Button>
          <Button onClick={() => save(true)}>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TakeAssessment({
  assessment, student, studentId, onClose,
}: { assessment: Assessment; student: string; studentId: string; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; earned: number; total: number } | null>(null);

  const submit = () => {
    const graded = autoGrade(assessment, answers);
    const attempt = attemptsStore.create({
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      kind: assessment.kind,
      subject: assessment.subject,
      class: assessment.class,
      period: assessment.period,
      studentId,
      student,
      answers,
      score: graded.score,
      earned: graded.earned,
      total: graded.total,
      breakdown: graded.breakdown,
      takenAt: new Date().toISOString(),
    } as any);
    postAttemptToMarks(attempt, assessment.year || YEAR);
    setResult({ score: graded.score, earned: graded.earned, total: graded.total });
    toast.success("Graded automatically");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{assessment.title}</DialogTitle></DialogHeader>
        {result ? (
          <div className="py-8 text-center">
            <Award className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 font-display text-4xl font-bold text-primary">{result.score}%</p>
            <p className="mt-1 text-muted-foreground">
              {result.earned} of {result.total} points · Grade {letterFor(result.score)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Your score has been posted to your grade sheet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessment.questions.map((qq, i) => (
              <div key={qq.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{i + 1}. {qq.prompt} <span className="text-xs text-muted-foreground">({qq.points} pt)</span></p>
                <div className="mt-2">
                  {qq.type === "mcq" && (
                    <div className="grid gap-2">
                      {qq.options.filter(Boolean).map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name={qq.id} checked={answers[qq.id] === opt}
                            onChange={() => setAnswers({ ...answers, [qq.id]: opt })} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {qq.type === "tf" && (
                    <div className="flex gap-4">
                      {["True", "False"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name={qq.id} checked={answers[qq.id] === opt}
                            onChange={() => setAnswers({ ...answers, [qq.id]: opt })} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                  {qq.type === "short" && (
                    <Input value={answers[qq.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [qq.id]: e.target.value })} placeholder="Your answer" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          {result ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button className="gap-2" onClick={submit}><CheckCircle2 className="h-4 w-4" /> Submit for grading</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}