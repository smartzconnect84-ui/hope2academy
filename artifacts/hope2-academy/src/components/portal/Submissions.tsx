/**
 * Assignment submissions.
 * Students: upload files, save draft, submit, edit before review, delete, download.
 * Teachers/Admins: review, download, grade, accept or return submissions.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Download, Trash2, Send, CheckCircle2, RotateCcw, Search, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { mockDb } from "@/lib/mock-backend";
import {
  submissionsStore, useAcademicsVersion,
  type Submission, type SubmissionFile,
} from "@/lib/academics";
import { apiClient } from "@/lib/api-client";

type AssignmentRow = { id: string; title: string; class: string; due: string; status: string };

const STATUS_TONE: Record<string, string> = {
  Draft: "bg-muted text-foreground/70",
  Submitted: "bg-accent/30 text-accent-foreground",
  Accepted: "bg-emerald-500/15 text-emerald-700",
  Graded: "bg-primary/10 text-primary",
  Returned: "bg-destructive/10 text-destructive",
};
const badge = (s: string) => (
  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_TONE[s] ?? "bg-muted"}`}>{s}</span>
);

export function SubmissionsModule() {
  useAcademicsVersion();
  const { profile, primaryRole } = useAuth();
  const isStudent = primaryRole === "student";
  const me = profile?.full_name ?? profile?.name ?? "";
  const myId = profile?.$id ?? profile?.id ?? "";

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Submission | null>(null);
  const [creating, setCreating] = useState(false);
  const [reviewing, setReviewing] = useState<Submission | null>(null);

  const assignments = mockDb.list<AssignmentRow>("assignments");
  const all = submissionsStore.list();

  const rows = useMemo(() => {
    const scoped = isStudent ? all.filter((s) => s.studentId === myId || s.student === me) : all;
    const term = q.toLowerCase();
    return scoped.filter((s) => !term || `${s.assignmentTitle} ${s.student} ${s.class}`.toLowerCase().includes(term));
  }, [all, isStudent, myId, me, q]);

  const remove = (s: Submission) => {
    if (isStudent && s.status !== "Draft" && s.status !== "Returned") {
      toast.error("Submitted work can no longer be deleted");
      return;
    }
    if (!confirm("Delete this submission?")) return;
    submissionsStore.remove(s.id);
    toast.success("Submission deleted");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search submissions…" className="pl-9 bg-card" />
        </div>
        {isStudent && (
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Upload className="h-4 w-4" /> New submission
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {isStudent ? "No submissions yet — upload your work to get started." : "No student submissions yet."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">{s.assignmentTitle}</p>
                  <p className="text-sm text-muted-foreground">{s.class}{isStudent ? "" : ` · ${s.student}`}</p>
                </div>
                {badge(s.status)}
              </div>
              {s.note && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.note}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {s.files.map((f) => (
                  <Button key={f.name} size="sm" variant="outline" className="gap-1.5"
                     onClick={() => window.open(f.url, "_blank", "noopener,noreferrer")}>
                    <Download className="h-3.5 w-3.5" />{f.name}
                  </Button>
                ))}
                {s.files.length === 0 && <span className="text-xs text-muted-foreground">No files attached</span>}
              </div>
              {s.score !== null && (
                <p className="mt-3 text-sm">
                  <span className="font-display text-xl font-bold text-primary">{s.score}%</span>
                  {s.feedback && <span className="ml-2 text-muted-foreground">{s.feedback}</span>}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isStudent ? (
                  <>
                    <Button size="sm" variant="outline"
                      disabled={s.status !== "Draft" && s.status !== "Returned"}
                      onClick={() => setEditing(s)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" className="gap-1.5" onClick={() => setReviewing(s)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Review & grade
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {s.submittedAt ? `Submitted ${new Date(s.submittedAt).toLocaleDateString()}` : "Not submitted"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SubmissionEditor
          row={editing}
          assignments={assignments}
          student={me}
          studentId={myId}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
      {reviewing && (
        <ReviewDialog row={reviewing} reviewer={me} onClose={() => setReviewing(null)} />
      )}
    </>
  );
}

function SubmissionEditor({
  row, assignments, student, studentId, onClose,
}: {
  row: Submission | null;
  assignments: AssignmentRow[];
  student: string;
  studentId: string;
  onClose: () => void;
}) {
  const [assignmentId, setAssignmentId] = useState(row?.assignmentId ?? assignments[0]?.id ?? "");
  const [note, setNote] = useState(row?.note ?? "");
  const [files, setFiles] = useState<SubmissionFile[]>(row?.files ?? []);
  const [busy, setBusy] = useState(false);

  const upload = async (list: FileList | null) => {
    if (!list) return;
    const next: SubmissionFile[] = [];
    for (const f of Array.from(list)) {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is larger than 5 MB`); continue; }
       try {
         const uploaded = await apiClient.uploadFile(f);
         next.push({ name: uploaded.name, size: uploaded.size, type: uploaded.type, url: uploaded.url });
       } catch (error: any) {
         toast.error(error?.message ?? `Could not upload ${f.name}`);
       }
    }
    setFiles((prev) => [...prev, ...next]);
  };

  const persist = (status: "Draft" | "Submitted") => {
    const chosen = assignments.find((a) => a.id === assignmentId);
    if (!chosen) { toast.error("Choose an assignment"); return; }
    setBusy(true);
    const base = {
      assignmentId: chosen.id,
      assignmentTitle: chosen.title,
      class: chosen.class,
      studentId,
      student,
      note,
      files,
      status,
      submittedAt: status === "Submitted" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    if (row) submissionsStore.update(row.id, base);
    else submissionsStore.create({ ...base, score: null, feedback: "", reviewedAt: null, reviewedBy: null } as Omit<Submission, "id">);
    toast.success(status === "Submitted" ? "Submitted to your teacher" : "Draft saved");
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row ? "Edit submission" : "New submission"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Assignment</Label>
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger><SelectValue placeholder="Select an assignment" /></SelectTrigger>
              <SelectContent>
                {assignments.map((a) => <SelectItem key={a.id} value={a.id}>{a.title} — {a.class}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes for your teacher</Label>
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <Label>Attachments</Label>
            <input id="sub-files" type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            <label htmlFor="sub-files">
              <Button asChild variant="outline" className="gap-2 mt-1">
                <span><Paperclip className="h-4 w-4" /> Upload files</span>
              </Button>
            </label>
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="truncate">{f.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setFiles(files.filter((_, x) => x !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="secondary" onClick={() => persist("Draft")} disabled={busy}>Save draft</Button>
          <Button className="gap-2" onClick={() => persist("Submitted")} disabled={busy}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ row, reviewer, onClose }: { row: Submission; reviewer: string; onClose: () => void }) {
  const [score, setScore] = useState<string>(row.score !== null ? String(row.score) : "");
  const [feedback, setFeedback] = useState(row.feedback ?? "");

  const decide = (status: "Accepted" | "Graded" | "Returned") => {
    submissionsStore.update(row.id, {
      status,
      score: score === "" ? null : Number(score),
      feedback,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Submission ${status.toLowerCase()}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{row.assignmentTitle}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{row.student} · {row.class}</p>
          {row.note && <p className="rounded-lg bg-muted/50 p-3 text-sm">{row.note}</p>}
          <div className="flex flex-wrap gap-2">
            {row.files.map((f) => (
              <Button key={f.name} size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(f.url, "_blank", "noopener,noreferrer")}>
                <Download className="h-3.5 w-3.5" />{f.name}
              </Button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Score (0–100)</Label><Input type="number" value={score} onChange={(e) => setScore(e.target.value)} /></div>
            <div className="flex items-end"><Badge variant="secondary" className="h-9 px-3 grid place-items-center">{row.status}</Badge></div>
          </div>
          <div><Label>Feedback</Label><Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="gap-2" onClick={() => decide("Returned")}>
            <RotateCcw className="h-4 w-4" /> Return for revision
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => decide("Accepted")}>
            <CheckCircle2 className="h-4 w-4" /> Accept
          </Button>
          <Button onClick={() => decide("Graded")}>Save grade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}