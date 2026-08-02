/**
 * Admin/Superadmin editors for public website content:
 * Projects, Stories, Divisions (Departments) and Homepage sections.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, ChevronUp, ChevronDown, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { readFileAsDataUrl } from "@/lib/cms-store";
import {
  siteContent, useSiteContent,
  type ProjectItem, type StoryItem, type DivisionItem, type HomeChapter,
} from "@/lib/site-content";

type FieldType = "text" | "textarea" | "image" | "date" | "toggle";
type Field<T> = { name: keyof T & string; label: string; type: FieldType; rows?: number; hint?: string };

function ImagePicker({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const upload = async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB"); return; }
    onChange(await readFileAsDataUrl(file));
    toast.success("Image attached — remember to save");
  };
  return (
    <div className="flex items-start gap-4">
      <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
        {value
          ? <img src={value} alt="preview" className="h-full w-full object-cover" />
          : <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No image</div>}
      </div>
      <div className="flex-1 space-y-2">
        <input id={id} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0] ?? null)} />
        <label htmlFor={id}><Button asChild variant="outline" className="gap-2"><span><Upload className="h-4 w-4" />Upload image</span></Button></label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" className="text-xs" />
      </div>
    </div>
  );
}

function ItemDialog<T extends { id: string }>({
  title, item, fields, onSave, onClose,
}: { title: string; item: T; fields: Field<T>[]; onSave: (v: T) => void; onClose: () => void }) {
  const [form, setForm] = useState<T>(item);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              {f.type !== "toggle" && <Label>{f.label}</Label>}
              {f.type === "image" && <div className="mt-2"><ImagePicker id={`img-${f.name}`} value={(form as any)[f.name] ?? ""} onChange={(v) => set(f.name, v)} /></div>}
              {f.type === "textarea" && <Textarea rows={f.rows ?? 3} value={(form as any)[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />}
              {(f.type === "text" || f.type === "date") && (
                <Input type={f.type === "date" ? "date" : "text"} value={(form as any)[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
              )}
              {f.type === "toggle" && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={Boolean((form as any)[f.name])} onChange={(e) => set(f.name, e.target.checked)} />
                  {f.label}
                </label>
              )}
              {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(form); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListEditor<T extends { id: string; published?: boolean }>({
  items, collection, label, blank, fields, titleOf, subtitleOf, imageOf,
}: {
  items: T[];
  collection: "projects" | "stories" | "divisions";
  label: string;
  blank: () => T;
  fields: Field<T>[];
  titleOf: (t: T) => string;
  subtitleOf: (t: T) => string;
  imageOf: (t: T) => string;
}) {
  const [editing, setEditing] = useState<T | null>(null);
  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          {items.length} {label}{items.length === 1 ? "" : "s"} · {items.filter((i) => i.published !== false).length} published on the public site.
        </p>
        <Button className="gap-2" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />New {label}</Button>
      </div>

      {items.length === 0 && (
        <Card className="border-dashed p-10 text-center text-muted-foreground">
          Nothing published yet. Create your first {label} — it appears on the public site immediately.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it, i) => (
          <Card key={it.id} className="overflow-hidden p-0">
            <div className="relative aspect-[16/9] bg-muted">
              {imageOf(it) && <img src={imageOf(it)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              {it.published === false && <Badge className="absolute left-3 top-3" variant="secondary">Draft</Badge>}
            </div>
            <div className="space-y-3 p-4">
              <p className="font-display text-lg font-bold leading-tight">{titleOf(it)}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{subtitleOf(it)}</p>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" disabled={i === 0} onClick={() => siteContent.move(collection, it.id, -1)} aria-label="Move up"><ChevronUp className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" disabled={i === items.length - 1} onClick={() => siteContent.move(collection, it.id, 1)} aria-label="Move down"><ChevronDown className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => siteContent.upsert(collection, { ...it, published: it.published === false } as any)}>
                  {it.published === false ? "Publish" : "Unpublish"}
                </Button>
                <Button size="sm" variant="outline" className="ml-auto gap-1.5" onClick={() => setEditing(it)}><Edit3 className="h-3.5 w-3.5" />Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete this ${label}?`)) { siteContent.remove(collection, it.id); toast.success("Deleted"); } }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <ItemDialog
          title={`${items.some((x) => x.id === editing.id) ? "Edit" : "New"} ${label}`}
          item={editing}
          fields={fields}
          onSave={(v) => { siteContent.upsert(collection, v as any); toast.success("Saved — live on the public site"); }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function PageCopy({ children }: { children: React.ReactNode }) {
  return <Card className="mb-6 space-y-3 p-5">{children}</Card>;
}

export function ProjectsContentModule() {
  const c = useSiteContent();
  return (
    <>
      <PageCopy>
        <p className="font-semibold">Page header</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={c.projectsEyebrow} onChange={(e) => siteContent.patch({ projectsEyebrow: e.target.value })} /></div>
          <div><Label>Title</Label><Input value={c.projectsTitle} onChange={(e) => siteContent.patch({ projectsTitle: e.target.value })} /></div>
        </div>
        <div><Label>Lead</Label><Textarea rows={2} value={c.projectsLead} onChange={(e) => siteContent.patch({ projectsLead: e.target.value })} /></div>
      </PageCopy>
      <ListEditor
        items={c.projects}
        collection="projects"
        label="project"
        blank={() => ({ id: siteContent.newId("pr"), title: "", summary: "", body: "", image: "", location: "", status: "Ongoing", published: true })}
        fields={[
          { name: "title", label: "Project title", type: "text" },
          { name: "image", label: "Cover image", type: "image" },
          { name: "summary", label: "Short summary", type: "textarea", rows: 2 },
          { name: "body", label: "Full description", type: "textarea", rows: 6 },
          { name: "location", label: "Location", type: "text" },
          { name: "status", label: "Status (Ongoing / Completed / Planned)", type: "text" },
          { name: "published", label: "Publish on the public Projects page", type: "toggle" },
        ]}
        titleOf={(p) => p.title || "Untitled project"}
        subtitleOf={(p) => p.summary}
        imageOf={(p) => p.image}
      />
    </>
  );
}

export function StoriesContentModule() {
  const c = useSiteContent();
  return (
    <>
      <PageCopy>
        <p className="font-semibold">Page header</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={c.storiesEyebrow} onChange={(e) => siteContent.patch({ storiesEyebrow: e.target.value })} /></div>
          <div><Label>Title</Label><Input value={c.storiesTitle} onChange={(e) => siteContent.patch({ storiesTitle: e.target.value })} /></div>
        </div>
        <div><Label>Lead</Label><Textarea rows={2} value={c.storiesLead} onChange={(e) => siteContent.patch({ storiesLead: e.target.value })} /></div>
      </PageCopy>
      <ListEditor
        items={c.stories}
        collection="stories"
        label="story"
        blank={() => ({ id: siteContent.newId("st"), title: "", excerpt: "", body: "", image: "", category: "Academy", author: "", date: new Date().toISOString().slice(0, 10), published: true })}
        fields={[
          { name: "title", label: "Story title", type: "text" },
          { name: "image", label: "Cover image", type: "image" },
          { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2 },
          { name: "body", label: "Story body", type: "textarea", rows: 8 },
          { name: "category", label: "Category (Academy / Mission / Church / Media)", type: "text" },
          { name: "author", label: "Author", type: "text" },
          { name: "date", label: "Publish date", type: "date" },
          { name: "published", label: "Publish on the public Stories page", type: "toggle" },
        ]}
        titleOf={(s) => s.title || "Untitled story"}
        subtitleOf={(s) => s.excerpt}
        imageOf={(s) => s.image}
      />
    </>
  );
}

export function DivisionsContentModule() {
  const c = useSiteContent();
  return (
    <>
      <PageCopy>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Page header</p>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => { if (confirm("Reset all website content to defaults?")) { siteContent.reset(); toast.success("Content reset"); } }}>
            <RotateCcw className="h-4 w-4" />Reset all
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={c.divisionsEyebrow} onChange={(e) => siteContent.patch({ divisionsEyebrow: e.target.value })} /></div>
          <div><Label>Title</Label><Input value={c.divisionsTitle} onChange={(e) => siteContent.patch({ divisionsTitle: e.target.value })} /></div>
        </div>
        <div><Label>Lead</Label><Textarea rows={2} value={c.divisionsLead} onChange={(e) => siteContent.patch({ divisionsLead: e.target.value })} /></div>
      </PageCopy>
      <ListEditor
        items={c.divisions}
        collection="divisions"
        label="division"
        blank={() => ({ id: siteContent.newId("dv"), roman: "V", pillar: "", title: "", tag: "", est: "", area: "", image: "", body: "", bullets: "", published: true })}
        fields={[
          { name: "title", label: "Division name", type: "text" },
          { name: "image", label: "Image", type: "image" },
          { name: "roman", label: "Roman numeral", type: "text" },
          { name: "pillar", label: "Pillar label", type: "text" },
          { name: "tag", label: "Tagline", type: "text" },
          { name: "est", label: "Detail line 1", type: "text" },
          { name: "area", label: "Detail line 2", type: "text" },
          { name: "body", label: "Paragraphs", type: "textarea", rows: 7, hint: "Separate paragraphs with a blank line." },
          { name: "bullets", label: "Highlights", type: "textarea", rows: 5, hint: "One highlight per line." },
          { name: "published", label: "Show on the public Departments page", type: "toggle" },
        ]}
        titleOf={(d) => d.title || "Untitled division"}
        subtitleOf={(d) => d.tag}
        imageOf={(d) => d.image}
      />
    </>
  );
}

export function HomepageContentModule() {
  const c = useSiteContent();
  const h = c.home;
  const [chapter, setChapter] = useState<HomeChapter | null>(null);

  const saveChapter = (v: HomeChapter) => {
    const list = [...h.chapters];
    const i = list.findIndex((x) => x.id === v.id);
    if (i === -1) list.push(v); else list[i] = v;
    siteContent.patchHome({ chapters: list });
    toast.success("Homepage updated");
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-5">
        <p className="font-semibold">Identity ribbon</p>
        {h.ribbon.map((r, i) => (
          <div key={r.id} className="grid gap-3 sm:grid-cols-[6rem_1fr_auto]">
            <Input value={r.k} onChange={(e) => { const l = [...h.ribbon]; l[i] = { ...r, k: e.target.value }; siteContent.patchHome({ ribbon: l }); }} />
            <Input value={r.label} onChange={(e) => { const l = [...h.ribbon]; l[i] = { ...r, label: e.target.value }; siteContent.patchHome({ ribbon: l }); }} />
            <Button variant="ghost" size="sm" onClick={() => siteContent.patchHome({ ribbon: h.ribbon.filter((x) => x.id !== r.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2" onClick={() => siteContent.patchHome({ ribbon: [...h.ribbon, { id: siteContent.newId("r"), k: String(h.ribbon.length + 1).padStart(2, "0"), label: "New item" }] })}>
          <Plus className="h-4 w-4" />Add ribbon item
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-semibold">Manifesto</p>
        <div><Label>Eyebrow</Label><Input value={h.manifestoEyebrow} onChange={(e) => siteContent.patchHome({ manifestoEyebrow: e.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Heading</Label><Input value={h.manifestoHeading} onChange={(e) => siteContent.patchHome({ manifestoHeading: e.target.value })} /></div>
          <div><Label>Highlighted phrase</Label><Input value={h.manifestoAccent} onChange={(e) => siteContent.patchHome({ manifestoAccent: e.target.value })} /></div>
        </div>
        <div><Label>Lead paragraph</Label><Textarea rows={3} value={h.manifestoLead} onChange={(e) => siteContent.patchHome({ manifestoLead: e.target.value })} /></div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Chapters (zigzag sections)</p>
          <Button size="sm" className="gap-2" onClick={() => setChapter({ id: siteContent.newId("c"), tag: "", title: "", body: "", statValue: "", statUnit: "", href: "/about", cta: "Learn more", image: "", alt: "" })}>
            <Plus className="h-4 w-4" />Add chapter
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {h.chapters.map((ch, i) => (
            <div key={ch.id} className="flex gap-3 rounded-xl border p-3">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {ch.image && <img src={ch.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs uppercase text-muted-foreground">{ch.tag}</p>
                <p className="truncate font-semibold">{ch.title}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" disabled={i === 0} onClick={() => { const l = [...h.chapters]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; siteContent.patchHome({ chapters: l }); }}><ChevronUp className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" disabled={i === h.chapters.length - 1} onClick={() => { const l = [...h.chapters]; [l[i + 1], l[i]] = [l[i], l[i + 1]]; siteContent.patchHome({ chapters: l }); }}><ChevronDown className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setChapter(ch)}><Edit3 className="h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this chapter?")) siteContent.patchHome({ chapters: h.chapters.filter((x) => x.id !== ch.id) }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-semibold">Pull quote</p>
        <div><Label>Quote</Label><Textarea rows={3} value={h.quote} onChange={(e) => siteContent.patchHome({ quote: e.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Attribution</Label><Input value={h.quoteAuthor} onChange={(e) => siteContent.patchHome({ quoteAuthor: e.target.value })} /></div>
          <div><Label>Sub-line</Label><Input value={h.quoteSub} onChange={(e) => siteContent.patchHome({ quoteSub: e.target.value })} /></div>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-semibold">Impact facts</p>
        {h.impactStats.map((s, i) => (
          <div key={s.id} className="grid gap-3 sm:grid-cols-[10rem_1fr_auto]">
            <Input value={s.v} onChange={(e) => { const l = [...h.impactStats]; l[i] = { ...s, v: e.target.value }; siteContent.patchHome({ impactStats: l }); }} />
            <Input value={s.label} onChange={(e) => { const l = [...h.impactStats]; l[i] = { ...s, label: e.target.value }; siteContent.patchHome({ impactStats: l }); }} />
            <Button variant="ghost" size="sm" onClick={() => siteContent.patchHome({ impactStats: h.impactStats.filter((x) => x.id !== s.id) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2" onClick={() => siteContent.patchHome({ impactStats: [...h.impactStats, { id: siteContent.newId("s"), v: "", label: "" }] })}>
          <Plus className="h-4 w-4" />Add fact
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-semibold">Featured cards (Field notes)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Eyebrow</Label><Input value={h.cardsEyebrow} onChange={(e) => siteContent.patchHome({ cardsEyebrow: e.target.value })} /></div>
          <div><Label>Heading</Label><Input value={h.cardsHeading} onChange={(e) => siteContent.patchHome({ cardsHeading: e.target.value })} /></div>
        </div>
        {h.cards.map((cd, i) => (
          <div key={cd.id} className="space-y-2 rounded-xl border p-3">
            <ImagePicker id={`card-${cd.id}`} value={cd.image} onChange={(v) => { const l = [...h.cards]; l[i] = { ...cd, image: v }; siteContent.patchHome({ cards: l }); }} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Tag" value={cd.tag} onChange={(e) => { const l = [...h.cards]; l[i] = { ...cd, tag: e.target.value }; siteContent.patchHome({ cards: l }); }} />
              <Input placeholder="Title" value={cd.title} onChange={(e) => { const l = [...h.cards]; l[i] = { ...cd, title: e.target.value }; siteContent.patchHome({ cards: l }); }} />
              <Input placeholder="/link" value={cd.href} onChange={(e) => { const l = [...h.cards]; l[i] = { ...cd, href: e.target.value }; siteContent.patchHome({ cards: l }); }} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => siteContent.patchHome({ cards: h.cards.filter((x) => x.id !== cd.id) })}><Trash2 className="h-4 w-4 text-destructive" />Remove card</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2" onClick={() => siteContent.patchHome({ cards: [...h.cards, { id: siteContent.newId("cd"), image: "", tag: "", title: "", href: "/stories" }] })}>
          <Plus className="h-4 w-4" />Add card
        </Button>
      </Card>

      {chapter && (
        <ItemDialog<HomeChapter>
          title={h.chapters.some((x) => x.id === chapter.id) ? "Edit chapter" : "New chapter"}
          item={chapter}
          fields={[
            { name: "tag", label: "Eyebrow tag", type: "text" },
            { name: "title", label: "Heading", type: "text" },
            { name: "body", label: "Body copy", type: "textarea", rows: 4 },
            { name: "image", label: "Image", type: "image" },
            { name: "alt", label: "Image alt text", type: "text" },
            { name: "statValue", label: "Stat value", type: "text" },
            { name: "statUnit", label: "Stat unit", type: "text" },
            { name: "cta", label: "Link text", type: "text" },
            { name: "href", label: "Link target", type: "text" },
          ]}
          onSave={saveChapter}
          onClose={() => setChapter(null)}
        />
      )}
    </div>
  );
}
