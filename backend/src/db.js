import Database from "better-sqlite3";
import { migrateProjectPayload, migrateProjectDescription, migrateProjectRole, migrateProjectProfiles } from "./project-payload.js";
import { mkdirSync } from "node:fs";
import path from "node:path";
export function openDatabase(filename) {
  if (filename !== ":memory:")
    mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(
    "CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY)",
  );
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 1").get())
    db.transaction(() => {
      db.exec(`
      CREATE TABLE admin (id INTEGER PRIMARY KEY CHECK (id = 1), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
      CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, admin_id INTEGER REFERENCES admin(id), expires_at INTEGER NOT NULL);
      CREATE TABLE entries (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('projetos','experiencias','premios')), position INTEGER NOT NULL, draft TEXT NOT NULL, published TEXT, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
      CREATE INDEX entries_kind_position ON entries(kind, position);
      CREATE TABLE assets (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE operations (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO migrations(version) VALUES (1);
    `);
    })();
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 2").get()) {
    // Preflight every version before touching schema or content.
    const rows = db
      .prepare("SELECT id, draft, published FROM entries WHERE kind='projetos'")
      .all();
    let migrated;
    try {
      migrated = rows.map((row) => ({
        id: row.id,
        draft: JSON.stringify(migrateProjectPayload(JSON.parse(row.draft))),
        published: row.published
          ? JSON.stringify(migrateProjectPayload(JSON.parse(row.published)))
          : null,
      }));
    } catch (error) {
      db.close();
      throw error;
    }
    db.transaction(() => {
      db.exec(
        "ALTER TABLE assets ADD COLUMN metadata TEXT; INSERT INTO migrations(version) VALUES(2)",
      );
      const update = db.prepare(
        "UPDATE entries SET draft=?, published=?, revision=revision+1 WHERE id=?",
      );
      for (const row of migrated) update.run(row.draft, row.published, row.id);
    })();
  }
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 3").get()) {
    db.transaction(() => {
      const update = db.prepare(
        "UPDATE entries SET draft=?, published=?, revision=revision+1 WHERE id=?",
      );
      for (const row of db.prepare("SELECT id, draft, published FROM entries WHERE kind='projetos'").all()) {
        update.run(
          JSON.stringify(migrateProjectDescription(JSON.parse(row.draft))),
          row.published ? JSON.stringify(migrateProjectDescription(JSON.parse(row.published))) : null,
          row.id,
        );
      }
      db.prepare("INSERT INTO migrations(version) VALUES(3)").run();
    })();
  }
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 4").get()) {
    db.transaction(() => {
      const update = db.prepare(
        "UPDATE entries SET draft=?, published=?, revision=revision+1 WHERE id=?",
      );
      for (const row of db.prepare("SELECT id, draft, published FROM entries WHERE kind='projetos'").all()) {
        update.run(
          JSON.stringify(migrateProjectRole(JSON.parse(row.draft))),
          row.published ? JSON.stringify(migrateProjectRole(JSON.parse(row.published))) : null,
          row.id,
        );
      }
      db.prepare("INSERT INTO migrations(version) VALUES(4)").run();
    })();
  }
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 5").get()) {
    db.transaction(() => {
      const update = db.prepare(
        "UPDATE entries SET draft=?, published=?, revision=revision+1 WHERE id=?",
      );
      for (const row of db.prepare("SELECT id, draft, published FROM entries WHERE kind='projetos'").all()) {
        update.run(
          JSON.stringify(migrateProjectProfiles(JSON.parse(row.draft))),
          row.published ? JSON.stringify(migrateProjectProfiles(JSON.parse(row.published))) : null,
          row.id,
        );
      }
      db.prepare("INSERT INTO migrations(version) VALUES(5)").run();
    })();
  }
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 6").get()) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS entry_i18n (
          entry_id TEXT PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
          source_locale TEXT NOT NULL DEFAULT 'pt-BR',
          draft_en TEXT,
          published_en TEXT,
          protected_units TEXT NOT NULL DEFAULT '[]',
          pending_units TEXT NOT NULL DEFAULT '[]'
        );
        CREATE TABLE IF NOT EXISTS i18n_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS translation_usage (
          id INTEGER PRIMARY KEY,
          created_at TEXT NOT NULL,
          reserved_usd_micros INTEGER NOT NULL,
          actual_usd_micros INTEGER,
          status TEXT NOT NULL
        );
        INSERT OR IGNORE INTO entry_i18n(entry_id)
        SELECT id FROM entries;
        INSERT INTO migrations(version) VALUES (6);
      `);
    })();
  }
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 7").get()) {
    db.transaction(() => {
      const columns = db.pragma("table_info(translation_usage)").map((column) => column.name);
      if (!columns.includes("usd_brl_rate")) db.exec("ALTER TABLE translation_usage ADD COLUMN usd_brl_rate REAL NOT NULL DEFAULT 7");
      if (!columns.includes("request_key")) db.exec("ALTER TABLE translation_usage ADD COLUMN request_key TEXT");
      db.exec(`UPDATE translation_usage SET request_key = created_at || ':' || id WHERE request_key IS NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS translation_request_key ON translation_usage(request_key);
        INSERT INTO migrations(version) VALUES(7);`);
    })();
  }
  if (!db.prepare("SELECT 1 FROM migrations WHERE version = 8").get()) {
    db.transaction(() => {
      db.exec("CREATE TABLE IF NOT EXISTS translation_reviews(subject TEXT PRIMARY KEY,state TEXT NOT NULL); INSERT INTO migrations(version) VALUES(8)");
    })();
  }
  return db;
}
// One API process owns all mutations, including backups and cleanup.
export function createGate() {
  let tail = Promise.resolve();
  return function exclusive(task) {
    const next = tail.then(task);
    tail = next.catch(() => {});
    return next;
  };
}
export const now = () => new Date().toISOString();
export function assetIds(payload) {
  return [
    payload?.imagemId,
    payload?.imagemSecundariaId,
    payload?.credencialId,
    ...(payload?.midias || []).map((media) => media.assetId),
  ].filter(Boolean);
}
export function referencedAssets(db, publishedOnly = false) {
  const ids = new Set();
  for (const row of db.prepare("SELECT draft, published FROM entries").all()) {
    for (const json of publishedOnly
      ? [row.published]
      : [row.draft, row.published]) {
      if (json) for (const id of assetIds(JSON.parse(json))) ids.add(id);
    }
  }
  if (!publishedOnly) for (const row of db.prepare("SELECT state FROM translation_reviews").all()) {
    for (const draft of Object.values(JSON.parse(row.state).drafts || {}))
      for (const id of assetIds(draft)) ids.add(id);
  }
  for (const id of [...ids]) {
    const asset = db.prepare("SELECT metadata FROM assets WHERE id=?").get(id);
    const posterId = asset?.metadata && JSON.parse(asset.metadata).posterId;
    if (posterId) ids.add(posterId);
  }
  return ids;
}
