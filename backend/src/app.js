import express from "express";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { detectBackground, storeProjectMedia } from "./media.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { seed } from "./seed.js";
import {
  kinds,
  schemas,
  serializePayload,
  hydratePayload,
  resolveMedia,
} from "./schema.js";
import { now, referencedAssets, assetIds, createGate } from "./db.js";
import { hash, createBackup } from "./backup.js";
import { geminiTranslate, translationBudget, translateThroughGateway, identifyBlocks, sameTranslatableContent } from "./translate.js";
import { LOCALES } from "../../packages/i18n/index.js";
import { getSite, saveSite, siteSchema } from "./site-i18n.js";
import { stageReview, completedDrafts, readReview, storeReview, reviewKey, replaceTexts } from "./review.js";
import { generateBoldProposal, applyBoldRanges, phraseRanges, boldLayout } from "./bold.js";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const SESSION = "portfolio_session";
const safeEqual = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function createApp({
  db,
  storage,
  config,
  gate = createGate(),
  limit = true,
  translate = null,
}) {
  const app = express();
  app.disable("x-powered-by");
  if (!config.production && process.env.NODE_ENV === "development") {
    app.get("/api/dev/content-revision", (req, res) => {
      const entries = db.prepare("SELECT id,kind,position,published FROM entries ORDER BY id").all();
      const translations = db.prepare("SELECT entry_id,published_en FROM entry_i18n ORDER BY entry_id").all();
      res.set("Cache-Control", "no-store").json({
        revision: hash(JSON.stringify([entries, translations, getSite(db).publishedByLocale])),
      });
    });
  }
  app.set("trust proxy", config.production ? 1 : false);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: "same-origin" },
    }),
  );
  app.use(express.json({ limit: "512kb" }));
  if (limit)
    app.use(
      "/api",
      rateLimit({
        windowMs: 60000,
        limit: 300,
        standardHeaders: "draft-8",
        legacyHeaders: false,
      }),
    );
  app.use((req, res, next) => {
    const raw = req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION}=`))
      ?.slice(SESSION.length + 1);
    req.sessionHash = raw && /^[a-f0-9]{64}$/.test(raw) ? hash(raw) : null;
    req.session = req.sessionHash
      ? db
          .prepare(
            "SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?",
          )
          .get(req.sessionHash, Date.now())
      : null;
    res.set("Cache-Control", "no-store");
    next();
  });
  function newSession(req, res, adminId = null) {
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(32).toString("hex");
    db.transaction(() => {
      if (req.sessionHash)
        db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
          req.sessionHash,
        );
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
      db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?)").run(
        hash(token),
        csrf,
        adminId,
        Date.now() + (adminId ? WEEK : 60 * 60 * 1000),
      );
    })();
    res.cookie(SESSION, token, {
      httpOnly: true,
      secure: config.production,
      sameSite: "strict",
      path: "/",
      maxAge: adminId ? WEEK : 3600000,
    });
    return csrf;
  }
  function auth(req, res, next) {
    if (!req.session?.admin_id)
      return res.status(401).json({ error: "Faça login para continuar." });
    next();
  }
  function csrf(req, res, next) {
    if (
      req.headers.origin !== (config.adminUrl || config.publicUrl) ||
      !safeEqual(req.headers["x-csrf-token"], req.session?.csrf)
    )
      return res
        .status(403)
        .json({ error: "Sessão de edição inválida. Recarregue a página." });
    next();
  }
  const write = (handler) => (req, res, next) =>
    gate(() => {
      // A password reset or expiration may have happened while this request waited for a backup.
      if (
        req.originalUrl.startsWith("/api/admin/") &&
        !db
          .prepare(
            "SELECT 1 FROM sessions WHERE token_hash=? AND admin_id=1 AND expires_at>?",
          )
          .get(req.sessionHash, Date.now())
      ) {
        return res.status(401).json({ error: "Faça login para continuar." });
      }
      return handler(req, res);
    }).catch(next);
  const getEntry = (id, kind) => {
    const row = db
      .prepare("SELECT * FROM entries WHERE id = ? AND kind = ?")
      .get(id, kind);
    if (!row)
      throw Object.assign(new Error("Item não encontrado."), { status: 404 });
    return row;
  };
  const editorRow = (row) => {
    const state = db.prepare("SELECT * FROM entry_i18n WHERE entry_id=?").get(row.id);
    const review = readReview(db, reviewKey(row.kind, row.id));
    const drafts = review?.drafts || { "pt-BR": JSON.parse(row.draft), "en-US": state?.draft_en ? JSON.parse(state.draft_en) : null };
    const sourceLocale = state?.source_locale || "pt-BR";
    return {
      id: row.id, kind: row.kind, position: row.position, revision: row.revision, updatedAt: row.updated_at,
      imagemBg: serializePayload(drafts[sourceLocale] || JSON.parse(row.draft), db).imagemBg,
      visibilidade: review?.visibility || (row.published ? "publico" : "privado"),
      draft: hydratePayload(drafts[sourceLocale] || JSON.parse(row.draft), db),
      published: row.published ? hydratePayload(JSON.parse(row.published), db) : null,
      sourceLocale,
      draftByLocale: Object.fromEntries(LOCALES.map(locale => [locale, drafts[locale] ? hydratePayload(identifyBlocks(row.kind, drafts[locale]), db) : null])),
      pendingUnits: review?.units.map(unit => unit.key) || [], review,
    };
  };
  const siteRow = () => {
    const current = getSite(db);
    const review = readReview(db, "paginas:site");
    return { ...current, draftByLocale: review?.drafts || current.draftByLocale,
      review, pendingUnits: review?.units.map(unit => unit.key) || [] };
  };
  function commitReview(kind, id, state, publish = true) {
    const pair = completedDrafts(state);
    const schema = kind === "paginas" ? siteSchema : schemas[kind];
    for (const locale of LOCALES) { pair[locale] = schema.parse(pair[locale]); validateAssets(pair[locale]); }
    if (kind === "paginas") {
      const current = getSite(db);
      saveSite(db, { ...current, revision: current.revision + 1, draftByLocale: pair,
        publishedByLocale: pair, pendingUnits: [], protectedUnits: [] });
    } else {
      db.prepare("UPDATE entries SET draft=?,published=CASE WHEN ? THEN ? ELSE published END,revision=revision+1,updated_at=? WHERE id=?")
        .run(JSON.stringify(pair["pt-BR"]), Number(publish), state.visibility === "publico" ? JSON.stringify(pair["pt-BR"]) : null, now(), id);
      db.prepare("UPDATE entry_i18n SET draft_en=?,published_en=CASE WHEN ? THEN ? ELSE published_en END,pending_units='[]' WHERE entry_id=?")
        .run(JSON.stringify(pair["en-US"]), Number(publish), state.visibility === "publico" ? JSON.stringify(pair["en-US"]) : null, id);
    }
    db.prepare("DELETE FROM translation_reviews WHERE subject=?").run(reviewKey(kind, id));
  }
  function saveEntryDraft(kind, row, payload, locale, visibility, forceBackfill = false) {
    const current = editorRow(row);
    if (!forceBackfill && !current.review && !current.draftByLocale["en-US"] && locale === "pt-BR" && sameTranslatableContent(kind, JSON.parse(row.draft), payload)) {
      db.prepare("UPDATE entries SET draft=?,published=?,revision=revision+1,updated_at=? WHERE id=?")
        .run(JSON.stringify(payload), visibility === "privado" ? null : visibility === "publico" && row.published ? JSON.stringify(payload) : row.published, now(), row.id);
      return editorRow(getEntry(row.id,kind));
    }
    const state = stageReview({ kind, sourceLocale: current.sourceLocale, locale, payload,
      drafts: current.draftByLocale, previous: current.review, visibility: visibility || current.visibilidade });
    db.transaction(() => {
      db.prepare("UPDATE entries SET draft=?,revision=revision+1,updated_at=? WHERE id=?")
        .run(JSON.stringify(state.drafts["pt-BR"] || state.drafts["en-US"]), now(), row.id);
      db.prepare("UPDATE entry_i18n SET draft_en=? WHERE entry_id=?")
        .run(state.drafts["en-US"] ? JSON.stringify(state.drafts["en-US"]) : null, row.id);
      storeReview(db, reviewKey(kind, row.id), state);
      if (state.visibility === "privado") {
        db.prepare("UPDATE entries SET published=NULL WHERE id=?").run(row.id);
        db.prepare("UPDATE entry_i18n SET published_en=NULL WHERE entry_id=?").run(row.id);
      }
      if (!state.units.length) commitReview(kind, row.id, state, visibility !== undefined);
    })();
    return editorRow(getEntry(row.id, kind));
  }
  const translateUnits = (units, options) => translate
    ? translate(units, options)
    : !config.production ? translateThroughGateway(config, units, options) : geminiTranslate(db, config, units, {
      ...options, gate,
      glossary: db.prepare("SELECT value FROM i18n_settings WHERE key='glossary'").get()?.value || "",
    });
  app.post("/api/i18n/translate", async (req, res) => {
    if (!config.production || !config.i18nSyncToken || !safeEqual(req.headers.authorization, `Bearer ${config.i18nSyncToken}`)) return res.sendStatus(401);
    const body = z.object({ units: z.array(z.union([z.string().max(30000), z.array(z.string().max(30000)).max(1000), z.object({ type: z.string(), content: z.array(z.unknown()).optional(), text: z.string().optional(), attrs: z.record(z.string(), z.unknown()).optional() })])).max(1000), from: z.enum(LOCALES), to: z.enum(LOCALES), instruction: z.string().max(1000).optional(), force: z.boolean().optional(), mode: z.enum(["translate", "align-bold"]).optional() }).parse(req.body);
    if (body.from === body.to) return res.status(400).json({ error: "Escolha idiomas diferentes." });
    res.json({ units: await translateUnits(body.units, { from: body.from, to: body.to, instruction: body.instruction, force: body.force, mode: body.mode }) });
  });
  for (const method of ["get", "put"]) app[method]("/api/i18n/settings", write((req, res) => {
    if (!config.production || !config.i18nSyncToken || !safeEqual(req.headers.authorization, `Bearer ${config.i18nSyncToken}`)) return res.sendStatus(401);
    if (method === "put") {
      const glossary = z.string().max(10000).parse(req.body.glossary);
      db.prepare("INSERT OR REPLACE INTO i18n_settings(key,value) VALUES('glossary',?)").run(glossary);
    }
    res.json({ glossary: db.prepare("SELECT value FROM i18n_settings WHERE key='glossary'").get()?.value || "", budget: translationBudget(db, config) });
  }));
  async function remoteSettings(method = "GET", body) {
    const response = await fetch(`${config.i18nGatewayUrl}/api/i18n/settings`, {
      method, headers: { authorization: `Bearer ${config.i18nSyncToken}`, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw Object.assign(new Error("Tradução indisponível ou inválida. Tente novamente."), { status: 503 });
    return response.json();
  }
  app.get("/api/i18n/ready", (req, res) => {
    const missing = db.prepare("SELECT COUNT(*) AS n FROM entries e LEFT JOIN entry_i18n i ON i.entry_id=e.id WHERE e.published IS NOT NULL AND i.published_en IS NULL").get().n;
    res.json({ ready: missing === 0, missing });
  });
  app.get("/api/site", (req, res) => res.json(getSite(db).publishedByLocale[req.query.locale === "en-US" ? "en-US" : "pt-BR"]));
  function validateAssets(payload) {
    let videos = 0;
    for (const id of assetIds(payload)) {
      const asset = db
        .prepare("SELECT mime,metadata FROM assets WHERE id = ?")
        .get(id);
      if (
        !asset ||
        ([payload.imagemId, payload.imagemSecundariaId].includes(id) && !asset.mime.startsWith("image/"))
      )
        throw Object.assign(new Error("Arquivo inválido ou não encontrado."), {
          status: 400,
        });
      if (payload.midias) {
        if (
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
          ].includes(asset.mime)
        )
          throw Object.assign(new Error("Mídia de projeto inválida."), {
            status: 400,
          });
        if (asset.mime.startsWith("video/")) {
          const metadata = asset.metadata && JSON.parse(asset.metadata);
          if (
            !metadata?.posterId ||
            !db
              .prepare("SELECT 1 FROM assets WHERE id=? AND mime='image/png'")
              .get(metadata.posterId)
          )
            throw Object.assign(new Error("Vídeo sem miniatura processada."), {
              status: 400,
            });
          if (++videos > 1)
            throw Object.assign(
              new Error("Use no máximo um vídeo por projeto."),
              { status: 400 },
            );
        }
      }
    }
  }
  function revision(req, row) {
    if (req.body?.revision !== row.revision)
      throw Object.assign(
        new Error("Este item mudou em outra aba. Reabra-o antes de salvar."),
        { status: 409 },
      );
  }
  async function cleanup() {
    const used = referencedAssets(db);
    for (const asset of db
      .prepare("SELECT * FROM assets WHERE created_at < ?")
      .all(new Date(Date.now() - WEEK).toISOString())) {
      if (!used.has(asset.id)) {
        await storage.remove(asset.object_key);
        db.prepare("DELETE FROM assets WHERE id = ?").run(asset.id);
      }
    }
  }
  async function backup() {
    return gate(async () => {
      await cleanup();
      return createBackup(db, storage, config.backupDir);
    });
  }
  app.locals.backup = backup;
  app.locals.gate = gate;
  app.get("/api/health", async (req, res) => {
    try {
      db.prepare("SELECT 1").get();
      await storage.ready();
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.get("/api/auth/session", (req, res) => {
    const csrf = req.session?.csrf || newSession(req, res);
    res.json({ authenticated: Boolean(req.session?.admin_id), csrf });
  });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => !limit,
    message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
  });
  app.post(
    "/api/auth/login",
    loginLimiter,
    csrf,
    write(async (req, res) => {
      const data = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(1).max(1024),
        })
        .parse(req.body);
      const admin = db.prepare("SELECT * FROM admin WHERE id = 1").get();
      const valid =
        admin && (await argon2.verify(admin.password_hash, data.password));
      if (!valid || admin.email !== data.email.trim().toLowerCase())
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      res.json({ authenticated: true, csrf: newSession(req, res, admin.id) });
    }),
  );
  app.post(
    "/api/auth/logout",
    csrf,
    write((req, res) => {
      if (req.sessionHash)
        db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
          req.sessionHash,
        );
      res.clearCookie(SESSION, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: config.production,
      });
      res.json({ ok: true });
    }),
  );
  app.use("/api/internal", (req, res, next) => {
    if (
      !config.operationsToken ||
      !safeEqual(req.headers.authorization, `Bearer ${config.operationsToken}`)
    )
      return res.sendStatus(401);
    next();
  });
  app.post(
    "/api/internal/seed",
    write(async (req, res) => res.json(await seed(db, storage))),
  );
  app.post("/api/internal/i18n/backfill", write((req, res) => {
    let staged = 0;
    for (const row of db.prepare("SELECT e.* FROM entries e JOIN entry_i18n i ON i.entry_id=e.id WHERE i.draft_en IS NULL OR (e.published IS NOT NULL AND i.published_en IS NULL)").all()) {
      if (readReview(db, reviewKey(row.kind,row.id))) continue;
      const current = editorRow(row);
      saveEntryDraft(row.kind, row, JSON.parse(row.draft), current.sourceLocale, current.visibilidade, true);
      staged++;
    }
    res.json({ done: true, staged });
  }));
  app.post(
    "/api/internal/admin",
    write(async (req, res) => {
      const data = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(12).max(1024),
        })
        .parse(req.body);
      const passwordHash = await argon2.hash(data.password, {
        type: argon2.argon2id,
      });
      db.transaction(() => {
        db.prepare(
          "INSERT INTO admin VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,password_hash=excluded.password_hash",
        ).run(data.email.trim().toLowerCase(), passwordHash);
        db.exec("DELETE FROM sessions");
      })();
      res.json({ ok: true, email: data.email });
    }),
  );
  app.post("/api/internal/backup", async (req, res, next) => {
    if (
      !config.operationsToken ||
      !safeEqual(req.headers.authorization, `Bearer ${config.operationsToken}`)
    )
      return res.sendStatus(401);
    try {
      res.json(await backup());
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/media/:id", async (req, res, next) => {
    try {
      if (
        !req.session?.admin_id &&
        !referencedAssets(db, true).has(req.params.id)
      )
        return res.sendStatus(404);
      const asset = db
        .prepare("SELECT * FROM assets WHERE id = ?")
        .get(req.params.id);
      if (!asset) return res.sendStatus(404);
      let start = 0,
        end = asset.size - 1;
      res.set("Accept-Ranges", "bytes");
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2])) {
          res.set("Content-Range", `bytes */${asset.size}`);
          return res.sendStatus(416);
        }
        start = match[1]
          ? Number(match[1])
          : Math.max(0, asset.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start > end ||
          start >= asset.size
        ) {
          res.set("Content-Range", `bytes */${asset.size}`);
          return res.sendStatus(416);
        }
        res
          .status(206)
          .set("Content-Range", `bytes ${start}-${end}/${asset.size}`);
      }
      res.set("Content-Length", String(end - start + 1));
      res.set("Content-Type", asset.mime);
      res.set(
        "Content-Disposition",
        `${asset.mime === "application/pdf" ? "attachment" : "inline"}; filename="${asset.id}.${asset.mime === "application/pdf" ? "pdf" : asset.mime.split("/")[1]}"`,
      );
      if (req.method === "HEAD") return res.end();
      if (storage.stream) {
        const stream = await storage.stream(
          asset.object_key,
          `bytes=${start}-${end}`,
        );
        await pipeline(stream, res);
      } else {
        const bytes = await storage.get(asset.object_key);
        res.end(bytes.subarray(start, end + 1));
      }
    } catch (error) {
      next(error);
    }
  });
  app.use("/api/admin", auth);
  app.use("/api/admin", (req, res, next) =>
    ["GET", "HEAD"].includes(req.method) ? next() : csrf(req, res, next),
  );
  app.get("/api/admin/i18n/settings", async (req, res) => res.json(!config.production && config.i18nGatewayUrl ? await remoteSettings() : {
    glossary: db.prepare("SELECT value FROM i18n_settings WHERE key='glossary'").get()?.value || "",
    budget: translationBudget(db, config),
  }));
  app.get("/api/admin/i18n/site", (req, res) => res.json(siteRow()));
  app.put("/api/admin/i18n/site", write((req, res) => {
    const current = siteRow();
    if (req.body.revision !== current.revision) return res.status(409).json({ error: "Outro salvamento alterou este item. Recarregue antes de salvar." });
    const locale = z.enum(LOCALES).parse(req.body.locale);
    const payload = siteSchema.parse(req.body.draft);
    validateAssets(payload);
    const state = stageReview({ kind: "paginas", sourceLocale: current.sourceLocale, locale, payload,
      drafts: current.draftByLocale, previous: current.review, visibility: "publico" });
    db.transaction(() => {
      saveSite(db, { ...getSite(db), revision: current.revision + 1, draftByLocale: state.drafts });
      storeReview(db, "paginas:site", state);
      if (!state.units.length) commitReview("paginas", "site", state);
    })();
    res.json(siteRow());
  }));
  app.put("/api/admin/i18n/settings", write(async (req, res) => {
    const glossary = z.string().max(10000).parse(req.body.glossary);
    if (!config.production && config.i18nGatewayUrl) return res.json(await remoteSettings("PUT", { glossary }));
    db.prepare("INSERT INTO i18n_settings(key,value) VALUES('glossary',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(glossary);
    res.json({ glossary, budget: translationBudget(db, config) });
  }));
  const generating = new Set();
  function reviewSubject(req) {
    const kind = z.enum([...kinds, "paginas"]).parse(req.params.kind);
    const id = req.params.id;
    if (kind === "paginas" && id !== "site") throw Object.assign(new Error("Item não encontrado."), { status: 404 });
    if (kind !== "paginas") getEntry(id, kind);
    const key = reviewKey(kind, id);
    const state = readReview(db, key);
    if (!state) throw Object.assign(new Error("Não há revisão pendente."), { status: 409 });
    if (req.body.version !== state.version) throw Object.assign(new Error("A revisão mudou. Reabra a revisão antes de continuar."), { status: 409 });
    return { kind, id, key, state };
  }
  const reviewResponse = (kind, id) => kind === "paginas" ? siteRow() : editorRow(getEntry(id, kind));
  app.post("/api/admin/reviews/:kind/:id/generate", async (req, res, next) => {
    let key;
    try {
      const input = z.object({ version: z.string(), keys: z.array(z.string()).max(1000).optional(), retry: z.boolean().optional(), instruction: z.string().max(1000).optional() }).parse(req.body);
      const subject = await gate(() => {
        if (!db.prepare("SELECT 1 FROM sessions WHERE token_hash=? AND admin_id=1 AND expires_at>?").get(req.sessionHash, Date.now())) throw Object.assign(new Error("Faça login para continuar."), {status:401});
        const value = reviewSubject(req);
        if (generating.has(value.key)) throw Object.assign(new Error("Tradução em andamento."), {status:409});
        generating.add(value.key); key = value.key;
        return value;
      });
      const { kind, id, state } = subject;
      const units = state.units.filter(unit => unit.source !== null &&
        (input.keys ? input.keys.includes(unit.key) : ["pending", "error"].includes(unit.status)));
      let values, failure;
      try {
        values = [];
        for (let offset = 0; offset < units.length; offset += 8) {
          const batch = units.slice(offset, offset + 8);
          const options = { from: state.sourceLocale, to: state.targetLocale, force: Boolean(input.retry), instruction: input.instruction || "" };
          // Keep successful proposals if a later alignment fails.
          if (batch.some(unit => unit.mode === "bold")) {
            for (const unit of batch) values.push(unit.mode === "bold"
              ? await generateBoldProposal(unit.source, unit.previous, translateUnits, options)
              : (await translateUnits([unit.source], options))[0]);
          } else values.push(...await translateUnits(batch.map(unit => unit.source), options));
        }
      } catch (error) { failure = error.publicMessage || error.message; }
      await gate(() => {
        if (!db.prepare("SELECT 1 FROM sessions WHERE token_hash=? AND admin_id=1 AND expires_at>?").get(req.sessionHash, Date.now())) throw Object.assign(new Error("Faça login para continuar."), { status: 401 });
        const current = readReview(db, key);
        if (current?.version !== state.version) throw Object.assign(new Error("O texto mudou durante a tradução. Reabra a revisão."), { status: 409 });
        const count = failure ? values?.length || 0 : units.length;
        units.forEach((unit, index) => {
          const target = current.units.find(item => item.key === unit.key);
          if (index < count) { target.proposal = values[index]; target.status = "suggested"; target.error = null; }
          else { target.error = failure; if (target.proposal === null) target.status = "error"; }
        });
        storeReview(db, key, current);
      });
      res.json(reviewResponse(kind, id));
    } catch (error) { next(error); }
    finally { if (key) generating.delete(key); }
  });
  app.post("/api/admin/reviews/:kind/:id/decide", write((req, res) => {
    const { kind, id, key, state } = reviewSubject(req);
    const action = z.enum(["approve", "edit", "reject", "keep", "approve-all"]).parse(req.body.action);
    if (action === "approve-all") {
      for (const unit of state.units) if (unit.status === "suggested" && !unit.error) unit.status = "approved";
    } else {
      const unit = state.units.find(item => item.key === req.body.key);
      if (!unit) return res.status(404).json({ error: "Trecho não encontrado." });
      if (action === "reject") { unit.status = "rejected"; unit.proposal = null; unit.error = null; }
      else if (action === "keep") {
        if (unit.previous === null) return res.status(409).json({ error: "Não há tradução anterior." });
        unit.proposal = unit.previous; unit.status = "approved"; unit.error = null;
      } else if (action === "edit") {
        const texts = z.array(z.string().max(30000)).max(1000).parse(req.body.texts);
        if (unit.mode === "bold") {
          try { unit.proposal = applyBoldRanges(unit.previous, phraseRanges(boldLayout(unit.previous).text, texts)); }
          catch (error) { return res.status(400).json({ error: error.message }); }
        } else unit.proposal = replaceTexts(unit.source, texts);
        unit.status = "approved"; unit.error = null;
      } else {
        if (unit.proposal === null && unit.source !== null) return res.status(409).json({ error: "Não há proposta para aprovar." });
        unit.status = "approved"; unit.error = null;
      }
    }
    storeReview(db, key, state);
    res.json(reviewResponse(kind, id));
  }));
  app.post("/api/admin/reviews/:kind/:id/complete", write((req, res) => {
    const { kind, id, state } = reviewSubject(req);
    db.transaction(() => commitReview(kind, id, state))();
    res.json(reviewResponse(kind, id));
  }));
  const projectUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, done) => done(null, req.mediaDirectory),
      filename: (req, file, done) => done(null, "upload"),
    }),
    limits: { fileSize: 100 * 1024 * 1024, files: 1, fields: 0 },
  });
  app.post(
    "/api/admin/uploads/project-media",
    async (req, res, next) => {
      try {
        req.mediaDirectory = await fs.mkdtemp(
          path.join(os.tmpdir(), "portfolio-media-"),
        );
        const clean = () =>
          fs
            .rm(req.mediaDirectory, { recursive: true, force: true })
            .catch(() => {});
        res.once("finish", clean);
        projectUpload.single("file")(req, res, async (error) => {
          if (error || req.aborted) await clean();
          if (error) return next(error);
          if (!req.aborted) next();
        });
      } catch (error) {
        next(error);
      }
    },
    write(async (req, res) => {
      try {
        if (!req.file)
          return res.status(400).json({ error: "Selecione um arquivo." });
        const assetId = await storeProjectMedia(db, storage, req.file);
        res.status(201).json(resolveMedia(db, { assetId, corFundo: null }));
      } finally {
        await fs.rm(req.mediaDirectory, { recursive: true, force: true });
      }
    }),
  );
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 },
  });
  app.post(
    "/api/admin/uploads",
    upload.single("file"),
    write(async (req, res) => {
      if (!req.file)
        return res.status(400).json({ error: "Selecione um arquivo." });
      const type = await fileTypeFromBuffer(req.file.buffer);
      if (
        !type ||
        !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
          type.mime,
        )
      )
        return res.status(400).json({ error: "Use JPEG, PNG, WebP ou PDF." });
      const id = randomUUID();
      await storage.put(id, req.file.buffer, type.mime);
      try {
        const metadata = type.mime.startsWith("image/")
          ? JSON.stringify({ corAutomatica: await detectBackground(req.file.buffer).catch(() => null) })
          : null;
        db.prepare(
          "INSERT INTO assets(id,object_key,name,mime,size,sha256,created_at,metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          id,
          id,
          req.file.originalname.slice(0, 255),
          type.mime,
          req.file.size,
          hash(req.file.buffer),
          now(),
          metadata,
        );
      } catch (e) {
        await storage.remove(id);
        throw e;
      }
      res.status(201).json({ id, url: `/api/media/${id}`, mime: type.mime, imagemBg: serializePayload({ imagemId: id }, db).imagemBg });
    }),
  );
  app.use((req, res, next) => {
    if (req.query.locale === "en-US" && kinds.some((kind) => req.path === `/api/${kind}`)) {
      const missing = db.prepare("SELECT COUNT(*) AS n FROM entries e LEFT JOIN entry_i18n i ON i.entry_id=e.id WHERE e.published IS NOT NULL AND i.published_en IS NULL").get().n;
      if (missing) return res.status(503).json({ error: "English content is being prepared." });
    }
    next();
  });
  for (const kind of kinds) {
    app.get(`/api/${kind}`, (req, res) =>
      res.json(
        db
          .prepare(
            "SELECT id, published FROM entries WHERE kind = ? AND published IS NOT NULL ORDER BY position, id",
          )
          .all(kind)
          .map((row) => {
            const locale = req.query.locale === "en-US" ? "en-US" : "pt-BR";
            const localized = locale === "en-US"
              ? db.prepare("SELECT published_en FROM entry_i18n WHERE entry_id=?").get(row.id)?.published_en
              : row.published;
            return localized ? { ...serializePayload(JSON.parse(localized), db), id: row.id } : null;
          }).filter(Boolean),
      ),
    );
    app.get(`/api/admin/${kind}`, (req, res) =>
      res.json(
        db
          .prepare("SELECT * FROM entries WHERE kind = ? ORDER BY position, id")
          .all(kind)
          .map(editorRow),
      ),
    );
    app.post(`/api/admin/${kind}`, write((req, res) => {
      const { visibilidade = "privado", locale = "pt-BR", sourceLocale = locale, ...content } = req.body;
      z.enum(LOCALES).parse(locale);
      if (sourceLocale !== locale) return res.status(400).json({ error: "Idioma inválido." });
      z.enum(["publico", "privado"]).parse(visibilidade);
      const payload = schemas[kind].parse(content);
      validateAssets(payload);
      const id = randomUUID();
      db.transaction(() => {
        const position = db.prepare("SELECT COALESCE(MAX(position),-1)+1 AS p FROM entries WHERE kind=?").get(kind).p;
        db.prepare("INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES(?,?,?,?,NULL,?)")
          .run(id, kind, position, JSON.stringify(payload), now());
        db.prepare("INSERT INTO entry_i18n(entry_id,source_locale) VALUES(?,?)").run(id, sourceLocale);
        const state = stageReview({kind, sourceLocale, locale, payload, drafts: {"pt-BR":null,"en-US":null}, visibility:visibilidade});
        storeReview(db, reviewKey(kind,id), state);
      })();
      res.status(201).json(editorRow(getEntry(id,kind)));
    }));
    app.put(
      `/api/admin/${kind}/order`,
      write((req, res) => {
        const ids = z.array(z.string()).max(1000).parse(req.body.ids);
        const current = db
          .prepare("SELECT id FROM entries WHERE kind = ?")
          .all(kind)
          .map((r) => r.id);
        if (
          ids.length !== current.length ||
          new Set(ids).size !== ids.length ||
          ids.some((id) => !current.includes(id))
        )
          return res
            .status(409)
            .json({ error: "A lista mudou. Atualize antes de ordenar." });
        db.transaction(() =>
          ids.forEach((id, i) =>
            db
              .prepare("UPDATE entries SET position = ? WHERE id = ?")
              .run(i, id),
          ),
        )();
        res.json({ ok: true });
      }),
    );
    app.get(`/api/admin/${kind}/:id`, (req, res) =>
      res.json(editorRow(getEntry(req.params.id, kind))),
    );
    app.post(`/api/admin/${kind}/:id/i18n/confirm`, write((req, res) => {
      const row = getEntry(req.params.id, kind);
      revision(req, row);
      const state = readReview(db, reviewKey(kind, row.id));
      if (!state) return res.status(409).json({ error: "Não há revisão pendente." });
      db.transaction(() => commitReview(kind, row.id, state))();
      res.json(editorRow(getEntry(row.id, kind)));
    }));
    app.put(`/api/admin/${kind}/:id`, write((req, res) => {
      const row = getEntry(req.params.id, kind);
      revision(req, row);
      const visibility = z.enum(["publico", "privado"]).optional().parse(req.body.visibilidade);
      const locale = z.enum(LOCALES).parse(req.body.locale || "pt-BR");
      const payload = schemas[kind].parse(req.body.draft);
      validateAssets(payload);
      res.json(saveEntryDraft(kind, row, payload, locale, visibility));
    }));
    for (const action of ["publish", "hide"])
      app.post(
        `/api/admin/${kind}/:id/${action}`,
        write((req, res) => {
          const row = getEntry(req.params.id, kind);
          revision(req, row);
          if (action === "publish")
            validateAssets(schemas[kind].parse(JSON.parse(row.draft)));
          const state = db.prepare("SELECT * FROM entry_i18n WHERE entry_id=?").get(row.id);
          if (action === "publish" && (readReview(db, reviewKey(kind, row.id)) || !state?.draft_en || JSON.parse(state.pending_units).length))
            throw Object.assign(new Error("Tradução incompleta ou pendente de revisão."), { status: 409 });
          db.transaction(() => {
          db.prepare(
            "UPDATE entries SET published = ?, revision = revision + 1, updated_at = ? WHERE id = ?",
          ).run(action === "publish" ? row.draft : null, now(), row.id);
          db.prepare("UPDATE entry_i18n SET published_en=? WHERE entry_id=?")
            .run(action === "publish" ? state.draft_en : null, row.id);
          })();
          if (action === "hide") {
            const pending = readReview(db, reviewKey(kind, row.id));
            if (pending) { pending.visibility = "privado"; storeReview(db, reviewKey(kind,row.id), pending); }
          }
          res.json(editorRow(getEntry(row.id, kind)));
        }),
      );
    app.delete(
      `/api/admin/${kind}/:id`,
      write((req, res) => {
        const row = getEntry(req.params.id, kind);
        revision(req, row);
        db.transaction(() => { db.prepare("DELETE FROM translation_reviews WHERE subject=?").run(reviewKey(kind,row.id)); db.prepare("DELETE FROM entries WHERE id = ?").run(row.id); })();
        res.json({ ok: true });
      }),
    );
  }
  app.use((req, res) =>
    res.status(404).json({ error: "Rota não encontrada." }),
  );
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof z.ZodError)
      return res.status(400).json({
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (error instanceof multer.MulterError)
      return res
        .status(400)
        .json({
          error: req.path.endsWith("/project-media")
            ? "Envie um único arquivo de até 100 MB (imagens: 10 MB)."
            : "Envie um único arquivo de até 10 MB.",
        });
    const status =
      error.status || (error.type === "entity.too.large" ? 413 : 500);
    if (status >= 500) console.error("API:", error.message);
    res.status(status).json({
      error:
        status >= 500
          ? "Não foi possível concluir a operação. Tente novamente."
          : error.message,
    });
  });
  return app;
}
