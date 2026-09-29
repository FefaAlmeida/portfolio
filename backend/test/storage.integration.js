import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { configuration } from "../src/config.js";
import { createStorage } from "../src/storage.js";
import { openDatabase, now } from "../src/db.js";
import { createBackup, restoreBackup, hash } from "../src/backup.js";
test("real MinIO: upload, backup, restore into empty storage, persistence", async () => {
  const config = configuration({
    ...process.env,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "portfolio-dev",
    S3_SECRET_ACCESS_KEY:
      process.env.S3_SECRET_ACCESS_KEY || "portfolio-local-only-password",
  });
  const storage = createStorage({
    ...config.s3,
    bucket: `portfolio-test-${randomUUID()}`,
  });
  const restoredStorage = createStorage({
    ...config.s3,
    bucket: `portfolio-test-${randomUUID()}`,
  });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-s3-"));
  const database = path.join(directory, "live.sqlite");
  let db = openDatabase(database);
  const id = randomUUID(),
    bytes = Buffer.from("%PDF-1.4\n%%EOF");
  try {
    await storage.initialize();
    await restoredStorage.initialize();
    const uploadPath = path.join(directory, "file.pdf");
    await fs.writeFile(uploadPath, bytes);
    await storage.putFile(id, uploadPath, "application/pdf", bytes.length);
    const parts = [];
    for await (const chunk of await storage.stream(id, "bytes=0-4")) parts.push(chunk);
    assert.deepEqual(Buffer.concat(parts), bytes.subarray(0, 5));
    assert.deepEqual(await storage.get(id), bytes);
    db.prepare("INSERT INTO assets(id,object_key,name,mime,size,sha256,created_at) VALUES(?,?,?,?,?,?,?)").run(
      id,
      id,
      "file.pdf",
      "application/pdf",
      bytes.length,
      hash(bytes),
      now(),
    );
    const backup = await createBackup(
      db,
      storage,
      path.join(directory, "backups"),
    );
    db.close();
    db = openDatabase(database);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM assets").get().n, 1);
    const restored = path.join(directory, "restored.sqlite");
    await restoreBackup(
      path.join(directory, "backups", backup.name),
      restoredStorage,
      restored,
    );
    assert.deepEqual(await restoredStorage.get(id), bytes);
    const copy = openDatabase(restored);
    assert.equal(
      copy.prepare("SELECT sha256 FROM assets").get().sha256,
      hash(bytes),
    );
    copy.close();
  } finally {
    await storage.remove(id).catch(() => {});
    await restoredStorage.remove(id).catch(() => {});
    storage.close();
    restoredStorage.close();
    db.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
