import { Router } from "express";
import { dbStore } from "../lib/db-store.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function sanitize(u: Awaited<ReturnType<typeof dbStore.findUserById>>) {
  if (!u) return null;
  const { password: _pw, ...safe } = u as any;
  return safe;
}

/** POST /api/auth/login  { username, password } */
router.post("/auth/login", async (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const password = req.body?.password;
  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }
  const user = await dbStore.findUserByUsername(username);
  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: sanitize(user) });
});

/** POST /api/auth/logout  (stateless — client drops token) */
router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

/** GET /api/auth/me */
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await dbStore.findUserById(req.jwtPayload!.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitize(user));
});

/** PATCH /api/auth/me  — update own profile */
router.patch("/auth/me", requireAuth, async (req, res) => {
  const { password: _drop, role: _role, id: _id, ...patch } = req.body ?? {};
  const updated = await dbStore.updateUser(req.jwtPayload!.sub, patch);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitize(updated));
});

/** POST /api/auth/change-password  { currentPassword, newPassword } */
router.post("/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }
  const user = await dbStore.findUserById(req.jwtPayload!.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.password !== currentPassword) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }
  if (newPassword === currentPassword) {
    res.status(400).json({ error: "New password must be different" });
    return;
  }
  await dbStore.updateUser(user.id, { password: newPassword });
  res.json({ ok: true });
});

/** POST /api/auth/password-reset/request  { email } */
router.post("/auth/password-reset/request", async (req, res) => {
  res.status(409).json({ error: "Password reset email delivery is not configured." });
});

/** POST /api/auth/password-reset/confirm  { email, code, newPassword } */
router.post("/auth/password-reset/confirm", async (req, res) => {
  res.status(409).json({ error: "Password reset email delivery is not configured." });
});

export default router;
