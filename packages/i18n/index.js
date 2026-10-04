export const LOCALES = ["pt-BR", "en-US"];
export const DEFAULT_LOCALE = "pt-BR";
export const otherLocale = (locale) => locale === "en-US" ? "pt-BR" : "en-US";

const projectFields = [
  "titulo", "subtitulo", "pitch", "descricao", "problema", "solucao",
  "detalhes.periodo", "detalhes.tipo", "detalhes.modeloNegocio",
  "detalhes.diferencial", "detalhes.cicloAprendizado",
  "detalhes.tiposUsuarios", "detalhes.aplicacoes",
];
export const TRANSLATABLE_FIELDS = {
  projetos: projectFields,
  experiencias: ["titulo", "categoria", "periodo", "papel", "descricao", "imagemAlt", "imagemLegenda", "imagemSecundariaAlt", "resultados"],
  premios: ["titulo", "categoria", "instituicao", "descricao"],
  paginas: ["titulo", "heroTitle", "aboutTitle", "aboutParagraphs", "introGreeting", "introDescription", "imagemAlt", "imagemSecundariaAlt"],
};

export function translatableFields(kind, payload) {
  const fields = [...(TRANSLATABLE_FIELDS[kind] || [])].filter((field) => {
    const dates = field === "periodo" ? payload : field === "detalhes.periodo" ? payload?.detalhes : null;
    return !dates?.inicio && !dates?.fim;
  });
  if (kind === "projetos") {
    for (const profile of payload?.detalhes?.perfis || []) {
      fields.push(`detalhes.perfis.@${profile.categoria}.nome`, `detalhes.perfis.@${profile.categoria}.funcionalidades`);
    }
    for (const media of payload?.midias || []) fields.push(`midias.@${media.assetId}.alt`, `midias.@${media.assetId}.legenda`);
  }
  return fields;
}

export function localizedDates(kind, payload, locale) {
  const dates = kind === "projetos" ? payload?.detalhes : kind === "experiencias" ? payload : null;
  if (dates && (dates.inicio || dates.fim)) {
    const format = (value) => value === "present" ? (locale === "en-US" ? "Present" : "Presente") : `${value.slice(5)}/${value.slice(0, 4)}`;
    dates.periodo = dates.inicio && dates.fim ? `${format(dates.inicio)} – ${format(dates.fim)}` : dates.inicio ? format(dates.inicio) : dates.fim === "present" ? format(dates.fim) : `${locale === "en-US" ? "Until" : "Até"} ${format(dates.fim)}`;
  }
  return payload;
}
const identity = (value) => value?.attrs?.i18nId || value?.categoria || value?.assetId;
const keyOf = (object, key) => key.startsWith("@") && Array.isArray(object)
  ? object.findIndex((value) => identity(value) === key.slice(1)) : key;

export function getAt(object, path) {
  return path.split(".").reduce((value, key) => value?.[keyOf(value, key)], object);
}
export function setAt(object, path, value) {
  const keys = path.split(".");
  let cursor = object;
  for (const key of keys.slice(0, -1)) {
    const resolved = keyOf(cursor, key);
    if (resolved === -1) return;
    cursor = cursor[resolved] ||= {};
  }
  const resolved = keyOf(cursor, keys.at(-1));
  if (resolved !== -1) cursor[resolved] = value;
}
export function translationUnits(kind, payload) {
  const units = new Map();
  for (const field of translatableFields(kind, payload)) {
    const value = getAt(payload, field);
    if (value === undefined || value === null) continue;
    if (value?.type === "doc") {
      for (const [index, block] of (value.content || []).entries())
        units.set(`${field}.content.${block.attrs?.i18nId ? `@${block.attrs.i18nId}` : index}`, block);
    } else units.set(field, value);
  }
  return units;
}
export function changedUnits(kind, oldPayload, newPayload) {
  const previous = translationUnits(kind, oldPayload || {});
  return [...translationUnits(kind, newPayload).entries()].filter(
    ([key, value]) => JSON.stringify(value) !== JSON.stringify(previous.get(key)),
  );
}
