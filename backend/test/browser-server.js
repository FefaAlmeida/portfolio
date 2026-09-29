// Ephemeral fixture used only by Playwright; production never imports this file.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import argon2 from "argon2";
import { openDatabase } from "../src/db.js";
import { createApp } from "../src/app.js";
import { seed } from "../src/seed.js";
const directory = await fs.mkdtemp(
  path.join(os.tmpdir(), "portfolio-browser-"),
);
const db = openDatabase(path.join(directory, "db.sqlite"));
db.prepare("INSERT INTO admin VALUES(1,?,?)").run(
  "editor@example.com",
  await argon2.hash("browser-test-password"),
);
const files = new Map();
const storage = {
  ready: async () => {},
  put: async (k, v) => files.set(k, Buffer.from(v)),
  get: async (k) => files.get(k),
  remove: async (k) => files.delete(k),
};
await seed(db, storage);
// Pretranslated fixtures keep browser tests independent of paid services.
db.exec("UPDATE entry_i18n SET draft_en=(SELECT draft FROM entries WHERE id=entry_id), published_en=(SELECT published FROM entries WHERE id=entry_id)");
const app = createApp({
  db,
  storage,
  translate: async (units) => structuredClone(units),
  limit: false,
  config: {
    production: false,
    publicUrl: "http://localhost:3100",
    adminUrl: process.env.ADMIN_URL || "http://localhost:3100",
    operationsToken: "browser-test-only-token-32-characters",
    backupDir: path.join(directory, "backups"),
  },
});
const server = app.listen(3101, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      db.close();
      await fs.rm(directory, { recursive: true, force: true });
      process.exit(0);
    }),
  );
