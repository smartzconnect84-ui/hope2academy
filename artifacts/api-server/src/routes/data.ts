/**
 * Generic CRUD routes for all data modules.
 * Each module is a named collection in the PostgreSQL items table.
 * GET    /api/:collection          — list all
 * GET    /api/:collection/:id      — get one
 * POST   /api/:collection          — create
 * PATCH  /api/:collection/:id      — update
 * DELETE /api/:collection/:id      — delete
 */
import { Router } from "express";
import { dbStore, type AppRole } from "../lib/db-store.js";
import { requireAuth } from "../middlewares/auth.js";
import {
  canMutateExisting,
  canReadCollection,
  canWriteCollection,
  scopeDataRows,
  stampServerOwnership,
  stripClientOwnership,
  type DataPrincipal,
} from "../lib/data-access.js";

const router = Router();

const PUBLIC_READ = new Set([
  "announcements",
  "events",
  "calendar",
  "departments",
  "sitecontent",
]);

const COLLECTIONS = new Set([
  "grades", "attendance", "timetable", "classes", "assignments",
  "announcements", "fees", "children", "events", "jobs", "directory",
  "donations", "departments", "audit", "resources", "library", "messages",
  "admissions", "exams", "behavior", "lessonplans", "transport",
  "clinic", "calendar", "inventory", "staff", "scholarships",
  "settings", "pages", "posts", "media", "sitecontent", "message_drafts",
  "expenses", "payroll", "transcripts", "lessons", "immunizations",
  "medications", "healthalerts", "medicalscreenings", "bookstock", "team",
  "counselling", "ptmeetings", "leaverequests", "approvals", "forms",
  "campaigns", "students",
]);

function guardCollection(col: string, res: any): boolean {
  if (!COLLECTIONS.has(col)) {
    res.status(404).json({ error: `Unknown collection: ${col}` });
    return false;
  }
  return true;
}

async function loadPrincipal(req: any, res: any): Promise<DataPrincipal | null> {
  const user = await dbStore.findUserById(String(req.jwtPayload?.sub ?? ""));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    role: user.role as AppRole,
    grade: user.grade,
    class_name: user.class_name,
    linked_children: user.linked_children,
  };
}

function ensureReadAccess(collection: string, principal: DataPrincipal, res: any): boolean {
  if (canReadCollection(collection, principal.role)) return true;
  res.status(403).json({ error: "Forbidden — insufficient role" });
  return false;
}

function ensureWriteAccess(collection: string, principal: DataPrincipal, res: any): boolean {
  if (canWriteCollection(collection, principal.role)) return true;
  res.status(403).json({ error: "Forbidden — insufficient role" });
  return false;
}

/** GET /api/:collection */
router.get("/:collection", async (req, res, next) => {
  const col = String(req.params.collection);
  if (!guardCollection(col, res)) return;
  if (PUBLIC_READ.has(col)) {
    res.json(await dbStore.list(col));
    return;
  }
  requireAuth(req, res, async () => {
    const principal = await loadPrincipal(req, res);
    if (!principal || !ensureReadAccess(col, principal, res)) return;
    const rows = await dbStore.list<Record<string, any>>(col);
    res.json(scopeDataRows(col, rows, principal));
  });
});

/** GET /api/:collection/:id */
router.get("/:collection/:id", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  const principal = await loadPrincipal(req, res);
  if (!principal || !ensureReadAccess(col, principal, res)) return;
  const item = await dbStore.get<Record<string, any>>(col, id);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  if (!scopeDataRows(col, [item], principal).length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(item);
});

/** POST /api/:collection */
router.post("/:collection", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  if (!guardCollection(col, res)) return;
  const principal = await loadPrincipal(req, res);
  if (!principal || !ensureWriteAccess(col, principal, res)) return;
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "JSON body required" });
    return;
  }
  const item = await dbStore.create(col, stampServerOwnership(col, req.body, principal));
  res.status(201).json(item);
});

/** PATCH /api/:collection/:id */
router.patch("/:collection/:id", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  const principal = await loadPrincipal(req, res);
  if (!principal || !ensureWriteAccess(col, principal, res)) return;
  const existing = await dbStore.get<Record<string, any>>(col, id);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!canMutateExisting(existing, principal)) {
    res.status(403).json({ error: "Forbidden — you cannot update this record" });
    return;
  }
  const patch = stripClientOwnership(req.body ?? {}, principal) as Record<string, any>;
  delete patch.id;
  const updated = await dbStore.update(col, id, patch);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

/** DELETE /api/:collection/:id */
router.delete("/:collection/:id", requireAuth, async (req, res) => {
  const col = String(req.params.collection);
  const id  = String(req.params.id);
  if (!guardCollection(col, res)) return;
  const principal = await loadPrincipal(req, res);
  if (!principal || !ensureWriteAccess(col, principal, res)) return;
  const existing = await dbStore.get<Record<string, any>>(col, id);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!canMutateExisting(existing, principal)) {
    res.status(403).json({ error: "Forbidden — you cannot delete this record" });
    return;
  }
  const removed = await dbStore.remove(col, id);
  if (!removed) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

export default router;
