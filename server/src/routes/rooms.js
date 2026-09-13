import { Router } from "express";
import { db } from "../db/client.js";
import { rooms, roomTypes } from "../db/schema.js";

const router = Router();

router.get("/", async (_req, res) => { res.json(await db.select().from(rooms)); });
router.get("/types", async (_req, res) => { res.json(await db.select().from(roomTypes)); });

export default router;
