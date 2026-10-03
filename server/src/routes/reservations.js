import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { auditLog, clients, reservations, roomTypes, rooms } from "../db/schema.js";
import { db } from "../db/client.js";
import { lockExpiryDate } from "../services/lockService.js";

const router = Router();

const CHANNELS = ["whatsapp", "call", "email", "social_media"];

// Catches errors in async routes so the server answers instead of hanging.
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again." });
  });

function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayUtc() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

// Returns an error message, or null if the dates are correct.
function checkDates(checkIn, checkOut) {
  const a = parseDay(checkIn);
  const b = parseDay(checkOut);
  if (!a || !b) return "Dates must look like YYYY-MM-DD.";
  if (a < todayUtc()) return "Check-in cannot be in the past.";
  if (b <= a) return "Check-out must be after check-in.";
  return null;
}

router.post("/", wrap(async (req, res) => {
  const { name, phone, email, checkIn, checkOut, roomType, channel } = req.body;
  if (!name || !phone || !checkIn || !checkOut || !roomType || !channel) {
    return res.status(400).json({ error: "Please fill in every field before continuing." });
  }
  if (!CHANNELS.includes(channel)) {
    return res.status(400).json({ error: "Unknown channel." });
  }
  const dateError = checkDates(checkIn, checkOut);
  if (dateError) return res.status(400).json({ error: dateError });

  // Everything happens in one transaction. The room is taken with a single
  // UPDATE ... WHERE status = 'available', so two requests at the same moment
  // cannot get the same room: only one UPDATE can change the row.
  const created = await db.transaction(async (tx) => {
    const candidates = await tx.select().from(rooms)
      .where(and(eq(rooms.typeId, roomType), eq(rooms.status, "available")));
    for (const room of candidates) {
      const [taken] = await tx.update(rooms).set({ status: "locked" })
        .where(and(eq(rooms.roomNumber, room.roomNumber), eq(rooms.status, "available")));
      if (taken.affectedRows !== 1) continue;

      const [{ insertId }] = await tx.insert(clients).values({ name, phone, email });
      const resId = `BR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const lockExpiry = lockExpiryDate();
      await tx.insert(reservations).values({
        resId, clientId: insertId, roomNumber: room.roomNumber,
        checkIn: new Date(checkIn), checkOut: new Date(checkOut),
        status: "locked", lockExpiry, channel,
      });
      await tx.insert(auditLog).values({
        resId, action: "CREATE_LOCK", newData: `room ${room.roomNumber}, channel ${channel}`,
        agentId: "reception1", timestamp: new Date(),
      });
      return { resId, roomNumber: room.roomNumber, lockExpiry };
    }
    return null;
  });

  if (!created) {
    // No room of this type: tell the receptionist which other types are free.
    const free = await db.select().from(rooms).where(eq(rooms.status, "available"));
    const types = await db.select().from(roomTypes);
    const label = (id) => types.find((t) => t.typeId === id)?.label ?? id;
    const counts = {};
    for (const r of free) counts[r.typeId] = (counts[r.typeId] || 0) + 1;
    const others = Object.entries(counts)
      .filter(([id]) => id !== roomType)
      .map(([id, n]) => `${label(id)} (${n})`);
    let message = `No ${label(roomType)} room is free right now.`;
    if (others.length) message += ` Free now: ${others.join(", ")}.`;
    return res.status(409).json({ error: message });
  }
  res.status(201).json(created);
}));

router.get("/", async (_req, res) => { res.json(await db.select().from(reservations)); });

router.post("/:resId/confirm", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  if (r.status !== "locked") {
    return res.status(409).json({ error: "Only a locked reservation can be confirmed." });
  }
  if (r.lockExpiry && new Date(r.lockExpiry) <= new Date()) {
    return res.status(409).json({ error: "The lock has expired. Please make a new request." });
  }
  await db.update(reservations).set({ status: "confirmed" }).where(eq(reservations.resId, resId));
  await db.update(rooms).set({ status: "confirmed" }).where(eq(rooms.roomNumber, r.roomNumber));
  await db.insert(auditLog).values({ resId, action: "CONFIRM", agentId: "reception1", timestamp: new Date() });
  res.json({ ok: true });
});

router.post("/:resId/cancel", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  if (!["locked", "confirmed"].includes(r.status)) {
    return res.status(409).json({ error: "Only a locked or confirmed reservation can be cancelled." });
  }
  await db.update(reservations).set({ status: "cancelled" }).where(eq(reservations.resId, resId));
  await db.update(rooms).set({ status: "available" }).where(eq(rooms.roomNumber, r.roomNumber));
  await db.insert(auditLog).values({ resId, action: "CANCEL", agentId: "reception1", timestamp: new Date() });
  res.json({ ok: true });
});

router.patch("/:resId", async (req, res) => {
  const { resId } = req.params;
  const { checkIn, checkOut } = req.body;
  if (!checkIn || !checkOut) {
    return res.status(400).json({ error: "Check-in and check-out are both required." });
  }
  const dateError = checkDates(checkIn, checkOut);
  if (dateError) return res.status(400).json({ error: dateError });
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  if (["cancelled", "checked_out", "no_show", "expired"].includes(r.status)) {
    return res.status(409).json({ error: `Cannot modify a reservation that is already ${r.status}.` });
  }
  const oldData = `check_in=${r.checkIn.toISOString().slice(0, 10)}, check_out=${r.checkOut.toISOString().slice(0, 10)}`;
  const newData = `check_in=${checkIn}, check_out=${checkOut}`;
  await db.update(reservations).set({ checkIn: new Date(checkIn), checkOut: new Date(checkOut) }).where(eq(reservations.resId, resId));
  await db.insert(auditLog).values({ resId, action: "MODIFY", oldData, newData, agentId: "reception1", timestamp: new Date() });
  res.json({ ok: true });
});

router.post("/:resId/checkin", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  if (r.status !== "confirmed") {
    return res.status(409).json({ error: "Only a confirmed reservation can be checked in." });
  }
  await db.update(reservations).set({ status: "checked_in" }).where(eq(reservations.resId, resId));
  await db.insert(auditLog).values({ resId, action: "CHECK_IN", agentId: "supervisor1", timestamp: new Date() });
  res.json({ ok: true });
});

router.post("/:resId/checkout", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  if (r.status !== "checked_in") {
    return res.status(409).json({ error: "Only a checked-in guest can be checked out." });
  }
  await db.update(reservations).set({ status: "checked_out" }).where(eq(reservations.resId, resId));
  await db.update(rooms).set({ status: "available" }).where(eq(rooms.roomNumber, r.roomNumber));
  await db.insert(auditLog).values({ resId, action: "CHECK_OUT", agentId: "supervisor1", timestamp: new Date() });
  res.json({ ok: true });
});

router.post("/:resId/no-show", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  if (r.status !== "confirmed") {
    return res.status(409).json({ error: "Only a confirmed reservation can be marked as no-show." });
  }
  await db.update(reservations).set({ status: "no_show" }).where(eq(reservations.resId, resId));
  await db.update(rooms).set({ status: "available" }).where(eq(rooms.roomNumber, r.roomNumber));
  await db.insert(auditLog).values({ resId, action: "NO_SHOW", agentId: "supervisor1", timestamp: new Date() });
  res.json({ ok: true });
});

export default router; 
