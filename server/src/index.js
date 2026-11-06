import "dotenv/config";
import app from "./app.js";
import { releaseExpiredLocks } from "./services/lockService.js";
import { ensureSchema, seedIfEmpty } from "./db/migrate.js";

const PORT = process.env.PORT || 4000;

await ensureSchema();
await seedIfEmpty();

app.listen(PORT, () => console.log(`BanoResa API listening on port ${PORT}`));

setInterval(() => {
  releaseExpiredLocks().catch((err) => console.error("Lock release job failed:", err));
}, 30_000);
