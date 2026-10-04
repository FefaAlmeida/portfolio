"use client";

import { Film, ImagePlus, MoreVertical, Star } from "lucide-react";
import { DropdownMenu, Popover } from "radix-ui";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";
import SortableList from "./sortable-list";

const types = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

export default function ProjectMediaEditor({
  draft,
  disabled,
  changeDraft,
  run,
  mutation,
  onNotice,
}) {
  const { ui } = useI18n();
  const [progress, setProgress] = useState("");
  const [dragging, setDragging] = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const uploading = useRef(false);
  const input = useRef(null);
  const media = draft.midias || [];

  async function upload(files) {
    if (disabled || uploading.current || !files.length) return;
    uploading.current = true;
    try {
      await run(async () => {
        if (media.length + files.length > 5)
          throw new Error(ui("Cada projeto pode ter até 5 mídias."));
        if (
          media.filter((m) => m.tipo === "video").length +
            files.filter((f) => f.type.startsWith("video/")).length >
          1
        )
          throw new Error(ui("Cada projeto pode ter no máximo um vídeo."));
        for (const file of files) {
          if (!types.has(file.type))
            throw new Error(`${file.name}: use JPEG, PNG, WebP, MP4 ou WebM.`);
          const limit = file.type.startsWith("video/") ? 100 : 10;
          if (file.size > limit * 1024 * 1024)
            throw new Error(
              ui("{0}: o limite é {1} MB.", { 0: file.name, 1: limit }),
            );
        }
        const errors = [];
        let hasVideo = media.some((m) => m.tipo === "video");
        for (const [index, file] of files.entries()) {
          setProgress(
            ui("Enviando e processando {0}/{1}: {2}", {
              0: index + 1,
              1: files.length,
              2: file.name,
            }),
          );
          try {
            const form = new FormData();
            form.append("file", file);
            const result = await mutation(
              "/admin/uploads/project-media",
              "POST",
              form,
            );
            // The server's detected type is authoritative, even for mislabeled files.
            if (result.tipo === "video" && hasVideo)
              throw new Error(ui("Cada projeto pode ter no máximo um vídeo."));
            hasVideo ||= result.tipo === "video";
            changeDraft((old) => ({
              ...old,
              midias: [...old.midias, result],
              capaId: old.capaId || result.assetId,
            }));
          } catch (error) {
            errors.push(`${file.name}: ${error.message}`);
            if (error.status === 401 || error.status === 403) throw error;
          }
        }
        if (errors.length) throw new Error(errors.join(" "));
        onNotice(ui("Mídias enviadas. Salve o projeto para vinculá-las."));
      });
    } finally {
      uploading.current = false;
      setProgress("");
    }
  }
  function remove(assetId) {
    changeDraft((old) => {
      const midias = old.midias.filter((item) => item.assetId !== assetId);
      return {
        ...old,
        midias,
        capaId:
          old.capaId === assetId ? midias[0]?.assetId || null : old.capaId,
      };
    });
  }
  function color(assetId, value) {
    changeDraft(
      (old) => ({
        ...old,
        midias: old.midias.map((item) =>
          item.assetId === assetId ? { ...item, corFundo: value } : item,
        ),
      }),
      `media-color-${assetId}`,
    );
  }
  return (
    <section
      className="admin-field project-media-editor"
      aria-label={ui("Gerenciar mídias")}
    >
      <div className="media-heading">
        <label htmlFor="project-media-upload">{ui("Mídias do projeto")}</label>
        <span>{media.length}/5</span>
      </div>
      <small>
        {ui(
          "JPEG, PNG ou WebP · até 10 MB por foto. MP4 ou WebM · até 100 MB, no máximo um vídeo.",
        )}
      </small>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: this drop target supplements the labeled native file input. */}
      <div
        className={`media-dropzone ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          upload([...event.dataTransfer.files]);
        }}
      >
        <ImagePlus aria-hidden="true" />
        <div>
          <strong>{ui("Arraste fotos ou um vídeo aqui")}</strong>
          <span>
            {ui("O primeiro envio vira a capa. Você pode trocar depois.")}
          </span>
        </div>
        <input
          ref={input}
          id="project-media-upload"
          type="file"
          multiple
          accept={[...types].join(",")}
          disabled={disabled || media.length >= 5}
          onChange={(event) => {
            upload([...event.target.files]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled || media.length >= 5}
          onClick={() => input.current?.click()}
        >
          {ui("Adicionar mídias")}
        </button>
      </div>
      {progress && (
        <output className="media-progress" aria-live="polite">
          {progress}
        </output>
      )}
      <SortableList
        items={media}
        getId={(item) => item.assetId}
        getLabel={(item) => item.nome}
        disabled={disabled}
        className="media-list"
        itemClassName="media-row"
        onReorder={(midias) => {
          changeDraft((old) => ({ ...old, midias }));
          return true;
        }}
      >
        {(item) => (
          <>
            <div
              className="media-thumbnail"
              style={{ backgroundColor: item.corFundo || item.corAutomatica }}
            >
              {/* biome-ignore lint/performance/noImgElement: private uploads need authenticated original media URLs. */}
              <img
                src={item.previewUrl}
                alt={ui("Miniatura de {0}", { 0: item.nome })}
                draggable={false}
              />
              {item.tipo === "video" && (
                <Film className="media-video-icon" aria-label={ui("Vídeo")} />
              )}
            </div>
            <div className="media-info">
              <strong>{item.nome}</strong>
              {["alt", "legenda"].map((key) => (
                <label key={key} className="admin-field">
                  {ui(key === "alt" ? "Texto alternativo" : "Legenda")}
                  <input
                    value={item[key] || ""}
                    maxLength={500}
                    disabled={disabled}
                    onChange={(event) =>
                      changeDraft((old) => ({
                        ...old,
                        midias: old.midias.map((media) =>
                          media.assetId === item.assetId
                            ? { ...media, [key]: event.target.value }
                            : media,
                        ),
                      }))
                    }
                  />
                </label>
              ))}
              <span>
                {item.tipo === "video" ? ui("Vídeo") : ui("Foto")}
                {draft.capaId === item.assetId && (
                  <b className="media-cover-badge">
                    <Star size={12} aria-hidden="true" />
                    {ui("Capa")}
                  </b>
                )}
              </span>
            </div>
            <Popover.Root
              open={adjusting === item.assetId}
              onOpenChange={(open) => setAdjusting(open ? item.assetId : null)}
            >
              <Popover.Anchor asChild>
                <div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="media-menu-trigger"
                        disabled={disabled}
                        aria-label={ui("Opções de {0}", { 0: item.nome })}
                      >
                        <MoreVertical size={20} aria-hidden="true" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="media-menu"
                        sideOffset={5}
                        align="end"
                        onCloseAutoFocus={(event) => {
                          if (adjusting === item.assetId)
                            event.preventDefault();
                        }}
                      >
                        <DropdownMenu.Item
                          disabled={draft.capaId === item.assetId}
                          onSelect={() =>
                            changeDraft((old) => ({
                              ...old,
                              capaId: item.assetId,
                            }))
                          }
                        >
                          {ui("Tornar capa")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => setAdjusting(item.assetId)}
                        >
                          {ui("Ajustar fundo")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="media-delete"
                          onSelect={() => remove(item.assetId)}
                        >
                          {ui("Excluir")}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </Popover.Anchor>
              <Popover.Portal>
                <Popover.Content
                  className="media-color-popover"
                  align="end"
                  sideOffset={6}
                  aria-label={ui("Fundo de {0}", { 0: item.nome })}
                >
                  <label>
                    {ui("Cor de fundo")}
                    <input
                      type="color"
                      aria-label={ui("Cor de fundo de {0}", { 0: item.nome })}
                      value={item.corFundo || item.corAutomatica}
                      onChange={(event) =>
                        color(item.assetId, event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!item.corFundo}
                    onClick={() => color(item.assetId, null)}
                  >
                    {ui("Restaurar automático")}
                  </button>
                  <Popover.Close asChild>
                    <button type="button">{ui("Concluir")}</button>
                  </Popover.Close>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </>
        )}
      </SortableList>
      {media.some((item) => item.tipo === "video") && (
        <p className="field-hint">
          {ui(
            "O modal exibirá somente o vídeo. As fotos continuam disponíveis como capa.",
          )}
        </p>
      )}
    </section>
  );
}
