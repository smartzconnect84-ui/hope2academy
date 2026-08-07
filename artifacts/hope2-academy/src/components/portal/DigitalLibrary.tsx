/**
 * CK-12 Digital Library — subject-categorised book cards with reading,
 * bookmarking, progress tracking and catalog management for staff.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search, BookOpen, Bookmark, BookmarkCheck, ExternalLink, Plus, Edit3,
  Trash2, RotateCcw, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { canWrite } from "@/lib/rbac";
import {
  ck12Store, useCk12, CK12_SUBJECTS, GRADE_LEVELS, SUBJECT_TONE,
  type Ck12Book, type Ck12Subject,
} from "@/lib/ck12-library";

function Cover({ book }: { book: Ck12Book }) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={`${book.title} cover`}
        loading="lazy"
        className="h-40 w-full rounded-xl object-cover"
      />
    );
  }
  return (
    <div className={`h-40 w-full rounded-xl bg-gradient-to-br ${SUBJECT_TONE[book.subject]} p-4 flex flex-col justify-between text-primary-foreground`}>
      <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">CK-12</span>
      <span className="font-display text-lg font-semibold leading-tight line-clamp-3">{book.title}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function DigitalLibraryModule() {
  const { profile, primaryRole } = useAuth();
  const userId = profile?.$id ?? null;
  const { books, reading } = useCk12(userId);
  const manage = canWrite("library", primaryRole ?? null);

  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("All");
  const [grade, setGrade] = useState<string>("All");
  const [onlySaved, setOnlySaved] = useState(false);
  const [open, setOpen] = useState<Ck12Book | null>(null);
  const [editing, setEditing] = useState<Ck12Book | null>(null);
  const [creating, setCreating] = useState(false);

  const grades = useMemo(
    () => Array.from(new Set(books.map((b) => b.grade))).sort(
      (a, b) => GRADE_LEVELS.indexOf(a) - GRADE_LEVELS.indexOf(b),
    ),
    [books],
  );

  const filtered = books.filter((b) => {
    if (subject !== "All" && b.subject !== subject) return false;
    if (grade !== "All" && b.grade !== grade) return false;
    if (onlySaved && !reading[b.id]?.bookmarked) return false;
    if (!q) return true;
    const hay = `${b.title} ${b.subject} ${b.grade} ${b.description} ${(b.chapters ?? []).map((c) => c.title).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const toggleBookmark = (b: Ck12Book) => {
    if (!userId) return;
    const next = !reading[b.id]?.bookmarked;
    ck12Store.setReading(userId, b.id, { bookmarked: next });
    toast.success(next ? "Saved to your bookmarks" : "Removed from bookmarks");
  };

  const openBook = (b: Ck12Book) => {
    if (userId && !(reading[b.id]?.progress > 0)) {
      ck12Store.setReading(userId, b.id, { progress: 5 });
    }
    setOpen(b);
  };

  const savedCount = Object.values(reading).filter((r) => r.bookmarked).length;
  const inProgress = Object.values(reading).filter((r) => r.progress > 0 && r.progress < 100).length;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        {[
          { label: "Books available", value: books.length, icon: BookOpen },
          { label: "Bookmarked", value: savedCount, icon: Bookmark },
          { label: "In progress", value: inProgress, icon: GraduationCap },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 shadow-[var(--shadow-soft)]">
            <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><s.icon className="h-5 w-5" /></span>
            <div>
              <p className="text-xl font-display font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, keyword or chapter…" className="pl-9 bg-card" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-[160px] bg-card"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All grades</SelectItem>
              {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={onlySaved ? "default" : "outline"} className="gap-2" onClick={() => setOnlySaved((v) => !v)}>
            <Bookmark className="h-4 w-4" /> Bookmarks
          </Button>
          {manage && (
            <>
              <Button className="gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add book</Button>
              <Button variant="outline" className="gap-2" onClick={() => { ck12Store.reset(); toast.success("Catalog restored"); }}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["All", ...CK12_SUBJECTS].map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${
              subject === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b) => {
          const state = reading[b.id];
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] flex flex-col">
              <Cover book={b} />
              <div className="mt-4 flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold leading-snug">{b.title}</h3>
                <button
                  aria-label={state?.bookmarked ? "Remove bookmark" : "Bookmark this book"}
                  onClick={() => toggleBookmark(b)}
                  className="shrink-0 rounded-lg p-1.5 hover:bg-muted"
                >
                  {state?.bookmarked
                    ? <BookmarkCheck className="h-5 w-5 text-primary" />
                    : <Bookmark className="h-5 w-5 text-muted-foreground" />}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{b.subject}</Badge>
                <Badge variant="outline">{b.grade}</Badge>
                {b.embeddable && <Badge variant="outline">Readable in app</Badge>}
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{b.description}</p>
              {state?.progress ? (
                <div className="mt-3 space-y-1">
                  <ProgressBar value={state.progress} />
                  <p className="text-xs text-muted-foreground">{state.progress}% read</p>
                </div>
              ) : null}
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button className="gap-2 flex-1" onClick={() => openBook(b)}>
                  <BookOpen className="h-4 w-4" /> Read Book
                </Button>
                {manage && (
                  <>
                    <Button size="icon" variant="outline" aria-label="Edit book" onClick={() => setEditing(b)}><Edit3 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete book" onClick={() => {
                      if (confirm(`Remove "${b.title}" from the library?`)) { ck12Store.remove(b.id); toast.success("Book removed"); }
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No books match your search.
        </p>
      )}

      {open && <ReaderDialog book={open} userId={userId} progress={reading[open.id]?.progress ?? 0} onClose={() => setOpen(null)} />}
      {(editing || creating) && (
        <BookEditor book={editing} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </>
  );
}

function ReaderDialog({ book, userId, progress, onClose }: { book: Ck12Book; userId: string | null; progress: number; onClose: () => void }) {
  const [value, setValue] = useState(progress);
  const [chapter, setChapter] = useState(book.chapters?.[0]?.id ?? "");
  const active = book.chapters?.find((c) => c.id === chapter);
  const url = active?.url || book.url;

  const persist = (p: number) => {
    setValue(p);
    if (userId) ck12Store.setReading(userId, book.id, { progress: p });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{book.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{book.subject}</Badge>
          <Badge variant="outline">{book.grade}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{book.description}</p>

        {book.chapters && book.chapters.length > 0 && (
          <div>
            <Label>Chapter</Label>
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a chapter" /></SelectTrigger>
              <SelectContent>
                {book.chapters.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {book.embeddable ? (
          <div className="rounded-xl overflow-hidden border border-border">
            <iframe
              src={url}
              title={book.title}
              className="w-full h-[50vh] bg-background"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              CK-12 does not permit embedding this title. Open the official CK-12 page to read it — your progress stays tracked here.
            </p>
          </div>
        )}

        <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex">
          <Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" /> Open on CK-12</Button>
        </a>

        <div className="space-y-2">
          <Label htmlFor="ck12-progress">Reading progress — {value}%</Label>
          <input
            id="ck12-progress"
            type="range" min={0} max={100} step={5}
            value={value}
            onChange={(e) => persist(Number(e.target.value))}
            className="w-full accent-[hsl(var(--primary))]"
          />
          <ProgressBar value={value} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { persist(100); toast.success("Marked as completed"); onClose(); }}>Mark complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookEditor({ book, onClose }: { book: Ck12Book | null; onClose: () => void }) {
  const [form, setForm] = useState<Ck12Book>(
    book ?? {
      id: `ck-${Date.now()}`,
      title: "", subject: "Mathematics" as Ck12Subject, grade: "Grade 9",
      description: "", url: "https://www.ck12.org/", embeddable: false, chapters: [],
    },
  );
  const [chapters, setChapters] = useState((book?.chapters ?? []).map((c) => c.title).join("\n"));
  const [uploading, setUploading] = useState(false);

  const attachCover = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Cover image must be under 10 MB"); return; }
    setUploading(true);
    try {
      const uploaded = await apiClient.uploadFile(file);
      setForm((current) => ({ ...current, cover: uploaded.url }));
      toast.success("Cover image attached");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not upload cover image");
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    if (!form.title.trim() || !form.url.trim()) { toast.error("Title and CK-12 link are required"); return; }
    ck12Store.upsert({
      ...form,
      chapters: chapters.split("\n").map((t) => t.trim()).filter(Boolean)
        .map((t, i) => ({ id: `${form.id}-c${i + 1}`, title: t })),
    });
    toast.success(book ? "Book updated" : "Book added to the library");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{book ? "Edit book" : "Add CK-12 book"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v as Ck12Subject })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CK12_SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade level</Label>
              <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>CK-12 link</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://www.ck12.org/book/…" /></div>
          <div>
            <Label>Cover image (optional)</Label>
            <div className="mt-1 flex items-center gap-3">
              {form.cover && <img src={form.cover} alt="Cover preview" className="h-14 w-10 rounded object-cover border border-border" />}
              <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                {uploading ? "Uploading…" : form.cover ? "Replace cover" : "Attach cover"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { void attachCover(e.target.files?.[0] ?? null); e.currentTarget.value = ""; }} />
              </label>
            </div>
          </div>
          <div><Label>Chapters (one per line)</Label><Textarea rows={4} value={chapters} onChange={(e) => setChapters(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.embeddable} onChange={(e) => setForm({ ...form, embeddable: e.target.checked })} />
            Embedding permitted — read inside the portal
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}