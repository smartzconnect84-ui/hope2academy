/**
 * Reports module — role-based report submission and review.
 *
 * Submission hierarchy:
 *   admin_assistant | registrar | admissions_officer | teacher | nurse
 *       → Admin (review & approve)
 *   admin
 *       → Superadmin (final approval)
 *   student
 *       → Teacher + Admin Assistant (both can review)
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Send, Eye, CheckCircle2, RotateCcw, X, FileText, Inbox, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/mock-backend";
import {
  reportsStore,
  REPORT_CATEGORIES_STAFF,
  REPORT_CATEGORIES_STUDENT,
  recipientRolesForSubmitter,
  type Report,
  type ReportAttachment,
} from "@/lib/reports-store";
import { StatCard } from "@/components/PortalShell";
import { apiClient } from "@/lib/api-client";

type Principal = { id: string; name: string; role: string };

function usePrincipal(): Principal | null {
  const { profile, primaryRole } = useAuth();
  if (!profile) return null;
  return { id: profile.$id, name: profile.full_name ?? "User", role: primaryRole ?? "student" };
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Submitted: "bg-blue-100 text-blue-800",
    "Under Review": "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    "Returned for Revision": "bg-orange-100 text-orange-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[s] ?? "bg-muted text-muted-foreground"}`}>
      {s}
    </span>
  );
}

function recipientLabel(recipientRoles: string): string {
  if (recipientRoles === "superadmin") return "Superadmin";
  if (recipientRoles.includes(",")) return "Teacher & Administrative Assistant";
  return ROLE_LABEL[recipientRoles as keyof typeof ROLE_LABEL] ?? recipientRoles;
}

export function ReportsModule() {
  const principal = usePrincipal();
  const [rows, setRows] = useState<Report[]>([]);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<Report | null>(null);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<ReportAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadGeneration = useRef(0);
  const [form, setForm] = useState({
    title: "",
    category: "",
    details: "",
  });

  const reload = useCallback(async () => {
    const generation = ++loadGeneration.current;
    if (!principal) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const visible = await reportsStore.visible(principal.id, principal.role as any);
      if (generation === loadGeneration.current) setRows(visible);
    } catch (error: any) {
      if (generation === loadGeneration.current) {
        setRows([]);
        setLoadError(error?.message ?? "Reports could not be loaded.");
      }
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, [principal?.id, principal?.role]);

  useEffect(() => {
    void reload();
    return () => { loadGeneration.current += 1; };
  }, [reload]);

  if (!principal) return null;

  const isSuperadmin = principal.role === "superadmin";
  const isReviewer =
    isSuperadmin ||
    principal.role === "admin" ||
    principal.role === "teacher" ||
    principal.role === "admin_assistant";

  // Superadmin only reviews — they do not submit reports.
  const canSubmit = !isSuperadmin;

  const isStudent = principal.role === "student";
  const categories = isStudent ? REPORT_CATEGORIES_STUDENT : REPORT_CATEGORIES_STAFF;
  const recipientRoles = recipientRolesForSubmitter(principal.role as any);
  const recipientDisplay = recipientLabel(recipientRoles);

  const submit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.category) { toast.error("Please select a category"); return; }
    if (!form.details.trim()) { toast.error("Details are required"); return; }
    setSaving(true);
    try {
      await reportsStore.submit({
        title: form.title,
        category: form.category,
        details: form.details,
        submittedBy: principal.name,
        submittedById: principal.id,
        submitterRole: principal.role,
        attachments: files,
      });
      toast.success(`Report submitted to ${recipientDisplay}`);
      setForm({ title: "", category: "", details: "" });
      setFiles([]);
      setCreating(false);
      await reload();
    } catch (error: any) {
      toast.error(error?.message ?? "Report could not be submitted.");
    } finally {
      setSaving(false);
    }
  };

  const onPickFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      const picked: ReportAttachment[] = [];
      for (const f of Array.from(list)) {
        if (f.size > 4 * 1024 * 1024) { toast.error(`${f.name} is larger than 4 MB`); continue; }
        try {
          const uploaded = await apiClient.uploadFile(f);
          picked.push({
            name: uploaded.name,
            type: uploaded.type,
            size: uploaded.size,
            url: uploaded.url,
            objectPath: uploaded.objectPath,
          });
        } catch (error: any) {
          toast.error(error?.message ?? `Could not upload ${f.name}`);
        }
      }
      setFiles((prev) => [...prev, ...picked]);
    } finally {
      setUploading(false);
    }
  };

  const act = async (action: "approve" | "reject" | "return") => {
    if (!open) return;
    setSaving(true);
    try {
      await reportsStore.review(open.id, action, { name: principal.name, role: principal.role, id: principal.id }, comment);
      toast.success("Decision recorded");
      setComment("");
      setOpen(null);
      await reload();
    } catch (error: any) {
      toast.error(error?.message ?? "The decision could not be recorded.");
    } finally {
      setSaving(false);
    }
  };

  const canDecide = (r: Report) => {
    if (r.status !== "Submitted") return false;
    if (principal.role === "superadmin") return r.recipientRoles.includes("superadmin");
    if (principal.role === "admin") return r.recipientRoles.includes("admin");
    if (principal.role === "teacher") return r.recipientRoles.includes("teacher");
    if (principal.role === "admin_assistant") return r.recipientRoles.includes("admin_assistant");
    return false;
  };

  const incoming = rows.filter((r) => canDecide(r));
  const mine = rows.filter((r) => r.submittedById === principal.id);

  const stats = {
    submitted: mine.length,
    pending: mine.filter((r) => r.status === "Submitted" || r.status === "Under Review").length,
    approved: mine.filter((r) => r.status === "Approved").length,
    incomingCount: incoming.length,
  };

  return (
    <>
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isReviewer && (
          <StatCard icon={Inbox} label="Awaiting Review" value={String(stats.incomingCount)} accent="primary" />
        )}
        {canSubmit && (
          <>
            <StatCard icon={Send} label="Reports Submitted" value={String(stats.submitted)} />
            <StatCard icon={FileText} label="Pending" value={String(stats.pending)} />
            <StatCard icon={CheckCircle2} label="Approved" value={String(stats.approved)} />
          </>
        )}
      </div>

      {loadError && (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      )}
      {loading && <p className="mb-4 text-sm text-muted-foreground">Loading reports…</p>}

      {/* Incoming reports for reviewers */}
      {isReviewer && incoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Reports Awaiting Your Review</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Title", "Category", "Submitted By", "Role", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incoming.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{r.category}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{r.submittedBy}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{ROLE_LABEL[r.submitterRole as keyof typeof ROLE_LABEL] ?? r.submitterRole}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => { setOpen(r); setComment(""); }}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My submitted reports — hidden for Superadmin (receive/approve only) */}
      {canSubmit && (
        <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Submitted Reports</h2>
        <Button onClick={() => { setCreating(true); setForm({ title: "", category: categories[0], details: "" }); setFiles([]); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Report
        </Button>
      </div>

      {loading ? null : mine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No reports yet</p>
          <p className="text-sm mt-1">Submit your first report to {recipientDisplay}.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Title", "Category", "Submitted To", "Status", "Last Updated", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{r.category}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{recipientLabel(r.recipientRoles)}</td>
                  <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setOpen(r); setComment(""); }}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All reports visible to reviewers (non-own) */}
      {isReviewer && (() => {
        const reviewed = rows.filter(
          (r) => r.submittedById !== principal.id && !canDecide(r)
        );
        if (!reviewed.length) return null;
        return (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-3">Previously Reviewed</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Title", "Category", "Submitted By", "Status", "Reviewed", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviewed.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{r.category}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{r.submittedBy}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.reviewedBy ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => { setOpen(r); setComment(""); }}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Create dialog */}
      {creating && (
        <Dialog open onOpenChange={(o) => !o && setCreating(false)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Submit a Report</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                This report will be sent to <strong>{recipientDisplay}</strong> for review and approval.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Report Title *</Label>
                <Input
                  className="mt-1.5"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Term 2 Academic Progress Report"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Details *</Label>
                <Textarea
                  className="mt-1.5 min-h-[120px]"
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder="Provide all relevant details, observations, findings, or recommendations..."
                />
              </div>
              <div>
                <Label>Attachments</Label>
                <label className="mt-1.5 flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-border p-3 hover:border-primary/40 transition text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 shrink-0" />
                  <span>Click to attach files (max 4 MB each)</span>
                   <input type="file" multiple className="hidden" disabled={uploading} onChange={(e) => { void onPickFiles(e.target.files); e.currentTarget.value = ""; }} />
                </label>
                {uploading && <p className="mt-2 text-xs text-muted-foreground">Uploading attachments…</p>}
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between text-xs bg-muted rounded-lg px-3 py-1.5">
                        <span className="truncate">{f.name}</span>
                        <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-2 text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={() => void submit()} disabled={saving || uploading} className="gap-2">
                <Send className="h-4 w-4" /> {saving ? "Submitting…" : "Submit Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
        </>
      )}

      {/* View / Review dialog */}
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <DialogTitle>{open.title}</DialogTitle>
                {statusBadge(open.status)}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                <span>Category: <strong>{open.category}</strong></span>
                <span>·</span>
                <span>Submitted by: <strong>{open.submittedBy}</strong></span>
                <span>·</span>
                <span>To: <strong>{recipientLabel(open.recipientRoles)}</strong></span>
                <span>·</span>
                <span>{new Date(open.createdAt).toLocaleString()}</span>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Details</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{open.details}</p>
              </div>

              {open.attachments && open.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Attachments</p>
                  <ul className="space-y-1">
                    {open.attachments.map((a, i) => (
                      <li key={i}>
                         <a href={a.url} download={a.name} className="text-sm text-primary hover:underline flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {open.reviewerComment && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reviewer Comment</p>
                  <p className="text-sm bg-muted/40 rounded-lg p-3">{open.reviewerComment}</p>
                  {open.reviewedBy && <p className="text-xs text-muted-foreground mt-1">— {open.reviewedBy}</p>}
                </div>
              )}

              {/* Timeline */}
              {open.history.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Activity</p>
                  <ol className="space-y-2">
                    {open.history.map((ev, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium">{ev.action} by {ev.actor}</p>
                          {ev.comment && <p className="text-muted-foreground text-xs mt-0.5">{ev.comment}</p>}
                          <p className="text-muted-foreground text-xs">{new Date(ev.at).toLocaleString()}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Reviewer decision */}
              {canDecide(open) && (
                <div className="border-t border-border pt-4">
                  <Label>Review Comment (optional)</Label>
                  <Textarea
                    className="mt-1.5"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add feedback, notes, or instructions for revision..."
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3 flex-wrap">
                     <Button disabled={saving} onClick={() => void act("approve")} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                     <Button disabled={saving} onClick={() => void act("return")} variant="outline" className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50">
                      <RotateCcw className="h-4 w-4" /> Return for Revision
                    </Button>
                     <Button disabled={saving} onClick={() => void act("reject")} variant="destructive" className="gap-2">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
