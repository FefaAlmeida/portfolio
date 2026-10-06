import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { openDatabase } from "../src/db.js";
import { stageReview, completedDrafts } from "../src/review.js";
import { boldLayout, applyBoldRanges, phraseRanges, generateBoldProposal } from "../src/bold.js";
import { planBoldRecovery, applyBoldRecovery } from "../src/bold-recovery.js";
import { geminiTranslate } from "../src/translate.js";

const text = (value, marks) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });
const bold = value => text(value, [{ type: "bold" }]);
const paragraph = (...content) => ({ type: "paragraph", attrs: { i18nId: "a" }, content });
const payload = block => ({ titulo: "Title", descricao: { type: "doc", content: [block] } });
const highlights = value => {
  const { text, ranges } = boldLayout(value);
  return ranges.map(range => text.slice(range.start, range.end));
};

test("formatting review retains exact English prose, block IDs, links and italics with reordered phrases", async () => {
  const original = paragraph(text("Criei cartazes e dois vídeos."));
  const source = paragraph(text("Criei "), bold("cartazes"), text(" e "), bold("dois vídeos"), text("."));
  const target = paragraph(text("I made two videos and "), text("posters", [{ type: "italic" }, { type: "link", attrs: { href: "https://example.org" } }]), text("."));
  const state = stageReview({ kind: "projetos", sourceLocale: "pt-BR", locale: "pt-BR", payload: payload(source), drafts: { "pt-BR": payload(original), "en-US": payload(target) }, visibility: "publico" });
  assert.equal(state.units.length, 1);
  assert.equal(state.units[0].mode, "bold");
  assert.equal(state.units[0].status, "pending");
  assert.throws(() => completedDrafts(state), { status: 409 });
  state.units[0].proposal = await generateBoldProposal(source, target, async (units, options) => {
    assert.equal(options.mode, "align-bold");
    assert.deepEqual(JSON.parse(units[0]).highlights, ["cartazes", "dois vídeos"]);
    return [JSON.stringify(["posters", "two videos"])];
  }, { from: "pt-BR", to: "en-US" });
  state.units[0].status = "approved";
  const result = completedDrafts(state)["en-US"].descricao.content[0];
  assert.equal(boldLayout(result).text, boldLayout(target).text);
  assert.deepEqual(highlights(result), ["two videos", "posters"]);
  assert.deepEqual(result.content.find(node => node.text === "posters").marks, [...target.content[1].marks, { type: "bold" }]);
  assert.deepEqual(result.attrs, target.attrs);
});

test("whole-paragraph emphasis and removal need no model; removal leaves other marks intact", async () => {
  const target = paragraph(text("Reviewed English", [{ type: "italic" }, { type: "bold" }]));
  const unavailable = () => { throw new Error("Unexpected translation"); };
  const removed = await generateBoldProposal(paragraph(text("Português")), target, unavailable, {});
  assert.deepEqual(highlights(removed), []);
  assert.deepEqual(removed.content[0].marks, [{ type: "italic" }]);
  const added = await generateBoldProposal(paragraph(bold("Português")), removed, unavailable, {});
  assert.deepEqual(highlights(added), ["Reviewed English"]);
});

test("ambiguous, missing, overlapping and rewritten selections fail without touching the target", async () => {
  const target = paragraph(text("word and word plus two videos"));
  const before = structuredClone(target);
  for (const phrases of [["word"], ["new wording"], [null], []]) {
    await assert.rejects(generateBoldProposal(paragraph(bold("palavra"), text(" e texto")), target, async () => [JSON.stringify(phrases)], {}));
  }
  assert.throws(() => phraseRanges("two videos", ["two videos", "videos"]));
  assert.deepEqual(target, before);
});

test("splitting text across marks and hard breaks preserves exact content and metadata", () => {
  const input = paragraph(text("😀 two "), text("videos", [{ type: "italic" }]), { type: "hardBreak" }, text("Next line"));
  const result = applyBoldRanges(input, phraseRanges(boldLayout(input).text, ["two videos", "Next"]));
  assert.equal(boldLayout(result).text, boldLayout(input).text);
  assert.deepEqual(highlights(result), ["two videos", "Next"]);
  assert.ok(result.content.some(node => node.type === "hardBreak"));
  assert.ok(result.content.find(node => node.text === "videos").marks.some(mark => mark.type === "italic"));
});

test("Gemini alignment is isolated in cache, validated, and never translates the target", async t => {
  const db = openDatabase(":memory:"); t.after(() => db.close());
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    calls++;
    const prompt = JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    assert.match(prompt.instruction, /EXACT, unique substring/);
    return new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify([JSON.stringify(["two videos"])]) }] } }] }));
  });
  const translate = (units, options) => geminiTranslate(db, { geminiApiKey: "test" }, units, options);
  const source = paragraph(text("Criei "), bold("dois vídeos"));
  const target = paragraph(text("I made two videos"));
  for (let i = 0; i < 2; i++) {
    const result = await generateBoldProposal(source, target, translate, { from: "pt-BR", to: "en-US" });
    assert.deepEqual(highlights(result), ["two videos"]);
    assert.equal(boldLayout(result).text, boldLayout(target).text);
  }
  assert.equal(calls, 1);
});

test("ordinary translations and cache hits preserve mixed bold/plain spans and surrounding spaces", async t => {
  const db = openDatabase(":memory:"); t.after(() => db.close());
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: '["I made","two videos","for students."]' }] } }] }));
  });
  const input = paragraph(text("Criei "), bold("dois vídeos"), text(" para alunos."));
  for (let i = 0; i < 2; i++) {
    const [result] = await geminiTranslate(db, { geminiApiKey: "test" }, [input], { from: "pt-BR", to: "en-US" });
    assert.equal(boldLayout(result).text, "I made two videos for students.\n");
    assert.deepEqual(highlights(result), ["two videos"]);
  }
  assert.equal(calls, 1);
  const unformatted = applyBoldRanges(input, []);
  const [result] = await geminiTranslate(db, { geminiApiKey: "test" }, [unformatted], { from: "pt-BR", to: "en-US" });
  assert.deepEqual(highlights(result), []);
  assert.equal(calls, 1);
});

test("repair checks originals, keeps drafts/publications separate, preserves PT, and is idempotent", t => {
  const db = openDatabase(":memory:"); t.after(() => db.close());
  const manifest = JSON.parse(fs.readFileSync(new URL("../seed/bold-recovery.json", import.meta.url)));
  for (const id of new Set(manifest.map(item => item.id))) {
    const rows = manifest.filter(item => item.id === id);
    const pt = { titulo: id, descricao: { type: "doc", content: rows.map(item => item.source) } };
    const en = { titulo: id, descricao: { type: "doc", content: rows.map(item => ({ ...paragraph(text(item.before)), attrs: { i18nId: item.blockId } })) } };
    db.prepare("INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES(?,'experiencias',0,?,?,?)").run(id, JSON.stringify({ ...pt, titulo: "Unpublished title" }), JSON.stringify(pt), "now");
    db.prepare("INSERT INTO entry_i18n(entry_id,draft_en,published_en) VALUES(?,?,?)").run(id, JSON.stringify({ ...en, titulo: "Unpublished English" }), JSON.stringify(en));
  }
  const before = db.prepare("SELECT id,draft,published FROM entries ORDER BY id").all();
  const plan = planBoldRecovery(db, manifest);
  assert.equal(plan.changes.length, 10);
  assert.deepEqual(plan.audit, []);
  applyBoldRecovery(db, plan);
  assert.deepEqual(db.prepare("SELECT id,draft,published FROM entries ORDER BY id").all(), before);
  assert.equal(JSON.parse(db.prepare("SELECT draft_en FROM entry_i18n LIMIT 1").get().draft_en).titulo, "Unpublished English");
  assert.equal(planBoldRecovery(db, manifest).changes.length, 0);
  assert.throws(() => applyBoldRecovery(db, plan), /mudou/);
  db.prepare("UPDATE entry_i18n SET draft_en=? WHERE entry_id='exp-01'").run(JSON.stringify(payload(paragraph(text("Changed translation")))));
  assert.throws(() => planBoldRecovery(db, manifest), /mudou/);
});
