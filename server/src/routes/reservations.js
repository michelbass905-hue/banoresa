import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { auditLog, clients, reservations, rooms } from "../db/schema.js";
import { db } from "../db/client.js";
import { lockExpiryDate } from "../services/lockService.js";

const router = Router();

router.post("/", async (req, res) => {
  const { name, phone, email, checkIn, checkOut, roomType } = req.body;
  if (!name || !phone || !checkIn || !checkOut || !roomType) {
    return res.status(400).json({ error: "Please fill in every field before continuing." });
  }
  const [freeRoom] = await db.select().from(rooms)
    .where(and(eq(rooms.typeId, roomType), eq(rooms.status, "available"))).limit(1);
  if (!freeRoom) {
    return res.status(409).json({ error: `No ${roomType} room is free right now.` });
  }
  const [{ insertId }] = await db.insert(clients).values({ name, phone, email });
  const resId = `BR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const lockExpiry = lockExpiryDate();
  await db.insert(reservations).values({
    resId, clientId: insertId, roomNumber: freeRoom.roomNumber,
    checkIn: new Date(checkIn), checkOut: new Date(checkOut), status: "locked", lockExpiry,
  });
  await db.update(rooms).set({ status: "locked" }).where(eq(rooms.roomNumber, freeRoom.roomNumber));
  await db.insert(auditLog).values({ resId, action: "CREATE_LOCK", newData: `room ${freeRoom.roomNumber}`, agentId: "reception1", timestamp: new Date() });
  res.status(201).json({ resId, roomNumber: freeRoom.roomNumber, lockExpiry });
});

router.get("/", async (_req, res) => { res.json(await db.select().from(reservations)); });

router.post("/:resId/confirm", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
  await db.update(reservations).set({ status: "confirmed" }).where(eq(reservations.resId, resId));
  await db.update(rooms).set({ status: "confirmed" }).where(eq(rooms.roomNumber, r.roomNumber));
  await db.insert(auditLog).values({ resId, action: "CONFIRM", agentId: "reception1", timestamp: new Date() });
  res.json({ ok: true });
});

router.post("/:resId/cancel", async (req, res) => {
  const { resId } = req.params;
  const [r] = await db.select().from(reservations).where(eq(reservations.resId, resId));
  if (!r) return res.status(404).json({ error: "Reservation not found." });
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
