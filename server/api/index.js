// Entry point for Vercel (serverless). A serverless function cannot keep a
// 30-second timer running, so expired locks are released when a request
// arrives (at most once every 5 seconds). The screens ask the server for new
// data every 4 seconds, so a lock is released within a few seconds of its end.
import app from "../src/app.js";
import { releaseExpiredLocks } from "../src/services/lockService.js";
import { ensureSchema, seedIfEmpty } from "../src/db/migrate.js";

let ready = null;
let lastRelease = 0;

function prepare() {
  if (!ready) {
    ready = (async () => {
      await ensureSchema();
      await seedIfEmpty();
    })().catch((err) => {
      ready = null; // try again on the next request
      throw err;
    });
  }
  return ready;
}

export default async function handler(req, res) {
  try {
    await prepare();
    if (Date.now() - lastRelease > 5000) {
      lastRelease = Date.now();
      await releaseExpiredLocks().catch((err) => console.error("Lock release failed:", err));
    }
  } catch (err) {
    console.error("Startup failed:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Database is not reachable" }));
  }
  return app(req, res);
}
