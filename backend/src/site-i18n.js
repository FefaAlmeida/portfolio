import { z } from "zod";
import defaults from "../../packages/i18n/default-site.json" with { type: "json" };
import { validDocument } from "./schema.js";
import { identifyBlocks } from "./translate.js";

export const siteSchema = z.object({
  heroTitle: z.string().trim().min(1).max(500),
  aboutTitle: z.string().trim().min(1).max(500),
  aboutParagraphs: z.custom(validDocument),
}).strict();
export function getSite(db) {
  const saved = db.prepare("SELECT value FROM i18n_settings WHERE key='site'").get();
  if (saved) return JSON.parse(saved.value);
  const pair = Object.fromEntries(Object.entries(defaults).map(([locale, value]) => [locale, identifyBlocks("paginas", value)]));
  return { revision: 1, sourceLocale: "pt-BR", draftByLocale: pair, publishedByLocale: pair, protectedUnits: [], pendingUnits: [] };
}
export function saveSite(db, value) {
  db.prepare("INSERT OR REPLACE INTO i18n_settings(key,value) VALUES('site',?)").run(JSON.stringify(value));
}
