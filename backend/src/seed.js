import { initializeMediaMetadata } from "./media.js";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { schemas } from "./schema.js";
import { migrateProjectDescription } from "./project-payload.js";
import { now } from "./db.js";
import { hash } from "./backup.js";
export async function seed(db, storage) {
  if (db.prepare("SELECT 1 FROM operations WHERE key = 'seeded'").get())
    return { imported: false };
  if (db.prepare("SELECT COUNT(*) AS n FROM entries").get().n)
    throw new Error("Importação recusada: o banco já contém itens.");
  const directory = fileURLToPath(new URL("../seed/", import.meta.url));
  const data = JSON.parse(
    await fs.readFile(path.join(directory, "content.json"), "utf8"),
  );
  const assets = [],
    rows = [];
  for (const [kind, items] of Object.entries(data)) {
    for (const [position, item] of items.entries()) {
      const { id, imageFile, ...payload } = item;
      if (imageFile) {
        const bytes = await fs.readFile(
          path.join(directory, "images", path.basename(imageFile)),
        );
        const type = await fileTypeFromBuffer(bytes);
        const assetId = randomUUID();
        await storage.put(assetId, bytes, type.mime);
        assets.push([
          assetId,
          assetId,
          path.basename(imageFile),
          type.mime,
          bytes.length,
          hash(bytes),
          now(),
        ]);
        payload.imagemId = assetId;
      }
      const parsed = schemas[kind].parse(kind === "projetos" ? migrateProjectDescription(payload) : payload);
      rows.push([
        id,
        kind,
        position,
        JSON.stringify(parsed),
        JSON.stringify(parsed),
        now(),
      ]);
    }
  }
  db.transaction(() => {
    for (const asset of assets)
      db.prepare("INSERT INTO assets(id,object_key,name,mime,size,sha256,created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        ...asset,
      );
    for (const row of rows)
      db.prepare(
        "INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES(?,?,?,?,?,?)",
      ).run(...row);
    for (const row of rows)
      db.prepare("INSERT INTO entry_i18n(entry_id) VALUES(?)").run(row[0]);
    db.prepare("INSERT INTO operations VALUES ('seeded', ?)").run(now());
  })();
  await initializeMediaMetadata(db, storage);
  return { imported: true, count: rows.length };
}
