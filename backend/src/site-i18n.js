import { z } from "zod";
import defaults from "../../packages/i18n/default-site.json" with { type: "json" };
import { validDocument } from "./schema.js";
import { identifyBlocks } from "./translate.js";

export const siteSchema = z.object({
  introGreeting: z.string().trim().min(1).max(500).optional(),
  introName: z.string().trim().min(1).max(500).optional(),
  introSurname: z.string().trim().max(500).optional(),
  introDescription: z.custom(validDocument).optional(),
  githubUrl: z.string().url().max(2048).refine(value => /^https?:\/\//i.test(value)).optional(),
  imagemId: z.string().uuid().nullable().optional(),
  imagemSecundariaId: z.string().uuid().nullable().optional(),
  imagemAlt: z.string().max(500).optional(),
  imagemSecundariaAlt: z.string().max(500).optional(),
  heroTitle: z.string().trim().min(1).max(500),
  aboutTitle: z.string().trim().min(1).max(500),
  aboutParagraphs: z.custom(validDocument),
}).strict();
export function getSite(db) {
  const saved = db.prepare("SELECT value FROM i18n_settings WHERE key='site'").get();
  if (saved) {
    const site = JSON.parse(saved.value);
    const legacySite = !Object.hasOwn(site.draftByLocale["pt-BR"], "introName");
    for (const key of ["draftByLocale", "publishedByLocale"]) {
      site[key] = Object.fromEntries(Object.entries(defaults).map(([locale, value]) => [locale, { ...value, ...site[key]?.[locale] }]));
    }
    for (const key of ["draftByLocale", "publishedByLocale"]) {
      for (const [locale, legacy] of Object.entries({ "pt-BR": "Entre código, design e novas ideias.", "en-US": "Code, design, and new ideas." })) {
        if (legacySite && site[key][locale].aboutTitle === legacy) site[key][locale].aboutTitle = defaults[locale].aboutTitle;
      }
    }
    return site;
  }
  const pair = Object.fromEntries(Object.entries(defaults).map(([locale, value]) => [locale, identifyBlocks("paginas", value)]));
  return { revision: 1, sourceLocale: "pt-BR", draftByLocale: pair, publishedByLocale: pair, protectedUnits: [], pendingUnits: [] };
}
export function saveSite(db, value) {
  db.prepare("INSERT OR REPLACE INTO i18n_settings(key,value) VALUES('site',?)").run(JSON.stringify(value));
}
