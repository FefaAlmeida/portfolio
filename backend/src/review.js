import { randomUUID } from "node:crypto";
import { getAt, setAt, translationUnits, translatableFields, otherLocale, localizedDates } from "../../packages/i18n/index.js";
import { identifyBlocks } from "./translate.js";
import { boldLayout, immediateBoldProposal } from "./bold.js";

export function textParts(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach(item => textParts(item, result));
  else if (value?.type === "text") result.push(value.text);
  else if (value?.content) textParts(value.content, result);
  return result;
}
export function replaceTexts(value, texts) {
  let index = 0;
  const walk = node => {
    if (typeof node === "string") return texts[index++];
    if (Array.isArray(node)) return node.map(walk);
    if (node?.type === "text") return { ...node, text: texts[index++] };
    if (node?.content) return { ...node, content: walk(node.content) };
    return node;
  };
  if (texts.length !== textParts(value).length || texts.some(text => typeof text !== "string" || text.length > 30000))
    throw Object.assign(new Error("Tradução inválida."), { status: 400 });
  return walk(structuredClone(value));
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const reviewKey = (kind, id) => `${kind}:${id}`;
export function readReview(db, key) {
  const row = db.prepare("SELECT state FROM translation_reviews WHERE subject=?").get(key);
  return row ? JSON.parse(row.state) : null;
}
export function storeReview(db, key, state) {
  state.version = randomUUID();
  db.prepare("INSERT INTO translation_reviews(subject,state) VALUES(?,?) ON CONFLICT(subject) DO UPDATE SET state=excluded.state")
    .run(key, JSON.stringify(state));
  return state;
}

// Drafts stay in their real locale, even when the first saved item is English.
export function stageReview({ kind, sourceLocale, locale, payload, drafts, previous, visibility }) {
  drafts = structuredClone(previous?.drafts || drafts);
  const before = drafts[locale];
  payload = identifyBlocks(kind, payload, before);
  const targetLocale = otherLocale(sourceLocale);
  const state = { version: randomUUID(), kind, sourceLocale, targetLocale, visibility, drafts, units: previous?.units || [] };
  if (locale !== sourceLocale) {
    if (!drafts[sourceLocale]) throw Object.assign(new Error("Salve o idioma de origem primeiro."), { status: 409 });
    const old = translationUnits(kind, before || {});
    const next = translationUnits(kind, payload);
    state.units = state.units.map(unit => {
      if (!equal(old.get(unit.key), next.get(unit.key))) {
        const proposal = next.get(unit.key) ?? null;
        return { ...unit, proposal, status: "approved", error: null };
      }
      return unit;
    });
    drafts[locale] = payload;
    // Shared data follows the edited payload, but source-language text is preserved.
    const shared = structuredClone(payload);
    if (kind === "projetos" && drafts[sourceLocale].detalhes?.perfis)
      (shared.detalhes ||= {}).perfis = structuredClone(drafts[sourceLocale].detalhes.perfis);
    for (const field of translatableFields(kind, payload)) {
      if (getAt(drafts[sourceLocale], field) !== undefined) continue;
      const value = getAt(payload, field);
      if (value !== undefined) setAt(shared, field, Array.isArray(value) ? [] : value?.type === "doc" ? { type: "doc", content: [] } : "");
    }
    for (const field of translatableFields(kind, drafts[sourceLocale])) {
      const value = getAt(drafts[sourceLocale], field);
      if (value !== undefined) setAt(shared, field, structuredClone(value));
    }
    drafts[sourceLocale] = shared;
    return state;
  }
  const oldUnits = translationUnits(kind, before || {});
  const newUnits = translationUnits(kind, payload);
  const targets = translationUnits(kind, drafts[targetLocale] || {});
  const prior = new Map(state.units.map(unit => [unit.key, unit]));
  state.units = [];
  for (const key of new Set([...newUnits.keys(), ...oldUnits.keys(), ...prior.keys()])) {
    const source = newUnits.get(key) ?? null;
    const old = oldUnits.get(key) ?? null;
    const saved = prior.get(key);
    if (saved && equal(saved.source, source)) { state.units.push(saved); continue; }
    const missing = source !== null && !targets.has(key) && (!drafts[targetLocale] || !oldUnits.has(key));
    if (!missing && equal(source, old) && !saved) continue;
    const previousTarget = targets.get(key) ?? null;
    const beforeSource = saved?.beforeSource ?? old;
    const formattingOnly = !missing && source?.type && beforeSource?.type && previousTarget?.type &&
      boldLayout(source).text === boldLayout(beforeSource).text;
    const boldChanged = formattingOnly && !equal(boldLayout(source).ranges, boldLayout(beforeSource).ranges);
    // Other presentation changes still don't request a translation.
    if (formattingOnly && !boldChanged && !saved) continue;
    if (boldChanged) {
      const proposal = immediateBoldProposal(source, previousTarget);
      state.units.push({ key, mode: "bold", beforeSource, source, previous: previousTarget,
        proposal, status: proposal ? "suggested" : "pending", error: null });
      continue;
    }
    // Empty fields still propagate, but do not require a paid translation.
    const hasText = textParts(source).some(text => text.trim());
    if (!hasText && !textParts(previousTarget).some(text => text.trim()) && !textParts(old).some(text => text.trim())) continue;
    state.units.push({ key, beforeSource: saved?.beforeSource ?? old, source,
      previous: previousTarget, proposal: hasText ? null : source,
      status: hasText ? "pending" : "suggested", error: null });
  }
  drafts[locale] = payload;
  return state;
}

export function completedDrafts(state) {
  if (state.units.some(unit => unit.status !== "approved"))
    throw Object.assign(new Error("Revise todos os trechos antes de concluir."), { status: 409 });
  const { kind, sourceLocale, targetLocale, drafts } = state;
  const source = drafts[sourceLocale];
  const old = drafts[targetLocale];
  const target = structuredClone(source);
  if (kind === "projetos" && target.detalhes) {
    if (old && target.detalhes.perfis) target.detalhes.perfis = target.detalhes.perfis.filter(profile =>
      old.detalhes?.perfis?.some(item => item.categoria === profile.categoria) ||
      state.units.some(unit => unit.key.startsWith(`detalhes.perfis.@${profile.categoria}.`) && unit.source !== null));
    for (const profile of old?.detalhes?.perfis || []) {
      const prefix = `detalhes.perfis.@${profile.categoria}.`;
      if (!target.detalhes.perfis?.some(item => item.categoria === profile.categoria) &&
          !state.units.some(unit => unit.key.startsWith(prefix) && unit.source === null))
        (target.detalhes.perfis ||= []).push(structuredClone(profile));
    }
  }
  for (const field of translatableFields(kind, source)) {
    const next = getAt(source, field);
    const prior = getAt(old, field);
    if (next?.type === "doc") {
      const blocks = next.content || [];
      const content = blocks.flatMap(block => {
        const id = block.attrs?.i18nId;
        const previous = prior?.content?.find(item => item.attrs?.i18nId === id);
        const reviewed = state.units.some(unit => unit.key === `${field}.content.@${id}`);
        return previous ? [structuredClone(previous)] : !old || reviewed ? [structuredClone(block)] : [];
      });
      for (const block of prior?.content || []) {
        const id = block.attrs?.i18nId;
        if (!blocks.some(item => item.attrs?.i18nId === id) &&
            !state.units.some(unit => unit.key === `${field}.content.@${id}` && unit.source === null))
          content.push(structuredClone(block));
      }
      setAt(target, field, { ...next, content });
    } else if (prior !== undefined) setAt(target, field, structuredClone(prior));
    else if (old && next !== undefined) setAt(target, field, Array.isArray(next) ? [] : "");
  }
  for (const unit of state.units) {
    if (unit.source === null) continue; // Source structure already removed the field/block.
    if (unit.proposal === null && unit.key.includes(".content.@")) {
      const [field, id] = unit.key.split(".content.@");
      const doc = getAt(target, field);
      if (doc) doc.content = doc.content.filter(block => block.attrs?.i18nId !== id);
    } else setAt(target, unit.key, structuredClone(unit.proposal));
  }
  return { [sourceLocale]: localizedDates(kind, structuredClone(source), sourceLocale),
    [targetLocale]: localizedDates(kind, target, targetLocale) };
}
