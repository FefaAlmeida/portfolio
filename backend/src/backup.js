import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { openDatabase } from "./db.js";
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const tables = ["migrations", "admin", "entries", "assets", "entry_i18n", "i18n_settings", "translation_usage", "translation_reviews"];
function logicalState(db) {
  const available = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
  return Object.fromEntries(
    tables.filter((table) => available.has(table)).map((table) => [
      table,
      db
        .prepare(`SELECT * FROM ${table} ORDER BY 1`)
        .all()
        .map((row) => {
          if (table !== "entries") return row;
          const { revision, updated_at, ...content } = row;
          return content;
        }),
    ]),
  );
}
export async function verifyBackup(directory) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(directory, "manifest.json"), "utf8"),
  );
  if (manifest.version !== 1 || !Array.isArray(manifest.assets))
    throw new Error("Manifesto de backup inválido.");
  const database = path.join(directory, "portfolio.sqlite");
  if (hash(await fs.readFile(database)) !== manifest.databaseHash)
    throw new Error("Hash do banco divergente.");
  const db = new Database(database, { readonly: true, fileMustExist: true });
  try {
    if (db.pragma("integrity_check", { simple: true }) !== "ok")
      throw new Error("Banco corrompido.");
    if (hash(JSON.stringify(logicalState(db))) !== manifest.contentHash)
      throw new Error("Conteúdo do banco divergente.");
    const rows = db.prepare("SELECT * FROM assets ORDER BY id").all();
    if (JSON.stringify(rows) !== JSON.stringify(manifest.assets))
      throw new Error("Lista de arquivos divergente.");
    for (const asset of rows) {
      if (!/^[\da-f-]{36}$/.test(asset.id) || asset.object_key !== asset.id)
        throw new Error("Identificador inválido.");
      const bytes = await fs.readFile(
        path.join(directory, "objects", asset.id),
      );
      if (bytes.length !== asset.size || hash(bytes) !== asset.sha256)
        throw new Error(`Arquivo corrompido: ${asset.id}`);
    }
  } finally {
    db.close();
  }
  return manifest;
}
export async function listBackups(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  return (await fs.readdir(directory))
    .filter((n) => /^snapshot-[\dTZ-]+-[\da-f-]+$/.test(n))
    .sort();
}
// Caller holds the same gate used by every content/media/admin mutation.
export async function createBackup(db, storage, directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const staging = await fs.mkdtemp(path.join(directory, ".pending-"));
  try {
    const filename = path.join(staging, "portfolio.sqlite");
    await db.backup(filename);
    const snapshot = new Database(filename);
    let assets, contentHash;
    try {
      snapshot.exec(
        "DELETE FROM sessions; DELETE FROM operations WHERE key != 'seeded';",
      );
      snapshot.pragma("journal_mode = DELETE");
      assets = snapshot.prepare("SELECT * FROM assets ORDER BY id").all();
      contentHash = hash(JSON.stringify(logicalState(snapshot)));
    } finally {
      snapshot.close();
    }
    await fs.chmod(filename, 0o600);
    await fs.mkdir(path.join(staging, "objects"), { mode: 0o700 });
    for (const asset of assets) {
      const bytes = await storage.get(asset.object_key);
      if (hash(bytes) !== asset.sha256 || bytes.length !== asset.size)
        throw new Error(`Arquivo de origem divergente: ${asset.id}`);
      await fs.writeFile(path.join(staging, "objects", asset.id), bytes, {
        mode: 0o600,
      });
    }
    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      contentHash,
      databaseHash: hash(await fs.readFile(filename)),
      assets,
    };
    await fs.writeFile(
      path.join(staging, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      { mode: 0o600 },
    );
    await verifyBackup(staging);
    const previous = await listBackups(directory);
    const latest = previous.at(-1);
    const lastManifest = latest
      ? await verifyBackup(path.join(directory, latest))
      : null;
    const name = `snapshot-${new Date().toISOString().replace(/[.:]/g, "-")}-${randomUUID()}`;
    await fs.rename(staging, path.join(directory, name));
    // Only prune after the new complete copy has been verified and atomically committed.
    if (latest && lastManifest.contentHash === contentHash)
      await fs.rm(path.join(directory, latest), { recursive: true });
    const retained = await listBackups(directory);
    for (const old of retained.slice(0, -7))
      await fs.rm(path.join(directory, old), { recursive: true });
    return {
      name,
      changed: lastManifest?.contentHash !== contentHash,
      retained: (await listBackups(directory)).length,
    };
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}
export async function restoreBackup(directory, storage, database) {
  const manifest = await verifyBackup(directory);
  const source = new Database(path.join(directory, "portfolio.sqlite"), {
    readonly: true,
  });
  try {
    if (
      source.prepare("SELECT MAX(version) AS v FROM migrations").get().v > 8
    )
      throw new Error("Versão de banco incompatível.");
  } finally {
    source.close();
  }
  for (const asset of manifest.assets) {
    const bytes = await fs.readFile(path.join(directory, "objects", asset.id));
    await storage.put(asset.object_key, bytes, asset.mime);
    if (hash(await storage.get(asset.object_key)) !== asset.sha256)
      throw new Error("Falha ao verificar arquivo restaurado.");
  }
  await fs.mkdir(path.dirname(database), { recursive: true, mode: 0o700 });
  const temporary = `${database}.restore-${randomUUID()}`;
  await fs.copyFile(path.join(directory, "portfolio.sqlite"), temporary);
  // Restoring content must never restore already-spent translation credit.
  let current;
  try {
    current = new Database(database, { readonly: true, fileMustExist: true });
    if (current.prepare("SELECT 1 FROM sqlite_master WHERE name='translation_usage'").get()) {
      const restored = openDatabase(temporary);
      try {
        restored.transaction(() => {
          for (const usage of current.prepare("SELECT * FROM translation_usage").all()) {
            restored.prepare("INSERT OR REPLACE INTO translation_usage(created_at,reserved_usd_micros,actual_usd_micros,status,usd_brl_rate,request_key) VALUES(?,?,?,?,?,?)")
              .run(usage.created_at, usage.reserved_usd_micros, usage.actual_usd_micros, usage.status, usage.usd_brl_rate || 7, usage.request_key || `${usage.created_at}:${usage.id}`);
          }
          const start = current.prepare("SELECT value FROM i18n_settings WHERE key='budget_started_at'").get();
          if (start) restored.prepare("INSERT OR REPLACE INTO i18n_settings(key,value) VALUES('budget_started_at',?)").run(start.value);
        })();
        restored.pragma("wal_checkpoint(TRUNCATE)");
      } finally { restored.close(); }
    }
  } catch (error) {
    if (error.code !== "SQLITE_CANTOPEN") throw error;
  } finally { current?.close(); }
  await fs.chmod(temporary, 0o600);
  for (const suffix of ["-wal", "-shm"])
    await fs.rm(`${database}${suffix}`, { force: true });
  await fs.rename(temporary, database);
  return manifest;
}
