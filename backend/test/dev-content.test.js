import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { schemas } from "../src/schema.js";
import { syncDevContent } from "../src/dev-content.js";

function fixture(t) {
  const db = openDatabase(":memory:");
  t.after(() => db.close());
  const assetId = "11111111-1111-4111-8111-111111111111";
  const payload = schemas.projetos.parse({ titulo: "Original", detalhes: { periodo: "2024" }, midias: [{ assetId }], capaId: assetId });
  db.prepare("INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES('project','projetos',0,?,?,'original')")
    .run(JSON.stringify(payload), JSON.stringify(payload));
  const read = () => {
    const row = db.prepare("SELECT * FROM entries WHERE id='project'").get();
    return { ...row, draft: JSON.parse(row.draft), published: row.published && JSON.parse(row.published) };
  };
  const data = { projetos: [{ id: "project", titulo: "Novo", imagemBg: "#ffffff", imageFile: "cover.jpeg", detalhes: { periodo: "2025" } }] };
  return { db, read, data };
}

test("source edits update published data, preserve admin fields and remain idempotent across restarts", (t) => {
  const { db, read, data } = fixture(t);
  assert.equal(syncDevContent(db, data), 1);
  assert.equal(read().published.titulo, "Novo");
  assert.equal(read().published.midias.length, 1);
  assert.equal(read().published.capaId, "11111111-1111-4111-8111-111111111111");
  const admin = { ...read().published, subtitulo: "Editado no painel" };
  db.prepare("UPDATE entries SET draft=?,published=?").run(JSON.stringify(admin), JSON.stringify(admin));
  const changed = structuredClone(data);
  changed.projetos[0].detalhes.periodo = "2026";
  assert.equal(syncDevContent(db, changed), 1);
  assert.equal(read().published.subtitulo, "Editado no painel");
  assert.equal(read().published.detalhes.periodo, "2026");
  const revision = read().revision;
  assert.equal(syncDevContent(db, changed), 0);
  assert.equal(read().revision, revision);
});

test("independent drafts, private entries and deleted entries are preserved", (t) => {
  const { db, read, data } = fixture(t);
  const draft = { ...read().draft, titulo: "Rascunho ainda não publicado" };
  db.prepare("UPDATE entries SET draft=?").run(JSON.stringify(draft));
  syncDevContent(db, data);
  assert.equal(read().published.titulo, "Novo");
  assert.equal(read().published.midias.length, 1);
  assert.equal(read().published.capaId, "11111111-1111-4111-8111-111111111111");
  assert.equal(read().draft.titulo, draft.titulo);
  db.prepare("UPDATE entries SET published=NULL").run();
  data.projetos[0].titulo = "Outra edição";
  syncDevContent(db, data);
  assert.equal(read().published, null);
  db.prepare("DELETE FROM entries").run();
  syncDevContent(db, data);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 0);
});

test("invalid edits roll back all writes and can be corrected without a restart", (t) => {
  const { db, read, data } = fixture(t);
  const before = read();
  const invalid = { ...data, unknown: [] };
  assert.throws(() => syncDevContent(db, invalid));
  assert.deepEqual(read(), before);
  assert.equal(db.prepare("SELECT value FROM operations WHERE key='dev-content-snapshot'").get(), undefined);
  assert.equal(syncDevContent(db, data), 1);
});
