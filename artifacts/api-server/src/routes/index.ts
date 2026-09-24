import { Router, type IRouter } from "express";
import healthRouter    from "./health.js";
import authRouter      from "./auth.js";
import usersRouter     from "./users.js";
import statsRouter     from "./stats.js";
import dataRouter      from "./data.js";
import uploadsRouter   from "./uploads.js";
import modulesRouter   from "./modules.js";
import reportsRouter   from "./reports.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(statsRouter);
router.use(uploadsRouter);
router.use(modulesRouter);
router.use(reportsRouter);
router.use(dataRouter);

export default router;
