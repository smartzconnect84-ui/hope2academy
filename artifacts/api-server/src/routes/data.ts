/**
 * Generic CRUD routes for all data modules.
 * Each module is a named collection in the in-memory store.
 * GET    /api/:collection          — list all
 * GET    /api/:collection/:id      — get one
 * POST   /api/:collection          — create
 * PATCH  /api/:collection/:id      — update
 * DELETE /api/:collection/:id      — delete
 */
import { Router } from "express";
import { mockStore } from "../lib/mock-store.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const PUBLIC_READ = new Set([
  "announcements",
  "events",
  "calendar",
  "departments",
]);

const COLLECTIONS = new Set([
  "grades", "attendance", "timetable", "classes", "assignments",
  "announcements", "fees", "children", "events", "jobs", "directory",
  "donations", "departments", "audit", "resources", "library",
  "admissions", "exams", "behavior", "lessonplans", "transport",
  "clinic", "calendar", "inventory", "staff", "scholarships",
  "settings", "pages", "posts", "media",
]);

function guardCollection(col: string, res: any): boolean {
  if (!COLLECTIONS.has(col)) {
    res.status(404).json({ error: `Unknown collection: ${col}` });
    return false;
  }
  return true;
}

/** GET /api/:collection */
router.get("/:collection", (req, res, next) => {
  const col = req.params.collection;
  if (!guardCollection(col, res)) return;
  if (!PUBLIC_READ.has(col)) {
    requireAuth(req, res, () => {
      res.json(mockStore.list(col));
    });
    return;
  }
  res.json(mockStore.list(col));
});

/** GET /api/:collection/:id */
router.get("/:collection/:id", requireAuth, (req, res) => {
  const { collection: col, id } = req.params;
  if (!guardCollection(col, res)) return;
  const item = mockStore.get(col, id);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

/** POST /api/:collection */
router.post("/:collection", requireAuth, (req, res) => {
  const col = req.params.collection;
  if (!guardCollection(col, res)) return;
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "JSON body required" });
    return;
  }
  const item = mockStore.create(col, req.body);
  res.status(201).json(item);
});

/** PATCH /api/:collection/:id */
router.patch("/:collection/:id", requireAuth, (req, res) => {
  const { collection: col, id } = req.params;
  if (!guardCollection(col, res)) return;
  const updated = mockStore.update(col, id, req.body ?? {});
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

/** DELETE /api/:collection/:id */
router.delete("/:collection/:id", requireAuth, (req, res) => {
  const { collection: col, id } = req.params;
  if (!guardCollection(col, res)) return;
  const removed = mockStore.remove(col, id);
  if (!removed) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

export default router;
