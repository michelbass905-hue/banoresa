import "dotenv/config";
import cors from "cors";
import express from "express";
import auditRouter from "./routes/audit.js";
import reservationsRouter from "./routes/reservations.js";
import roomsRouter from "./routes/rooms.js";
import { releaseExpiredLocks } from "./services/lockService.js";
import { ensureSchema, seedIfEmpty } from "./db/migrate.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/reservations", reservationsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/audit-log", auditRouter);

const PORT = process.env.PORT || 4000;

await ensureSchema();
await seedIfEmpty();

app.listen(PORT, () => console.log(`BanoResa API listening on port ${PORT}`));

setInterval(() => {
  releaseExpiredLocks().catch((err) => console.error("Lock release job failed:", err));
}, 30_000);
