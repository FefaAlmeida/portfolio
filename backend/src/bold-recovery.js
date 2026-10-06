import { getAt, translatableFields } from "../../packages/i18n/index.js";
import { applyBoldRanges, boldLayout, phraseRanges } from "./bold.js";
import { validDocument } from "./schema.js";

// An explicit, reviewed repair manifest. Never replace unrelated copy or assets.
export function planBoldRecovery(db, manifest) {
  const changes = [];
  const audit = [];
  for (const row of db.prepare("SELECT e.*,i.draft_en,i.published_en,i.source_locale FROM entries e JOIN entry_i18n i ON i.entry_id=e.id").all()) {
    if (row.source_locale !== "pt-BR") continue;
    for (const [sourceColumn, targetColumn] of [["draft", "draft_en"], ["published", "published_en"]]) {
      if (!row[sourceColumn] || !row[targetColumn]) continue;
      const source = JSON.parse(row[sourceColumn]);
      const target = JSON.parse(row[targetColumn]);
      const repairs = manifest.filter(item => item.kind === row.kind && item.id === row.id);
      for (const repair of repairs) {
        const sourceBlock = getAt(source, repair.field)?.content?.find(block => block.attrs?.i18nId === repair.blockId);
        const targetBlock = getAt(target, repair.field)?.content?.find(block => block.attrs?.i18nId === repair.blockId);
        const label = `${row.kind}:${row.id}:${targetColumn}:${repair.blockId}`;
        // Both content and emphasis must still match the inspected Portuguese.
        if (JSON.stringify(sourceBlock) !== JSON.stringify(repair.source) || !targetBlock)
          throw new Error(`Conteúdo de origem mudou: ${label}`);
        const text = boldLayout(targetBlock).text;
        const after = repair.before + repair.append;
        if (text !== repair.before + "\n" && text !== after + "\n")
          throw new Error(`Conteúdo em inglês mudou: ${label}`);
        const block = structuredClone(targetBlock);
        if (text !== after + "\n") block.content.push({ type: "text", text: repair.append });
        const formatted = applyBoldRanges(block, phraseRanges(boldLayout(block).text, repair.highlights));
        const doc = getAt(target, repair.field);
        doc.content[doc.content.indexOf(targetBlock)] = formatted;
        if (!validDocument(doc)) throw new Error(`Documento inválido: ${label}`);
      }
      if (JSON.stringify(target) !== JSON.stringify(JSON.parse(row[targetColumn]))) {
        if (db.prepare("SELECT 1 FROM translation_reviews WHERE subject=?").get(`${row.kind}:${row.id}`))
          throw new Error(`Existe revisão pendente: ${row.kind}:${row.id}`);
        changes.push({ id: row.id, column: targetColumn, before: row[targetColumn], after: JSON.stringify(target) });
      }
      audit.push(...auditBold(row.kind, source, target, `${row.id}:${targetColumn}`));
    }
  }
  const siteRow = db.prepare("SELECT value FROM i18n_settings WHERE key='site'").get();
  if (siteRow) {
    const site = JSON.parse(siteRow.value);
    for (const field of ["draftByLocale", "publishedByLocale"])
      audit.push(...auditBold("paginas", site[field]?.["pt-BR"], site[field]?.["en-US"], `site:${field}`));
  }
  return { changes, audit };
}

function auditBold(kind, source, target, label) {
  if (!source) return [];
  return translatableFields(kind, source).flatMap(field => {
    const doc = getAt(source, field);
    if (doc?.type !== "doc") return [];
    const other = getAt(target, field);
    return (doc.content || []).flatMap((block, index) => {
      const count = boldLayout(block).ranges.length;
      if (!count) return [];
      const translated = block.attrs?.i18nId
        ? other?.content?.find(item => item.attrs?.i18nId === block.attrs.i18nId)
        : other?.content?.[index];
      const targetCount = boldLayout(translated).ranges.length;
      return count === targetCount ? [] : [{ label, field, block: block.attrs?.i18nId || index, sourceHighlights: count, targetHighlights: targetCount }];
    });
  });
}

export function applyBoldRecovery(db, plan) {
  db.transaction(() => {
    for (const change of plan.changes) {
      if (!["draft_en", "published_en"].includes(change.column)) throw new Error("Coluna inválida.");
      const result = db.prepare(`UPDATE entry_i18n SET ${change.column}=? WHERE entry_id=? AND ${change.column}=?`)
        .run(change.after, change.id, change.before);
      if (result.changes !== 1) throw new Error("Conteúdo mudou durante a recuperação.");
    }
    for (const id of new Set(plan.changes.map(change => change.id)))
      db.prepare("UPDATE entries SET revision=revision+1,updated_at=? WHERE id=?").run(new Date().toISOString(), id);
  })();
}
