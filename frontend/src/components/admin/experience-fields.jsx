"use client";

import { useI18n } from "@/i18n/provider";

export default function ExperienceFields({ draft, changeDraft, disabled }) {
  const { ui } = useI18n();
  const change = (key, value) =>
    changeDraft((old) => ({ ...old, [key]: value }));
  return (
    <>
      <label className="admin-field">
        <span>{ui("Adicionar segunda imagem à galeria")}</span>
        <input
          type="checkbox"
          checked={Boolean(draft.imagemDupla)}
          disabled={disabled}
          onChange={(event) => change("imagemDupla", event.target.checked)}
        />
      </label>
      {draft.imagemDupla && !draft.imagemSecundariaId && (
        <p className="field-hint">
          {ui("Envie a segunda imagem para exibi-la na galeria.")}
        </p>
      )}
      <label className="admin-field">
        {ui("Enquadramento da imagem")}
        <select
          value={draft.imagemAjuste || "natural"}
          disabled={disabled}
          onChange={(event) => change("imagemAjuste", event.target.value)}
        >
          <option value="natural">{ui("Preservar proporção original")}</option>
          <option value="contain">
            {ui("Imagem inteira com margem (logos)")}
          </option>
          <option value="cover">{ui("Preencher com recorte")}</option>
        </select>
      </label>
      <label className="admin-field">
        {ui("Legenda da imagem")}
        <input
          value={draft.imagemLegenda || ""}
          maxLength={500}
          disabled={disabled}
          onChange={(event) => change("imagemLegenda", event.target.value)}
        />
      </label>
      <p className="field-hint">
        {ui(
          "Use o negrito no texto para destacar números e informações em rosa no site.",
        )}
      </p>
      <div className="field-grid">
        {[
          ["siteUrl", ui("Site")],
          ["instagramUrl", ui("Instagram")],
        ].map(([key, label]) => (
          <label key={key} className="admin-field">
            {label}
            <input
              type="url"
              value={draft[key] || ""}
              maxLength={2048}
              disabled={disabled}
              onChange={(event) => change(key, event.target.value)}
            />
          </label>
        ))}
      </div>
      {(draft.siteUrl?.startsWith("https://example.com/") ||
        draft.instagramUrl === "https://www.instagram.com/") && (
        <p className="field-hint">
          {ui("Links provisórios: substitua pelos endereços do projeto.")}
        </p>
      )}
    </>
  );
}
