import { z } from "zod";
import { migrateProjectPayload } from "./project-payload.js";
export const kinds = ["projetos", "experiencias", "premios"];
const short = z.string().trim().max(500);
const title = z.string().trim().min(1, "Informe o título.").max(160);
const url = z
  .string()
  .max(2048)
  .refine((v) => !v || /^https?:\/\//i.test(v), "Use um link http ou https.")
  .refine((v) => {
    try {
      return !v || Boolean(new URL(v).hostname);
    } catch {
      return false;
    }
  });
const id = z.string().uuid().nullable().optional();
export const emptyDoc = () => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});
export function validDocument(doc) {
  let count = 0;
  function walk(node, parent, depth = 0) {
    if (
      !node ||
      typeof node !== "object" ||
      Array.isArray(node) ||
      depth > 12 ||
      ++count > 4000
    )
      return false;
    const allowed = {
      doc: ["paragraph", "bulletList", "orderedList"],
      paragraph: ["text", "hardBreak"],
      bulletList: ["listItem"],
      orderedList: ["listItem"],
      listItem: ["paragraph", "bulletList", "orderedList"],
      text: [],
      hardBreak: [],
    };
    if (
      !Object.hasOwn(allowed, node.type) ||
      (parent && !allowed[parent].includes(node.type))
    )
      return false;
    if (
      Object.keys(node).some(
        (k) => !["type", "content", "text", "marks", "attrs"].includes(k),
      )
    )
      return false;
    if (
      node.type === "text"
        ? typeof node.text !== "string" ||
          !node.text.length ||
          node.text.length > 30000
        : node.text !== undefined
    )
      return false;
    if (node.attrs) {
      if (typeof node.attrs !== "object" || Array.isArray(node.attrs)) return false;
      const allowedAttrs = node.type === "orderedList" ? ["start", "type", "i18nId"] : node.type === "paragraph" ? ["i18nId", "textAlign"] : ["i18nId"];
      if (Object.keys(node.attrs).some((key) => !allowedAttrs.includes(key))) return false;
      if (node.attrs.textAlign != null && !["left", "center", "right", "justify"].includes(node.attrs.textAlign)) return false;
      if (node.attrs.i18nId != null && (typeof node.attrs.i18nId !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(node.attrs.i18nId) || !["paragraph", "bulletList", "orderedList"].includes(node.type))) return false;
      if (node.type === "orderedList" && ((node.attrs.type != null && node.attrs.type !== "1") || !Number.isInteger(node.attrs.start) || node.attrs.start < 1)) return false;
    }
    if (node.marks) {
      if (
        node.type !== "text" ||
        !Array.isArray(node.marks) ||
        node.marks.length > 3
      )
        return false;
      for (const mark of node.marks) {
        if (
          !["bold", "italic", "link"].includes(mark.type) ||
          Object.keys(mark).some((k) => !["type", "attrs"].includes(k))
        )
          return false;
        if (mark.type === "link") {
          if (
            !mark.attrs ||
            !url.safeParse(mark.attrs.href).success ||
            !mark.attrs.href
          )
            return false;
          if (
            Object.keys(mark.attrs).some(
              (k) => !["href", "target", "rel", "class"].includes(k),
            )
          )
            return false;
        } else if (mark.attrs) return false;
      }
    }
    if (
      node.content !== undefined &&
      (!Array.isArray(node.content) ||
        !node.content.every((n) => walk(n, node.type, depth + 1)))
    )
      return false;
    return true;
  }
  return (
    doc?.type === "doc" &&
    walk(doc, null) &&
    JSON.stringify(doc).length <= 100000
  );
}
const rich = z
  .custom(validDocument, "Texto formatado inválido.")
  .default(emptyDoc);
const list = z.array(short.min(1)).max(60).default([]);
const common = { titulo: title, imagemId: id };
export const schemas = {
  projetos: z.preprocess(
    migrateProjectPayload,
    z
      .object({
        titulo: title,
        midias: z
          .array(
            z.object({
              assetId: z.string().uuid(),
              alt: short.default(""),
              legenda: short.default(""),
              corFundo: z
                .string()
                .regex(/^#[0-9a-fA-F]{6}$/)
                .nullable()
                .default(null),
            }),
          )
          .max(5)
          .default([]),
        capaId: z.string().uuid().nullable().default(null),
        subtitulo: short.default(""),
        pitch: z.union([short, rich]).default(emptyDoc),
        descricao: rich,
        tagDireita: z
          .enum(["EM DESENVOLVIMENTO", "FINALIZADO"], {
            error: "Selecione um status de projeto válido.",
          })
          .default("EM DESENVOLVIMENTO"),
        tecnologias: list,
        problema: rich,
        solucao: rich,
        linkGithub: url.default(""),
        linkDeploy: url.default(""),
        detalhes: z
          .object({
            periodo: short.default(""),
            inicio: z
              .string()
              .regex(/^(?:[1-9]\d{3}-(?:0[1-9]|1[0-2]))?$/)
              .default(""),
            fim: z
              .string()
              .regex(/^(?:present|[1-9]\d{3}-(?:0[1-9]|1[0-2]))?$/)
              .default(""),
            tipo: short.default(""),
            modeloNegocio: rich,
            diferencial: rich,
            cicloAprendizado: short.default(""),
            // Unmatched legacy labels remain available for manual review.
            tiposUsuarios: list.optional(),
            perfis: z.array(z.object({
              categoria: z.enum(["admin", "usuario"]),
              nome: short.default(""),
              funcionalidades: list,
            }).strict()).max(2).refine(
              (profiles) => new Set(profiles.map((profile) => profile.categoria)).size === profiles.length,
              "Use no máximo um administrador e um usuário.",
            ).default([]),
            aplicacoes: list,
          })
          .strict()
          .refine(
            (value) =>
              !value.inicio ||
              !value.fim ||
              value.fim === "present" ||
              value.inicio <= value.fim,
            {
              message:
                "O fim do projeto deve ser igual ou posterior ao início.",
              path: ["fim"],
            },
          )
          .default({}),
      })
      .strict()
      .superRefine((value, ctx) => {
        if (
          new Set(value.midias.map((m) => m.assetId)).size !==
          value.midias.length
        )
          ctx.addIssue({
            code: "custom",
            path: ["midias"],
            message: "Não repita a mesma mídia.",
          });
        if (
          value.midias.length
            ? !value.midias.some((m) => m.assetId === value.capaId)
            : value.capaId !== null
        )
          ctx.addIssue({
            code: "custom",
            path: ["capaId"],
            message: "Selecione uma das mídias como capa.",
          });
      }),
  ),
  experiencias: z
    .object({
      ...common,
      imagemAlt: short.default(""),
      imagemLegenda: short.default(""),
      imagemDupla: z.boolean().default(false),
      imagemSecundariaId: id,
      imagemSecundariaAlt: short.default(""),
      imagemAjuste: z.enum(["natural", "contain", "cover"]).default("natural"),
      resultados: z.array(short.min(1)).max(3).default([]),
      siteUrl: url.default(""),
      instagramUrl: url.default(""),
      categoria: short.default(""),
      periodo: short.default(""),
      inicio: z
        .string()
        .regex(/^(?:[1-9]\d{3}-(?:0[1-9]|1[0-2]))?$/)
        .default(""),
      fim: z
        .string()
        .regex(/^(?:present|[1-9]\d{3}-(?:0[1-9]|1[0-2]))?$/)
        .default(""),
      papel: short.default(""),
      descricao: rich,
    })
    .strict()
    .refine(
      (value) =>
        !value.inicio ||
        !value.fim ||
        value.fim === "present" ||
        value.inicio <= value.fim,
      {
        message: "O fim da experiência deve ser igual ou posterior ao início.",
        path: ["fim"],
      },
    ),
  premios: z
    .object({
      titulo: title,
      categoria: short.default(""),
      ano: z.number().int().min(1900).max(2200),
      instituicao: short.default(""),
      descricao: rich,
      credencialId: id,
      credencialUrl: url.default(""),
    })
    .strict()
    .refine(
      (v) => !(v.credencialId && v.credencialUrl),
      "Escolha arquivo ou link para a credencial.",
    ),
};
export function resolveMedia(db, media) {
  const asset = db
    .prepare("SELECT * FROM assets WHERE id=?")
    .get(media.assetId);
  const metadata = asset?.metadata ? JSON.parse(asset.metadata) : {};
  return {
    ...media,
    tipo: asset?.mime.startsWith("video/") ? "video" : "imagem",
    nome: asset?.name || "Mídia",
    url: `/api/media/${media.assetId}`,
    previewUrl: `/api/media/${metadata.posterId || media.assetId}`,
    corAutomatica: metadata.corAutomatica || "#f4eee1",
  };
}
export function hydratePayload(payload, db) {
  return payload.midias
    ? {
        ...payload,
        midias: payload.midias.map((media) => resolveMedia(db, media)),
      }
    : payload;
}
export function serializePayload(payload, db) {
  payload = hydratePayload(payload, db);
  const cover = payload.midias?.find((m) => m.assetId === payload.capaId);
  const imageAsset = payload.imagemId && db.prepare("SELECT metadata FROM assets WHERE id=?").get(payload.imagemId);
  const imageColor = imageAsset?.metadata && JSON.parse(imageAsset.metadata).corAutomatica;
  return {
    ...payload,
    imagemUrl:
      cover?.previewUrl ||
      (payload.imagemId ? `/api/media/${payload.imagemId}` : ""),
    imagemBg: cover ? cover.corFundo || cover.corAutomatica : payload.imagemBg || imageColor,
    ...(payload.imagemSecundariaId ? { imagemSecundariaUrl: `/api/media/${payload.imagemSecundariaId}` } : {}),
    credencialUrl: payload.credencialId
      ? `/api/media/${payload.credencialId}`
      : payload.credencialUrl || "",
  };
}
