import { Router } from "express";
import { mockStore } from "../lib/mock-store.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function sanitize(u: ReturnType<typeof mockStore.findUserById>) {
  if (!u) return null;
  const { password: _pw, ...safe } = u as any;
  return safe;
}

/** POST /api/auth/login  { email, password } */
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const user = mockStore.findUserByEmail(email);
  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid email or password" });
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
router.get("/auth/me", requireAuth, (req, res) => {
  const user = mockStore.findUserById(req.jwtPayload!.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitize(user));
});

/** PATCH /api/auth/me  — update own profile */
router.patch("/auth/me", requireAuth, (req, res) => {
  const { password: _drop, role: _role, id: _id, ...patch } = req.body ?? {};
  const updated = mockStore.updateUser(req.jwtPayload!.sub, patch);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitize(updated));
});

export default router;
