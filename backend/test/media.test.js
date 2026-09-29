import { test, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import sharp from "sharp";
import request from "supertest";
import { openDatabase, referencedAssets } from "../src/db.js";
import { createApp } from "../src/app.js";
import { detectBackground, initializeMediaMetadata } from "../src/media.js";
import { createBackup, restoreBackup, hash } from "../src/backup.js";

let fixtures, photo, mp4, webm;
let directory, db, storage, app;
const token = "a".repeat(64);
const origin = "http://localhost:3000";
const headers = {
  cookie: `portfolio_session=${token}`,
  origin,
  "x-csrf-token": "test-csrf",
};
before(async () => {
  fixtures = await fs.mkdtemp(path.join(os.tmpdir(), "media-fixtures-"));
  photo = await sharp({
    create: { width: 100, height: 80, channels: 3, background: "#ffeedd" },
  })
    .png()
    .toBuffer();
  mp4 = path.join(fixtures, "demo.mp4");
  webm = path.join(fixtures, "demo.webm");
  for (const [filename, codec] of [
    [mp4, "libx264"],
    [webm, "libvpx-vp9"],
  ])
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=black:s=160x90:r=10:d=0.1",
      "-f",
      "lavfi",
      "-i",
      "color=red:s=160x90:r=10:d=0.5",
      "-filter_complex",
      "[0:v][1:v]concat=n=2:v=1:a=0",
      "-c:v",
      codec,
      "-pix_fmt",
      "yuv420p",
      "-threads",
      "1",
      filename,
    ]);
});
after(async () => fs.rm(fixtures, { recursive: true, force: true }));
beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "media-test-"));
  db = openDatabase(path.join(directory, "db.sqlite"));
  db.prepare("INSERT INTO admin VALUES(1,?,?)").run(
    "test@example.com",
    "unused",
  );
  db.prepare("INSERT INTO sessions VALUES(?,?,1,?)").run(
    hash(token),
    "test-csrf",
    Date.now() + 60000,
  );
  const files = new Map();
  storage = {
    files,
    ready: async () => {},
    put: async (id, bytes) => files.set(id, Buffer.from(bytes)),
    get: async (id) => Buffer.from(files.get(id)),
    remove: async (id) => files.delete(id),
    stream: async (id, range) => {
      const [, a, b] = /^bytes=(\d+)-(\d+)$/.exec(range);
      return Readable.from(files.get(id).subarray(Number(a), Number(b) + 1));
    },
  };
  app = createApp({
    db,
    storage,
    translate: async (units) => structuredClone(units),
    limit: false,
    config: { publicUrl: origin, backupDir: path.join(directory, "backups") },
  });
});
afterEach(async () => {
  db.close();
  await fs.rm(directory, { recursive: true, force: true });
});
const upload = (bytes, name) =>
  request(app)
    .post("/api/admin/uploads/project-media")
    .set(headers)
    .attach("file", bytes, name);
const create = (midias, extra = {}) =>
  request(app)
    .post("/api/admin/projetos")
    .set(headers)
    .send({
      titulo: "Mídias",
      midias,
      capaId: midias[0]?.assetId || null,
      ...extra,
    });

async function review(row) {
  for (const [action, extra] of [["generate", {}], ["decide", { action: "approve-all" }], ["complete", {}]]) {
    row = (await request(app).post(`/api/admin/reviews/projetos/${row.id}/${action}`).set(headers)
      .send({ version: row.review.version, ...extra }).expect(200)).body;
  }
  return row;
}

test("border colors ignore the center and transparent pixels, with deterministic fallback", async () => {
  const image = await sharp({
    create: { width: 100, height: 100, channels: 3, background: "#ffffff" },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 60, height: 60, channels: 3, background: "#000000" },
        })
          .png()
          .toBuffer(),
        left: 20,
        top: 20,
      },
    ])
    .png()
    .toBuffer();
  assert.equal(await detectBackground(image), "#ffffff");
  assert.equal(await detectBackground(photo), "#ffeedd");
  const transparent = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
  assert.equal(await detectBackground(transparent), "#f4eee1");
});

test("image uploads, order, independent cover and colors survive serialization", async () => {
  const first = (await upload(photo, "primeira.png").expect(201)).body;
  const second = (await upload(photo, "segunda.png").expect(201)).body;
  assert.equal(first.tipo, "imagem");
  assert.equal(first.corAutomatica, "#ffeedd");
  let row = (
    await create([second, { ...first, corFundo: "#112233" }], {
      capaId: first.assetId,
      visibilidade: "publico",
    }).expect(201)
  ).body;
  row = await review(row);
  assert.equal(row.draft.midias[0].assetId, second.assetId);
  const project = (await request(app).get("/api/projetos")).body[0];
  assert.equal(project.imagemUrl, first.previewUrl);
  assert.equal(project.imagemBg, "#112233");
  assert.equal(project.midias[1].corAutomatica, "#ffeedd");
  const stored = JSON.parse(
    db.prepare("SELECT draft FROM entries WHERE id=?").get(row.id).draft,
  );
  assert.deepEqual(Object.keys(stored.midias[0]).sort(), [
    "alt",
    "assetId",
    "corFundo",
    "legenda",
  ]);
});

test("MP4 and WebM get a real first-frame poster; private/public streaming honors ranges", async () => {
  for (const file of [mp4, webm]) {
    const media = (await upload(file).expect(201)).body;
    assert.equal(media.tipo, "video");
    assert.equal(media.corAutomatica, "#000000");
    assert.notEqual(media.url, media.previewUrl);
    await request(app).get(media.url).expect(404);
    await request(app).get(media.previewUrl).expect(404);
    let row = (await create([media], { visibilidade: "publico" }).expect(201))
      .body;
    row = await review(row);
    const data = await fs.readFile(file);
    const range = await request(app)
      .get(media.url)
      .set("Range", "bytes=0-15")
      .expect(206);
    assert.equal(range.headers["content-range"], `bytes 0-15/${data.length}`);
    assert.deepEqual(range.body, data.subarray(0, 16));
    const tail = await request(app)
      .get(media.url)
      .set("Range", "bytes=-10")
      .expect(206);
    assert.deepEqual(tail.body, data.subarray(-10));
    await request(app)
      .get(media.url)
      .set("Range", "bytes=999999999-")
      .expect(416);
    await request(app)
      .head(media.url)
      .expect(200)
      .expect("Content-Length", String(data.length));
    await request(app)
      .get(media.previewUrl)
      .expect(200)
      .expect("Content-Type", /image\/png/);
    await request(app)
      .post(`/api/admin/projetos/${row.id}/hide`)
      .set(headers)
      .send({ revision: row.revision })
      .expect(200);
    await request(app).get(media.previewUrl).expect(404);
  }
});

test("API enforces five media, one video, unique IDs, valid cover and file types", async () => {
  const images = [];
  for (let i = 0; i < 6; i++)
    images.push((await upload(photo, `photo${i}.png`).expect(201)).body);
  await create(images.slice(0, 5)).expect(201);
  await create(images).expect(400);
  await create([images[0], images[0]]).expect(400);
  await create([images[0]], { capaId: randomUUID() }).expect(400);
  await create([{ assetId: randomUUID() }]).expect(400);
  const videos = [
    (await upload(mp4).expect(201)).body,
    (await upload(webm).expect(201)).body,
  ];
  await create(videos).expect(400);
  await create([images[0], videos[0]]).expect(201);
  await upload(Buffer.from("not an image"), "fake.png").expect(400);
  await upload(
    Buffer.concat([photo, Buffer.alloc(10 * 1024 * 1024)]),
    "large.png",
  ).expect(400);
  await upload(Buffer.alloc(100 * 1024 * 1024 + 1), "large.mp4").expect(400);
  await upload((await fs.readFile(mp4)).subarray(0, 48), "broken.mp4").expect(
    400,
  );
  const pdf = (
    await request(app)
      .post("/api/admin/uploads")
      .set(headers)
      .attach("file", Buffer.from("%PDF-1.4\n%%EOF"), "file.pdf")
      .expect(201)
  ).body;
  await create([{ assetId: pdf.id }]).expect(400);
});

test("failed storage rolls back originals and generated posters", async () => {
  let count = 0;
  const put = storage.put;
  storage.put = async (...args) => {
    await put(...args);
    if (++count === 2) throw new Error("simulated failure");
  };
  await upload(mp4).expect(500);
  assert.equal(storage.files.size, 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM assets").get().n, 0);
});

test("cleanup and backup preserve both video and poster while referenced, then collect both", async () => {
  const media = (await upload(mp4).expect(201)).body;
  let row = (await create([media], { visibilidade: "publico" }).expect(201))
    .body;
  row = await review(row);
  db.prepare("UPDATE assets SET created_at='2000-01-01T00:00:00Z'").run();
  assert.equal(referencedAssets(db, true).size, 2);
  // A private draft edit must not break the previously published video.
  row = (await request(app)
    .put(`/api/admin/projetos/${row.id}`)
    .set(headers)
    .send({
      revision: row.revision,
      draft: { ...row.draft, midias: [], capaId: null },
    })
    .expect(200)).body;
  const snapshot = await app.locals.backup();
  assert.equal(storage.files.size, 2);
  const target = path.join(directory, "restored.sqlite");
  await restoreBackup(
    path.join(directory, "backups", snapshot.name),
    storage,
    target,
  );
  const restored = openDatabase(target);
  assert.equal(referencedAssets(restored, true).size, 2);
  restored.close();
  await request(app)
    .delete(`/api/admin/projetos/${row.id}`)
    .set(headers)
    .send({ revision: row.revision })
    .expect(200);
  await app.locals.backup();
  assert.equal(storage.files.size, 0);
});

test("v1 backup restores and migrates covers without changing colors or draft/publication isolation", async () => {
  const first = (await upload(photo, "legacy.png").expect(201)).body;
  let row = (await create([first], { visibilidade: "publico" }).expect(201))
    .body;
  db.prepare("UPDATE entries SET draft=?,published=? WHERE id=?").run(
    JSON.stringify({
      titulo: "Rascunho",
      imagemId: first.assetId,
      imagemBg: "#123456",
      imagens: [],
      videoUrl: "",
    }),
    JSON.stringify({
      titulo: "Publicado",
      imagemId: first.assetId,
      imagemBg: "#abcdef",
    }),
    row.id,
  );
  db.exec(
    "ALTER TABLE assets DROP COLUMN metadata; DELETE FROM migrations WHERE version>1",
  );
  const snapshot = await createBackup(
    db,
    storage,
    path.join(directory, "backups"),
  );
  const target = path.join(directory, "legacy.sqlite");
  await restoreBackup(
    path.join(directory, "backups", snapshot.name),
    storage,
    target,
  );
  const restored = openDatabase(target);
  const result = restored
    .prepare("SELECT draft,published FROM entries WHERE id=?")
    .get(row.id);
  assert.equal(JSON.parse(result.draft).midias[0].corFundo, "#123456");
  assert.equal(JSON.parse(result.published).midias[0].corFundo, "#abcdef");
  assert.equal(JSON.parse(result.draft).capaId, first.assetId);
  await initializeMediaMetadata(restored, storage);
  assert.equal(
    JSON.parse(
      restored
        .prepare("SELECT metadata FROM assets WHERE id=?")
        .get(first.assetId).metadata,
    ).corAutomatica,
    "#ffeedd",
  );
  restored.close();
});

test("legacy remote links abort migration before changing any content or schema", async () => {
  const filename = path.join(directory, "incompatible.sqlite");
  const old = openDatabase(filename);
  const payload = JSON.stringify({
    titulo: "Legado",
    imagens: ["https://example.com/photo.png"],
  });
  old
    .prepare(
      "INSERT INTO entries(id,kind,position,draft,updated_at) VALUES(?,?,?,?,?)",
    )
    .run("legacy", "projetos", 0, payload, "2020-01-01");
  old.exec(
    "ALTER TABLE assets DROP COLUMN metadata; DELETE FROM migrations WHERE version>1",
  );
  old.close();
  assert.throws(() => openDatabase(filename), /links antigos/);
  // Read without running migrations to verify the failed preflight was atomic.
  const { default: Database } = await import("better-sqlite3");
  const unchanged = new Database(filename, { readonly: true });
  assert.equal(
    unchanged.prepare("SELECT MAX(version) AS v FROM migrations").get().v,
    1,
  );
  assert.equal(
    unchanged.prepare("SELECT draft FROM entries").get().draft,
    payload,
  );
  assert.equal(
    unchanged
      .pragma("table_info(assets)")
      .some((column) => column.name === "metadata"),
    false,
  );
  unchanged.close();
});
