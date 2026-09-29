import { initializeMediaMetadata } from "./media.js";
import { databaseLease } from "./lease.js";
import cron from "node-cron";
import { configuration } from "./config.js";
import { openDatabase } from "./db.js";
import { createStorage } from "./storage.js";
import { createApp } from "./app.js";
const config = configuration();
const release = await databaseLease(config.database);
const db = openDatabase(config.database);
const storage = createStorage(config.s3);
await storage.initialize();
await initializeMediaMetadata(db, storage);
const app = createApp({ db, storage, config });
const stopContentSync = process.env.NODE_ENV === "development"
  ? (await import("./dev-content.js")).startDevContentSync({ db, gate: app.locals.gate })
  : () => {};
const server = app.listen(config.port, "0.0.0.0", () =>
  console.log(`API ouvindo na porta ${config.port}`),
);
const task = cron.schedule(
  config.backupSchedule,
  () =>
    app.locals
      .backup()
      .then((result) => console.log("Backup concluído:", result.name))
      .catch((error) => console.error("BACKUP FAILED:", error.message)),
  { timezone: "America/Sao_Paulo", noOverlap: true },
);
let closing = false;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    task.stop();
    stopContentSync();
    server.close(async () => {
      await app.locals.gate(async () => {
        db.close();
        storage.close();
        await release();
      });
      process.exit(0);
    });
  });
