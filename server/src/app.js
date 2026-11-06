import cors from "cors";
import express from "express";
import auditRouter from "./routes/audit.js";
import reservationsRouter from "./routes/reservations.js";
import roomsRouter from "./routes/rooms.js";
import reportsRouter from "./routes/reports.js";

// The Express application, without starting the server.
// It is used by src/index.js (normal server) and by api/index.js (Vercel).
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/reservations", reservationsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/audit-log", auditRouter);
app.use("/api/reports", reportsRouter);

export default app;
