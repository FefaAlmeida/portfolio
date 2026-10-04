// Local source editing only. Production never starts this synchronizer.
import fs from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { schemas } from "./schema.js";
import { migrateProjectDescription } from "./project-payload.js";
import { now } from "./db.js";

const snapshotKey = "dev-content-snapshot";
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Only fields changed in the source overwrite the database. Media and other
// fields absent from the seed remain owned by the admin panel.
function mergeChanges(current, previous, next) {
  if (isDeepStrictEqual(previous, next)) return current;
  if (!object(next)) return structuredClone(next);
  const result = object(current) ? structuredClone(current) : {};
  for (const key of new Set([...Object.keys(previous || {}), ...Object.keys(next)])) {
    if (!Object.hasOwn(next, key)) delete result[key];
    else result[key] = mergeChanges(result[key], previous?.[key], next[key]);
  }
  return result;
}

export function syncDevContent(db, data) {
  const saved = db.prepare("SELECT value FROM operations WHERE key=?").get(snapshotKey);
  const previous = saved ? JSON.parse(saved.value) : {};
  let changed = 0;
  db.transaction(() => {
    for (const [kind, items] of Object.entries(data)) {
      if (!schemas[kind] || !Array.isArray(items)) throw new Error(`Conteúdo inválido: ${kind}`);
      for (const item of items) {
        const { id, imageFile, imagemBg, ...raw } = item;
        const next = kind === "projetos" ? migrateProjectDescription(raw) : raw;
        const oldItem = previous[kind]?.find((entry) => entry.id === id);
        const { id: oldId, imageFile: oldImage, imagemBg: oldBackground, ...oldRaw } = oldItem || {};
        const old = oldItem && kind === "projetos" ? migrateProjectDescription(oldRaw) : oldRaw;
        const row = db.prepare("SELECT * FROM entries WHERE id=? AND kind=?").get(id, kind);
        // Deletions, new entries and image imports stay under the admin/seed flow.
        if (!row) continue;
        const draft = JSON.parse(row.draft);
        const published = row.published ? JSON.parse(row.published) : null;
        const updated = schemas[kind].parse(mergeChanges(published || draft, old, next));
        // Keep any independent unpublished draft intact.
        const updatedDraft = published && !isDeepStrictEqual(draft, published)
          ? draft : updated;
        const updatedPublic = published ? updated : null;
        if (isDeepStrictEqual(draft, updatedDraft) && isDeepStrictEqual(published, updatedPublic)) continue;
        db.prepare("UPDATE entries SET draft=?, published=?, revision=revision+1, updated_at=? WHERE id=?")
          .run(JSON.stringify(updatedDraft), updatedPublic ? JSON.stringify(updatedPublic) : null, now(), id);
        changed++;
      }
    }
    db.prepare("INSERT OR REPLACE INTO operations(key,value) VALUES(?,?)")
      .run(snapshotKey, JSON.stringify(data));
  })();
  return changed;
}

export function startDevContentSync({ db, gate, filename = new URL("../seed/content.json", import.meta.url), interval = 500 }) {
  let lastSource;
  let lastError;
  let stopped = false;
  let timer;
  async function tick() {
    try {
      const source = await fs.readFile(filename, "utf8");
      if (source !== lastSource && !stopped) {
        const data = JSON.parse(source);
        await gate(() => {
          if (stopped || !db.prepare("SELECT 1 FROM operations WHERE key='seeded'").get()) return;
          const changed = syncDevContent(db, data);
          lastSource = source;
          lastError = undefined;
          if (changed) console.log(`[dev] ${changed} item(ns) atualizado(s) a partir de seed/content.json.`);
        });
      }
    } catch (error) {
      if (error.message !== lastError) console.error(`[dev] Conteúdo não atualizado: ${error.message}`);
      lastError = error.message;
    } finally {
      if (!stopped) timer = setTimeout(tick, interval);
    }
  }
  void tick();
  return () => { stopped = true; clearTimeout(timer); };
}
