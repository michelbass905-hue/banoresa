import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { rooms, roomTypes } from "../db/schema.js";

const router = Router();

router.get("/", async (_req, res) => { res.json(await db.select().from(rooms)); });
router.get("/types", async (_req, res) => { res.json(await db.select().from(roomTypes)); });

router.post("/", async (req, res) => {
  const { roomNumber, typeId } = req.body;
  if (!roomNumber || !typeId) {
    return res.status(400).json({ error: "Room number and room type are both required." });
  }
  const [existing] = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
  if (existing) {
    return res.status(409).json({ error: `Room ${roomNumber} already exists.` });
  }
  await db.insert(rooms).values({ roomNumber, typeId, status: "available" });
  res.status(201).json({ ok: true });
});

router.delete("/:roomNumber", async (req, res) => {
  const roomNumber = Number(req.params.roomNumber);
  const [room] = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
  if (!room) return res.status(404).json({ error: "Room not found." });
  if (room.status !== "available") {
    return res.status(409).json({ error: "Only an available room can be removed." });
  }
  await db.delete(rooms).where(eq(rooms.roomNumber, roomNumber));
  res.json({ ok: true });
});

export default router;
