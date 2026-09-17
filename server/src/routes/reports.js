import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { reservations } from "../db/schema.js";

const router = Router();

router.get("/daily", async (_req, res) => {
  const confirmed = await db.select().from(reservations).where(eq(reservations.status, "confirmed"));

  const todayStr = new Date().toISOString().slice(0, 10);
  const arrivals = [];
  const overdue = [];
  for (const r of confirmed) {
    const checkInStr = new Date(r.checkIn).toISOString().slice(0, 10);
    if (checkInStr === todayStr) arrivals.push(r);
    else if (checkInStr < todayStr) overdue.push(r);
  }

  const all = await db.select().from(reservations);
  const isToday = (d) => new Date(d).toISOString().slice(0, 10) === todayStr;
  const summary = {
    confirmedToday: all.filter((r) => r.status === "confirmed" && isToday(r.checkIn)).length,
    checkedInToday: all.filter((r) => r.status === "checked_in").length,
    noShowToday: all.filter((r) => r.status === "no_show").length,
    cancelledToday: all.filter((r) => r.status === "cancelled").length,
  };

  res.json({ arrivals, overdue, summary });
});

export default router;
