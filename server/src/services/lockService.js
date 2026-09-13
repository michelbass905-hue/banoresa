import { and, eq, lte } from "drizzle-orm";
import { db } from "../db/client.js";
import { auditLog, reservations, rooms } from "../db/schema.js";

const LOCK_MINUTES = Number(process.env.ROOM_LOCK_MINUTES || 30);

export function lockExpiryDate() {
  return new Date(Date.now() + LOCK_MINUTES * 60_000);
}

export async function releaseExpiredLocks() {
  const expired = await db.select().from(reservations)
    .where(and(eq(reservations.status, "locked"), lte(reservations.lockExpiry, new Date())));
  for (const r of expired) {
    await db.update(reservations).set({ status: "expired" }).where(eq(reservations.resId, r.resId));
    await db.update(rooms).set({ status: "available" }).where(eq(rooms.roomNumber, r.roomNumber));
    await db.insert(auditLog).values({ resId: r.resId, action: "LOCK_EXPIRED", newData: "available", agentId: "system", timestamp: new Date() });
  }
  return expired.length;
  }
