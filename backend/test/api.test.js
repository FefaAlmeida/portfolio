import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { openDatabase, createGate } from "../src/db.js";
import { createApp } from "../src/app.js";
import {
  createBackup,
  listBackups,
  verifyBackup,
  restoreBackup,
  hash,
} from "../src/backup.js";
import { validDocument, schemas } from "../src/schema.js";
import { seed } from "../src/seed.js";
let db, directory, storage, app, agent, csrf, translationFailure;
const origin = "http://localhost:3000";
const doc = (text) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=",
  "base64",
);
function memoryStorage() {
  const files = new Map();
  return {
    files,
    ready: async () => {},
    initialize: async () => {},
    put: async (k, b) => files.set(k, Buffer.from(b)),
    get: async (k) => {
      if (!files.has(k)) throw new Error("Missing file");
      return Buffer.from(files.get(k));
    },
    remove: async (k) => files.delete(k),
  };
}
beforeEach(async () => {
  translationFailure = false;
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-test-"));
  db = openDatabase(path.join(directory, "live.sqlite"));
  db.prepare("INSERT INTO admin VALUES(1,?,?)").run(
    "admin@example.com",
    await argon2.hash("testing-password-long"),
  );
  storage = memoryStorage();
  app = createApp({
    db,
    storage,
    translate: async (units) => {
      if (translationFailure) throw Object.assign(new Error("Translation unavailable"), { status: 503 });
      return structuredClone(units);
    },
    limit: false,
    config: {
      publicUrl: origin,
      production: false,
      operationsToken: "test-operations-token-with-32-characters",
      backupDir: path.join(directory, "backups"),
    },
  });
  agent = request.agent(app);
  csrf = (await agent.get("/api/auth/session")).body.csrf;
  const login = await agent
    .post("/api/auth/login")
    .set("origin", origin)
    .set("x-csrf-token", csrf)
    .send({ email: "admin@example.com", password: "testing-password-long" });
  assert.equal(login.status, 200);
  csrf = login.body.csrf;
});
afterEach(async () => {
  db.close();
  await fs.rm(directory, { recursive: true, force: true });
});
const mutate = (method, url, body) =>
  agent[method](url).set("origin", origin).set("x-csrf-token", csrf).send(body);
async function review(row, kind = "projetos") {
  if (!row.review) return row;
  const url = `/api/admin/reviews/${kind}/${kind === "paginas" ? "site" : row.id}`;
  for (const [action, extra] of [["generate", {}], ["decide", { action: "approve-all" }], ["complete", {}]]) {
    row = (await mutate("post", `${url}/${action}`, { version: row.review.version, ...extra }).expect(200)).body;
  }
  return row;
}
test("authentication, CSRF, session revocation and reset", async () => {
  assert.equal(
    (await request(app).post("/api/admin/projetos").send({ titulo: "X" }))
      .status,
    401,
  );
  assert.equal(
    (await agent.post("/api/admin/projetos").send({ titulo: "X" })).status,
    403,
  );
  assert.equal(
    (
      await agent
        .post("/api/admin/projetos")
        .set("origin", "https://evil.example")
        .set("x-csrf-token", csrf)
        .send({ titulo: "X" })
    ).status,
    403,
  );
  const denied = await agent
    .post("/api/internal/admin")
    .send({ email: "x@y.com", password: "123456789012" });
  assert.equal(denied.status, 401);
  await mutate("post", "/api/auth/logout", {}).expect(200);
  assert.equal((await agent.get("/api/admin/projetos")).status, 401);
});
test("project status is restricted on creation and update", async () => {
  const row = (
    await mutate("post", "/api/admin/projetos", { titulo: "Projeto" }).expect(201)
  ).body;
  assert.equal(row.draft.tagDireita, "EM DESENVOLVIMENTO");
  for (const tagDireita of ["", "QUALQUER TEXTO"]) {
    await mutate("post", "/api/admin/projetos", {
      titulo: "Projeto",
      tagDireita,
    }).expect(400);
    await mutate("put", `/api/admin/projetos/${row.id}`, {
      revision: row.revision,
      draft: { ...row.draft, tagDireita },
    }).expect(400);
  }
  const updated = (
    await mutate("put", `/api/admin/projetos/${row.id}`, {
      revision: row.revision,
      draft: { ...row.draft, tagDireita: "FINALIZADO" },
    }).expect(200)
  ).body;
  assert.equal(updated.draft.tagDireita, "FINALIZADO");
});
test("draft isolation, publishing, conflict detection, hiding, deletion", async () => {
  let row = (
    await mutate("post", "/api/admin/projetos", { titulo: "Original" }).expect(
      201,
    )
  ).body;
  assert.deepEqual((await request(app).get("/api/projetos")).body, []);
  row = await review(row);
  row = (
    await mutate("post", `/api/admin/projetos/${row.id}/publish`, {
      revision: row.revision,
    }).expect(200)
  ).body;
  const oldRevision = row.revision;
  row = (
    await mutate("put", `/api/admin/projetos/${row.id}`, {
      revision: row.revision,
      draft: { ...row.draft, titulo: "Revisado" },
    }).expect(200)
  ).body;
  assert.equal(
    (await request(app).get("/api/projetos")).body[0].titulo,
    "Original",
  );
  await mutate("put", `/api/admin/projetos/${row.id}`, {
    revision: oldRevision,
    draft: row.draft,
  }).expect(409);
  row = await review(row);
  row = (
    await mutate("post", `/api/admin/projetos/${row.id}/publish`, {
      revision: row.revision,
    }).expect(200)
  ).body;
  assert.equal(
    (await request(app).get("/api/projetos")).body[0].titulo,
    "Revisado",
  );
  row = (
    await mutate("post", `/api/admin/projetos/${row.id}/hide`, {
      revision: row.revision,
    }).expect(200)
  ).body;
  assert.equal((await request(app).get("/api/projetos")).body.length, 0);
  await mutate("delete", `/api/admin/projetos/${row.id}`, {
    revision: row.revision,
  }).expect(200);
  assert.equal((await agent.get("/api/admin/projetos")).body.length, 0);
});
test("all content types, ordering and invalid reorder remain atomic", async () => {
  for (const kind of ["experiencias", "premios"]) {
    const one = (
      await mutate("post", `/api/admin/${kind}`, {
        titulo: "Primeiro",
        ...(kind === "premios" ? { ano: 2025 } : {}),
      }).expect(201)
    ).body;
    const two = (
      await mutate("post", `/api/admin/${kind}`, {
        titulo: "Segundo",
        ...(kind === "premios" ? { ano: 2024 } : {}),
      }).expect(201)
    ).body;
    for (let row of [one, two]) {
      row = await review(row, kind);
      await mutate("post", `/api/admin/${kind}/${row.id}/publish`, {
        revision: row.revision,
      }).expect(200);
    }
    await mutate("put", `/api/admin/${kind}/order`, {
      ids: [two.id, one.id],
    }).expect(200);
    assert.equal(
      (await request(app).get(`/api/${kind}`)).body[0].titulo,
      "Segundo",
    );
    await mutate("put", `/api/admin/${kind}/order`, {
      ids: [one.id, one.id],
    }).expect(409);
    assert.equal(
      (await request(app).get(`/api/${kind}`)).body[0].titulo,
      "Segundo",
    );
  }
});
test("file signatures, upload limits and media publication rules", async () => {
  const upload = await agent
    .post("/api/admin/uploads")
    .set("origin", origin)
    .set("x-csrf-token", csrf)
    .attach("file", png, "image.png")
    .expect(201);
  const id = upload.body.id;
  await request(app).get(`/api/media/${id}`).expect(404);
  await agent.get(`/api/media/${id}`).expect(200);
  let row = (
    await mutate("post", "/api/admin/experiencias", {
      titulo: "Imagem",
      imagemId: id,
    }).expect(201)
  ).body;
  row = await review(row, "experiencias");
  row = (
    await mutate("post", `/api/admin/experiencias/${row.id}/publish`, {
      revision: row.revision,
    }).expect(200)
  ).body;
  await request(app).get(`/api/media/${id}`).expect(200);
  row = (
    await mutate("put", `/api/admin/experiencias/${row.id}`, {
      revision: row.revision,
      draft: { ...row.draft, imagemId: null },
    }).expect(200)
  ).body;
  await request(app).get(`/api/media/${id}`).expect(200);
  await mutate("post", `/api/admin/experiencias/${row.id}/hide`, {
    revision: row.revision,
  }).expect(200);
  await request(app).get(`/api/media/${id}`).expect(404);
  await agent
    .post("/api/admin/uploads")
    .set("origin", origin)
    .set("x-csrf-token", csrf)
    .attach("file", Buffer.from('<svg onload="alert(1)"/>'), "fake.png")
    .expect(400);
  await agent
    .post("/api/admin/uploads")
    .set("origin", origin)
    .set("x-csrf-token", csrf)
    .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1), "large.png")
    .expect(400);
  await mutate("post", "/api/admin/experiencias", {
    titulo: "Missing",
    imagemId: randomUUID(),
  }).expect(400);
});
test("rejects unsafe rich text and links, accepts supported formatting", () => {
  assert.equal(validDocument(doc("Texto")), true);
  assert.equal(
    validDocument({
      type: "doc",
      content: [{ type: "script", text: "alert(1)" }],
    }),
    false,
  );
  const linked = doc("link");
  linked.content[0].content[0].marks = [
    { type: "link", attrs: { href: "javascript:alert(1)" } },
  ];
  assert.equal(validDocument(linked), false);
  assert.equal(
    schemas.projetos.safeParse({
      titulo: "X",
      linkGithub: "javascript:alert(1)",
    }).success,
    false,
  );
});
test("seed imports current 4/5/6 content and is idempotent", async () => {
  assert.equal((await seed(db, storage)).count, 15);
  assert.equal((await seed(db, storage)).imported, false);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM assets").get().n, 9);
  for (const [kind, count] of [
    ["projetos", 4],
    ["experiencias", 5],
    ["premios", 6],
  ])
    assert.equal((await request(app).get(`/api/${kind}`)).body.length, count);
  assert.equal(
    (await request(app).get("/api/premios")).body.some((p) =>
      p.credencialUrl.includes("example.com"),
    ),
    false,
  );
});
test("backup dedup ignores sessions, retains seven different versions, restores files and data", async () => {
  await seed(db, storage);
  const dir = path.join(directory, "backups");
  const first = await createBackup(db, storage, dir);
  await agent.get("/api/auth/session");
  const same = await createBackup(db, storage, dir);
  assert.equal(first.changed, true);
  assert.equal(same.changed, false);
  assert.equal(same.retained, 1);
  for (let i = 0; i < 8; i++) {
    db.prepare("UPDATE entries SET position=? WHERE id=?").run(
      i + 10,
      "luminar",
    );
    await createBackup(db, storage, dir);
  }
  const names = await listBackups(dir);
  assert.equal(names.length, 7);
  const last = path.join(dir, names.at(-1));
  await verifyBackup(last);
  const restored = path.join(directory, "restored.sqlite"),
    newStorage = memoryStorage();
  await restoreBackup(last, newStorage, restored);
  const copy = openDatabase(restored);
  assert.equal(copy.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 15);
  assert.equal(copy.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 0);
  assert.equal(newStorage.files.size, 9);
  copy.close();
  storage.get = async () => Buffer.from("corrupt");
  await assert.rejects(createBackup(db, storage, dir), /divergente/);
  assert.deepEqual(await listBackups(dir), names);
  await fs.appendFile(path.join(last, "portfolio.sqlite"), "tampered");
  await assert.rejects(verifyBackup(last), /Hash/);
});
test("exclusive gate queues writes until backup work completes", async () => {
  const gate = createGate(),
    order = [];
  let finish;
  const first = gate(async () => {
    order.push("snapshot");
    await new Promise((r) => (finish = r));
    order.push("verified");
  });
  await Promise.resolve();
  const second = gate(() => order.push("write"));
  assert.deepEqual(order, ["snapshot"]);
  finish();
  await Promise.all([first, second]);
  assert.deepEqual(order, ["snapshot", "verified", "write"]);
});

test("backup ignores editorial timestamps but detects real changes; restored seed marker survives", async () => {
  await seed(db, storage);
  const dir = path.join(directory, "backups");
  await createBackup(db, storage, dir);
  db.prepare("UPDATE entries SET revision=revision+1,updated_at=?").run(
    new Date().toISOString(),
  );
  db.prepare("INSERT INTO sessions VALUES(?,?,NULL,?)").run(
    hash("another session"),
    "csrf",
    Date.now() + 10000,
  );
  const same = await createBackup(db, storage, dir);
  assert.equal(same.changed, false);
  assert.equal(same.retained, 1);
  const restored = path.join(directory, "seeded.sqlite");
  await restoreBackup(path.join(dir, same.name), memoryStorage(), restored);
  const copy = openDatabase(restored);
  assert.equal((await seed(copy, storage)).imported, false);
  copy.close();
});
test("database lease prevents a second API or offline restore from acquiring the database", async () => {
  const { databaseLease } = await import("../src/lease.js");
  const filename = path.join(directory, "leased.sqlite");
  const release = await databaseLease(filename);
  await assert.rejects(databaseLease(filename), /em uso/);
  await release();
  const again = await databaseLease(filename);
  await again();
});
test("password reset revokes old sessions, expiration is enforced, PDFs cannot be used as covers", async () => {
  const pdf = await agent
    .post("/api/admin/uploads")
    .set("origin", origin)
    .set("x-csrf-token", csrf)
    .attach("file", Buffer.from("%PDF-1.4\n%%EOF"), "credential.pdf")
    .expect(201);
  await mutate("post", "/api/admin/projetos", {
    titulo: "Invalid cover",
    imagemId: pdf.body.id,
  }).expect(400);
  await mutate("post", "/api/admin/premios", {
    titulo: "Conflicting credential",
    ano: 2025,
    credencialId: pdf.body.id,
    credencialUrl: "https://example.org",
  }).expect(400);
  await request(app)
    .post("/api/internal/admin")
    .set("authorization", "Bearer test-operations-token-with-32-characters")
    .send({ email: "new@example.org", password: "new-test-password-long" })
    .expect(200);
  await agent.get("/api/admin/projetos").expect(401);
  const anon = await agent.get("/api/auth/session");
  await agent
    .post("/api/auth/login")
    .set("origin", origin)
    .set("x-csrf-token", anon.body.csrf)
    .send({ email: "new@example.org", password: "new-test-password-long" })
    .expect(200);
  db.prepare("UPDATE sessions SET expires_at=0").run();
  await agent.get("/api/admin/projetos").expect(401);
});

for (const kind of ["projetos", "experiencias", "premios"]) {
  test(`${kind}: unified save persists visibility and content atomically`, async () => {
    let row = (await mutate("post", `/api/admin/${kind}`, {
      titulo: "Privado inicial", ...(kind === "premios" ? { ano: 2026 } : {}),
    }).expect(201)).body;
    assert.equal(row.visibilidade, "privado");
    assert.equal((await request(app).get(`/api/${kind}`)).body.length, 0);
    await request(app).get(`/api/admin/${kind}/${row.id}`).expect(401);

    row = (await mutate("put", `/api/admin/${kind}/${row.id}`, {
      draft: { ...row.draft, titulo: "Público" },
      visibilidade: "publico",
      revision: row.revision,
    }).expect(200)).body;
    assert.equal(row.visibilidade, "publico");
    assert.equal(row.published, null);
    row = await review(row, kind);
    assert.deepEqual(row.draft, row.published);
    const revision = row.revision;
    row = (await mutate("put", `/api/admin/${kind}/${row.id}`, {
      draft: { ...row.draft, titulo: "Atualizado" },
      visibilidade: "publico",
      revision,
    }).expect(200)).body;
    assert.equal((await request(app).get(`/api/${kind}`)).body[0].titulo, "Público");
    row = await review(row, kind);
    assert.equal((await request(app).get(`/api/${kind}`)).body[0].titulo, "Atualizado");
    await mutate("put", `/api/admin/${kind}/${row.id}`, {
      draft: { ...row.draft, titulo: "Conflito" }, visibilidade: "privado", revision,
    }).expect(409);
    for (const body of [
      { draft: { ...row.draft, titulo: "" }, visibilidade: "privado" },
      { draft: row.draft, visibilidade: "invalido" },
    ]) {
      await mutate("put", `/api/admin/${kind}/${row.id}`, {
        ...body, revision: row.revision,
      }).expect(400);
    }
    assert.deepEqual((await agent.get(`/api/admin/${kind}/${row.id}`)).body, row);
    row = (await mutate("put", `/api/admin/${kind}/${row.id}`, {
      draft: row.draft, visibilidade: "privado", revision: row.revision,
    }).expect(200)).body;
    assert.equal(row.published, null);
    assert.equal(row.visibilidade, "privado");
    assert.equal((await request(app).get(`/api/${kind}`)).body.length, 0);
    assert.equal((await agent.get(`/api/admin/${kind}/${row.id}`)).body.draft.titulo, "Atualizado");

    let publicRow = (await mutate("post", `/api/admin/${kind}`, {
      titulo: "Público desde a criação", visibilidade: "publico", ...(kind === "premios" ? { ano: 2026 } : {}),
    }).expect(201)).body;
    assert.equal(publicRow.published, null);
    publicRow = await review(publicRow, kind);
    assert.deepEqual(publicRow.draft, publicRow.published);
    assert.equal((await request(app).get(`/api/${kind}`)).body[0].id, publicRow.id);
    await mutate("post", `/api/admin/${kind}`, {
      titulo: "Inválido", visibilidade: "invalido",
    }).expect(400);
  });
}

test("unified save protects private media and publishes legacy pending edits", async () => {
  const upload = await agent.post("/api/admin/uploads")
    .set("origin", origin).set("x-csrf-token", csrf)
    .attach("file", png, "private.png").expect(201);
  const media = `/api/media/${upload.body.id}`;
  let row = (await mutate("post", "/api/admin/projetos", {
    titulo: "Original", imagemId: upload.body.id, visibilidade: "publico",
  }).expect(201)).body;
  row = await review(row);
  await request(app).get(media).expect(200);
  row = (await mutate("put", `/api/admin/projetos/${row.id}`, {
    draft: { ...row.draft, titulo: "Pendente antigo" }, revision: row.revision,
  }).expect(200)).body;
  assert.equal(row.published.titulo, "Original");
  row = (await mutate("put", `/api/admin/projetos/${row.id}`, {
    draft: row.draft, revision: row.revision, visibilidade: "publico",
  }).expect(200)).body;
  assert.equal(row.published.titulo, "Original");
  row = await review(row);
  assert.equal(row.published.titulo, "Pendente antigo");
  await mutate("put", `/api/admin/projetos/${row.id}`, {
    draft: row.draft, revision: row.revision, visibilidade: "privado",
  }).expect(200);
  await request(app).get(media).expect(404);
  await agent.get(media).expect(200);
});

test('i18n manual review saves drafts without changing either publication, then confirms atomically', async () => {
  let row=(await mutate('post','/api/admin/projetos',{titulo:'Projeto',descricao:doc('Original'),visibilidade:'publico'}).expect(201)).body;
  row = await review(row);
  const url=`/api/admin/projetos/${row.id}`;
  const target=structuredClone(row.draftByLocale['en-US']);target.descricao.content[0].content[0].text='Custom English';
  row=(await mutate('put',url,{locale:'en-US',draft:target,revision:row.revision,visibilidade:'publico'}).expect(200)).body;
  assert.equal(row.draftByLocale['pt-BR'].descricao.content[0].content[0].text,'Original');
  const source=structuredClone(row.draftByLocale['pt-BR']);source.descricao.content[0].content[0].text='Alterado';
  row=(await mutate('put',url,{locale:'pt-BR',draft:source,revision:row.revision,visibilidade:'publico'}).expect(200)).body;
  assert.equal(row.pendingUnits.length,1);assert.equal(row.draft.descricao.content[0].content[0].text,'Alterado');
  assert.equal((await agent.get('/api/projetos')).body[0].descricao.content[0].content[0].text,'Original');
  assert.equal((await agent.get('/api/projetos?locale=en-US')).body[0].descricao.content[0].content[0].text,'Custom English');
  await mutate('post',`${url}/publish`,{revision:row.revision}).expect(409);
  await mutate('post',`${url}/i18n/confirm`,{revision:row.revision}).expect(409);
  row=(await mutate('post',`/api/admin/reviews/projetos/${row.id}/decide`,{version:row.review.version,key:row.pendingUnits[0],action:'keep'}).expect(200)).body;
  await mutate('post',`${url}/i18n/confirm`,{revision:row.revision}).expect(200);
  assert.equal((await agent.get('/api/projetos')).body[0].descricao.content[0].content[0].text,'Alterado');
});
test('site translations use revision protection and glossary settings require authenticated CSRF',async()=>{
  const state=(await agent.get('/api/admin/i18n/site').expect(200)).body;
  const draft={...state.draftByLocale['pt-BR'],heroTitle:'Novo título'};
  const staged=(await mutate('put','/api/admin/i18n/site',{locale:'pt-BR',revision:state.revision,draft}).expect(200)).body;
  await review(staged,'paginas');
  await mutate('put','/api/admin/i18n/site',{locale:'pt-BR',revision:state.revision,draft}).expect(409);
  assert.equal((await agent.get('/api/site?locale=en-US')).body.heroTitle,'Novo título');
  await request(app).get('/api/admin/i18n/settings').expect(401);
  await agent.put('/api/admin/i18n/settings').send({glossary:'SENAI remains SENAI'}).expect(403);
  const settings=(await mutate('put','/api/admin/i18n/settings',{glossary:'SENAI remains SENAI'}).expect(200)).body;
  assert.equal(settings.budget.annualLimitBrl,105);assert.equal(settings.budget.apiLimitBrl,84);
});

for (const legacy of [true, false]) {
  for (const visibility of ["publico", "privado"]) {
    test(`award PDF persists without translation (legacy=${legacy}, ${visibility})`, async () => {
      let row = (await mutate("post", "/api/admin/premios", {
        titulo: "Prêmio", ano: 2025, descricao: doc("Reconhecimento"), visibilidade: visibility,
      }).expect(201)).body;
      row = await review(row, "premios");
      if (legacy) {
        // Match seeded awards: no credential ID or rich-text translation IDs yet.
        const original = {
          titulo: "Prêmio", categoria: "", ano: 2025, instituicao: "",
          descricao: doc("Reconhecimento"), credencialUrl: "",
        };
        db.prepare("UPDATE entries SET draft=?,published=? WHERE id=?").run(
          JSON.stringify(original), visibility === "publico" ? JSON.stringify(original) : null, row.id);
        db.prepare("UPDATE entry_i18n SET draft_en=NULL,published_en=NULL WHERE entry_id=?").run(row.id);
        row = (await agent.get(`/api/admin/premios/${row.id}`).expect(200)).body;
      }
      translationFailure = true;
      const pdf = Buffer.from("%PDF-1.4\n%%EOF");
      const asset = (await agent.post("/api/admin/uploads")
        .set("origin", origin).set("x-csrf-token", csrf)
        .attach("file", pdf, "certificado.pdf").expect(201)).body;
      const url = `/api/admin/premios/${row.id}`;
      row = (await mutate("put", url, {
        revision: row.revision, visibilidade: visibility,
        draft: { ...row.draft, credencialId: asset.id, credencialUrl: "" },
      }).expect(200)).body;
      const reloaded = (await agent.get(url).expect(200)).body;
      assert.equal(reloaded.draft.credencialId, asset.id);
      const state = db.prepare("SELECT * FROM entry_i18n WHERE entry_id=?").get(row.id);
      if (legacy) {
        assert.equal(state.draft_en, null);
        assert.equal(state.published_en, null);
      } else {
        assert.equal(JSON.parse(state.draft_en).credencialId, asset.id);
      }
      const mediaUrl = `/api/media/${asset.id}`;
      const downloaded = await agent.get(mediaUrl).expect(200).expect("Content-Type", /application\/pdf/);
      assert.deepEqual(downloaded.body, pdf);
      await request(app).get(mediaUrl).expect(visibility === "publico" ? 200 : 404);
      if (visibility === "publico") assert.equal(row.published.credencialId, asset.id);
      row = (await mutate("put", url, {
        revision: row.revision, visibilidade: visibility,
        draft: { ...row.draft, credencialId: null },
      }).expect(200)).body;
      assert.equal(row.draft.credencialId, null);
      await request(app).get(mediaUrl).expect(404);
    });
  }
}

test('translation failure saves source drafts and protects both publications', async () => {
 let row=await review((await mutate('post','/api/admin/projetos',{titulo:'Original',visibilidade:'publico'}).expect(201)).body);
 const before = (await agent.get("/api/projetos?locale=en-US")).body;
 translationFailure=true;
 row=(await mutate('put',`/api/admin/projetos/${row.id}`,{revision:row.revision,locale:'pt-BR',visibilidade:'publico',draft:{...row.draft,titulo:'Changed'}}).expect(200)).body;
 assert.equal(row.draft.titulo,'Changed');
 row=(await mutate('post',`/api/admin/reviews/projetos/${row.id}/generate`,{version:row.review.version}).expect(200)).body;
 assert.equal(row.review.units[0].status,'error');
 assert.deepEqual((await agent.get("/api/projetos?locale=en-US")).body,before);
 assert.equal(row.published.titulo,"Original");
 await mutate('post',`/api/admin/reviews/projetos/${row.id}/complete`,{version:row.review.version}).expect(409);
 const created=(await mutate('post','/api/admin/projetos',{titulo:'New'}).expect(201)).body;
 assert.equal(created.published,null);
 assert.ok(created.review);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM entries').get().n,2);
});
test('restoring content retains translation spend incurred after the snapshot',async()=>{
 const dir=path.join(directory,'spend-backups');const snapshot=await createBackup(db,storage,dir);
 db.prepare("INSERT INTO translation_usage(created_at,reserved_usd_micros,status,usd_brl_rate,request_key) VALUES(?,1000000,'uncertain',7,'paid-after-backup')").run(new Date().toISOString());
 const database=path.join(directory,'live.sqlite');db.close();
 await restoreBackup(path.join(dir,snapshot.name),storage,database);db=openDatabase(database);
 assert.equal(db.prepare("SELECT reserved_usd_micros FROM translation_usage WHERE request_key='paid-after-backup'").get().reserved_usd_micros,1000000);
});

test('gateway requires its dedicated token and English publication waits for backfill',async()=>{
 const token='dedicated-i18n-test-token-32-characters';
 const gateway=createApp({db,storage,limit:false,config:{production:true,publicUrl:origin,i18nSyncToken:token,i18nUsdBrlRate:7},translate:async units=>units.map(value=>`Translated: ${value}`)});
 await request(gateway).post('/api/i18n/translate').send({units:['Teste'],from:'pt-BR',to:'en-US'}).expect(401);
 const translated=await request(gateway).post('/api/i18n/translate').set('authorization',`Bearer ${token}`).send({units:['Teste'],from:'pt-BR',to:'en-US'}).expect(200);
 assert.deepEqual(translated.body.units,['Translated: Teste']);
 let row=await review((await mutate('post','/api/admin/projetos',{titulo:'Legacy',visibilidade:'publico'}).expect(201)).body);
 db.prepare('UPDATE entry_i18n SET draft_en=NULL,published_en=NULL WHERE entry_id=?').run(row.id);
 await agent.get('/api/projetos?locale=en-US').expect(503);
 await agent.post('/api/internal/i18n/backfill').set('authorization','Bearer test-operations-token-with-32-characters').send({}).expect(200);
 await agent.get('/api/projetos?locale=en-US').expect(503);
 row=(await agent.get(`/api/admin/projetos/${row.id}`).expect(200)).body;
 await review(row);
 await agent.get('/api/projetos?locale=en-US').expect(200);
 assert.equal((await agent.get('/api/i18n/ready')).body.ready,true);
});

test('review decisions survive reopening, reject is excluded from approve-all, and versions prevent stale choices', async () => {
  let row=(await mutate('post','/api/admin/projetos',{titulo:'Título',descricao:doc('Original'),visibilidade:'publico'}).expect(201)).body;
  const base=`/api/admin/reviews/projetos/${row.id}`;
  row=(await mutate('post',`${base}/generate`,{version:row.review.version}).expect(200)).body;
  const key=row.review.units.find(unit=>unit.key==='titulo').key;
  const stale=row.review.version;
  row=(await mutate('post',`${base}/decide`,{version:stale,key,action:'reject'}).expect(200)).body;
  await mutate('post',`${base}/decide`,{version:stale,key,action:'approve'}).expect(409);
  row=(await mutate('post',`${base}/decide`,{version:row.review.version,action:'approve-all'}).expect(200)).body;
  assert.equal(row.review.units.find(unit=>unit.key===key).status,'rejected');
  await mutate('post',`${base}/complete`,{version:row.review.version}).expect(409);
  const reopened=(await agent.get(`/api/admin/projetos/${row.id}`).expect(200)).body;
  assert.deepEqual(reopened.review,row.review);
  row=(await mutate('post',`${base}/decide`,{version:row.review.version,key,action:'edit',texts:['Reviewed title']}).expect(200)).body;
  assert.equal((await request(app).get('/api/projetos')).body.length,0);
  row=(await mutate('post',`${base}/complete`,{version:row.review.version}).expect(200)).body;
  assert.equal((await request(app).get('/api/projetos?locale=en-US')).body[0].titulo,'Reviewed title');
  assert.equal(row.published.titulo,'Título');
});

test('English originals stay private until reviewed and become Portuguese only after completion', async () => {
  let row=(await mutate('post','/api/admin/projetos',{titulo:'English original',sourceLocale:'en-US',locale:'en-US',visibilidade:'publico'}).expect(201)).body;
  assert.equal(row.draftByLocale['pt-BR'],null);
  assert.equal(row.draftByLocale['en-US'].titulo,'English original');
  assert.equal((await request(app).get('/api/projetos')).body.length,0);
  const base=`/api/admin/reviews/projetos/${row.id}`;
  row=(await mutate('post',`${base}/generate`,{version:row.review.version}).expect(200)).body;
  row=(await mutate('post',`${base}/decide`,{version:row.review.version,key:'titulo',action:'edit',texts:['Original em inglês']}).expect(200)).body;
  row=(await mutate('post',`${base}/decide`,{version:row.review.version,action:'approve-all'}).expect(200)).body;
  await mutate('post',`${base}/complete`,{version:row.review.version}).expect(200);
  assert.equal((await request(app).get('/api/projetos')).body[0].titulo,'Original em inglês');
  assert.equal((await request(app).get('/api/projetos?locale=en-US')).body[0].titulo,'English original');
});

test('formatting and no-op saves do not create translation requests', async () => {
  let row=await review((await mutate('post','/api/admin/projetos',{titulo:'Original',descricao:doc('Text'),visibilidade:'publico'}).expect(201)).body);
  translationFailure=true;
  const payload=structuredClone(row.draft);
  payload.descricao.content[0].content[0].marks=[{type:'bold'}];
  row=(await mutate('put',`/api/admin/projetos/${row.id}`,{revision:row.revision,draft:payload,visibilidade:'publico'}).expect(200)).body;
  assert.equal(row.review,null);
  assert.equal(row.published.descricao.content[0].content[0].marks[0].type,'bold');
  row=(await mutate('put',`/api/admin/projetos/${row.id}`,{revision:row.revision,draft:row.draft,visibilidade:'publico'}).expect(200)).body;
  assert.equal(row.review,null);
});

test('a separate admin origin can log in and the public origin cannot perform editorial mutations', async () => {
 const adminOrigin='https://admin.example.com';
 const separate=createApp({db,storage,limit:false,config:{publicUrl:origin,adminUrl:adminOrigin,backupDir:path.join(directory,'backups')}});
 const editor=request.agent(separate);
 let token=(await editor.get('/api/auth/session').expect(200)).body.csrf;
 const login=await editor.post('/api/auth/login').set('origin',adminOrigin).set('x-csrf-token',token)
   .send({email:'admin@example.com',password:'testing-password-long'}).expect(200);
 token=login.body.csrf;
 await editor.post('/api/admin/projetos').set('origin',origin).set('x-csrf-token',token).send({titulo:'Blocked'}).expect(403);
 const saved=await editor.post('/api/admin/projetos').set('origin',adminOrigin).set('x-csrf-token',token).send({titulo:'Allowed'}).expect(201);
 assert.equal(saved.body.draft.titulo,'Allowed');
 assert.ok(login.headers['set-cookie'].every(cookie=>!cookie.toLowerCase().includes('domain=')));
});

test('site photos and rich formatting survive publication, backup references and replacement', async () => {
  const { referencedAssets } = await import('../src/db.js');
  const uploaded = await agent.post('/api/admin/uploads').set('origin', origin)
    .set('x-csrf-token', csrf).attach('file', png, 'profile.png').expect(201);
  const id = uploaded.body.id;
  let state = (await agent.get('/api/admin/i18n/site').expect(200)).body;
  const draft = structuredClone(state.draftByLocale['pt-BR']);
  draft.imagemId = id;
  draft.imagemSecundariaId = id;
  draft.aboutParagraphs.content[0].attrs.textAlign = 'justify';
  draft.aboutParagraphs.content[0].content[0].marks = [{ type: 'bold' }];
  state = (await mutate('put', '/api/admin/i18n/site', { locale: 'pt-BR', revision: state.revision, draft }).expect(200)).body;
  await review(state, 'paginas');
  const published = (await request(app).get('/api/site').expect(200)).body;
  assert.equal(published.imagemId, id);
  assert.equal(published.aboutParagraphs.content[0].attrs.textAlign, 'justify');
  assert.equal(published.aboutParagraphs.content[0].content[0].marks[0].type, 'bold');
  assert.ok(referencedAssets(db).has(id));
  assert.ok(referencedAssets(db, true).has(id));
  await request(app).get(`/api/media/${id}`).expect(200);
  state = (await agent.get('/api/admin/i18n/site')).body;
  await mutate('put', '/api/admin/i18n/site', { locale: 'pt-BR', revision: state.revision,
    draft: { ...state.draftByLocale['pt-BR'], imagemId: randomUUID() } }).expect(400);
  const invalid = structuredClone(draft);
  invalid.aboutParagraphs.content[0].attrs.textAlign = 'invalid';
  await mutate('put', '/api/admin/i18n/site', { locale: 'pt-BR', revision: state.revision, draft: invalid }).expect(400);
  await mutate('put', '/api/admin/i18n/site', { locale: 'pt-BR', revision: state.revision,
    draft: { ...state.draftByLocale['pt-BR'], imagemId: null, imagemSecundariaId: null } }).expect(200);
  assert.ok(!referencedAssets(db).has(id));
  await request(app).get(`/api/media/${id}`).expect(404);
});
