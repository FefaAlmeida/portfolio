// Explicit, one-time application of the reviewed bilingual extracurricular copy.
// Stop the API first: the database lease prevents concurrent writers.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase, now } from "../src/db.js";
import { databaseLease } from "../src/lease.js";
import { schemas } from "../src/schema.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const filename = path.resolve(process.argv[2] || path.join(root, "data/portfolio.sqlite"));
const source = JSON.parse(await fs.readFile(path.join(root, "seed/content.json"), "utf8"));
const english = JSON.parse(await fs.readFile(path.join(root, "seed/experiencias-en.json"), "utf8"));
const release = await databaseLease(filename);
let db;
try {
  db = openDatabase(filename);
  const rows = db.prepare("SELECT * FROM entries WHERE kind='experiencias' ORDER BY position").all();
  const translated = db.prepare("SELECT i.* FROM entry_i18n i JOIN entries e ON i.entry_id=e.id WHERE e.kind='experiencias'").all();
  const backup = path.join(path.dirname(filename), "backups", `experiences-${Date.now()}.json`);
  await fs.mkdir(path.dirname(backup), { recursive: true });
  await fs.writeFile(backup, JSON.stringify({ entries: rows, i18n: translated }, null, 2), { mode: 0o600, flag: "wx" });
  const changes = source.experiencias.map((item, position) => {
    const row = rows.find((r) => r.id === item.id);
    if (!row) throw new Error(`Registro ausente: ${item.id}`);
    const en = english.find((entry) => entry.id === item.id);
    if (!en) throw new Error(`Tradução ausente: ${item.id}`);
    const current = JSON.parse(row.published || row.draft);
    const parse = ({ id, imageFile, imagemBg, ...payload }) => schemas.experiencias.parse({ ...payload, imagemId: current.imagemId });
    return { row, position, pt: JSON.stringify(parse(item)), en: JSON.stringify(parse(en)) };
  });
  db.transaction(() => {
    for (const { row, position, pt, en } of changes) {
      db.prepare("UPDATE entries SET position=?,draft=?,published=?,revision=revision+1,updated_at=? WHERE id=?")
        .run(position, pt, row.published ? pt : null, now(), row.id);
      db.prepare("INSERT INTO entry_i18n(entry_id,source_locale,draft_en,published_en,protected_units,pending_units) VALUES(?,'pt-BR',?,?,'[]','[]') ON CONFLICT(entry_id) DO UPDATE SET source_locale='pt-BR',draft_en=excluded.draft_en,published_en=excluded.published_en,protected_units='[]',pending_units='[]'")
        .run(row.id, en, row.published ? en : null);
    }
    const lector = rows.find((row) => row.id === "db20041e-de79-40ac-b4a1-8863c580e928" && JSON.parse(row.draft).titulo === "Lector Hub");
    if (lector) {
      db.prepare("UPDATE entries SET published=NULL,revision=revision+1,updated_at=? WHERE id=?").run(now(), lector.id);
      db.prepare("UPDATE entry_i18n SET published_en=NULL WHERE entry_id=?").run(lector.id);
    }
    const snapshot = db.prepare("SELECT value FROM operations WHERE key='dev-content-snapshot'").get();
    if (snapshot) {
      const previous = JSON.parse(snapshot.value);
      previous.experiencias = source.experiencias;
      db.prepare("UPDATE operations SET value=? WHERE key='dev-content-snapshot'").run(JSON.stringify(previous));
    }
  })();
  console.log(`Aplicados ${changes.length} registros PT/EN. Backup: ${backup}`);
} finally {
  db?.close();
  await release();
}
