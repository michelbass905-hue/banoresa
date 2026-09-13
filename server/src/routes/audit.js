import { desc } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { auditLog } from "../db/schema.js";

const router = Router();

router.get("/", async (_req, res) => {
  res.json(await db.select().from(auditLog).orderBy(desc(auditLog.timestamp)).limit(100));
});

export default router;
