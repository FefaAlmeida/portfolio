"use client";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Eye,
  FolderOpen,
  ImagePlus,
  LogOut,
  Pencil,
  Plus,
  Redo2,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { projectCover } from "@/lib/project-media";
import ConfirmDialog from "./confirm-dialog";
import { draftFingerprint } from "./draft-state";
import TextEditor from "./editor";
import ExperienceFields from "./experience-fields";
import LocalizationSettings from "./localization-settings";
import DraftPreview from "./preview";
import ProjectDates, { withProjectPeriod } from "./project-dates";
import ProjectEditor, { validateProjectForm } from "./project-editor";
import { projectPayload } from "./project-profiles";
import SortableList from "./sortable-list";
import TranslationReview from "./translation-review";
import useDraftHistory from "./use-draft-history";

const sections = {
  projetos: "Projetos e trabalhos",
  experiencias: "Extracurriculares",
  premios: "Prêmios",
};
const itemLabels = {
  projetos: { singular: "projeto", createPrefix: "Novo" },
  experiencias: { singular: "experiência", createPrefix: "Nova" },
  premios: { singular: "prêmio", createPrefix: "Novo" },
};
const sectionIcons = {
  projetos: FolderOpen,
  experiencias: BriefcaseBusiness,
  premios: Award,
};
const sectionDescriptions = {
  projetos: "Os projetos, as ideias e as soluções que contam sua história.",
  experiencias: "As experiências que fazem parte da sua trajetória.",
  premios: "Reconhecimentos e conquistas que merecem estar em destaque.",
};
const doc = () => ({ type: "doc", content: [{ type: "paragraph" }] });
function blank(kind) {
  if (kind === "projetos")
    return {
      titulo: "",
      subtitulo: "",
      descricao: doc(),
      midias: [],
      capaId: null,
      tagDireita: "EM DESENVOLVIMENTO",
      tecnologias: [],
      problema: doc(),
      solucao: doc(),
      linkGithub: "",
      linkDeploy: "",
      detalhes: {
        fim: "present",
        periodo: "Presente",
        tipo: "",
        modeloNegocio: doc(),
        diferencial: doc(),
        cicloAprendizado: "",
        perfis: [{ categoria: "usuario", nome: "", funcionalidades: [] }],
        aplicacoes: [],
      },
    };
  if (kind === "experiencias")
    return {
      titulo: "",
      imagemId: null,
      categoria: "",
      periodo: "",
      papel: "",
      descricao: doc(),
    };
  return {
    titulo: "",
    categoria: "",
    ano: new Date().getFullYear(),
    instituicao: "",
    descricao: doc(),
    credencialId: null,
    credencialUrl: "",
  };
}
function normalize(value) {
  if (Array.isArray(value))
    return value
      .map((item) => (typeof item === "string" ? item.trim() : normalize(item)))
      .filter((item) => item !== "");
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  return value;
}
async function request(path, { method = "GET", body, csrf, signal } = {}) {
  const headers = {};
  if (csrf) headers["x-csrf-token"] = csrf;
  if (body && !(body instanceof FormData))
    headers["content-type"] = "application/json";
  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal,
  });
  const result = await response
    .json()
    .catch(() => ({ error: "Não foi possível concluir a operação." }));
  if (!response.ok)
    throw Object.assign(new Error(result.error || "A operação falhou."), {
      status: response.status,
    });
  return result;
}
export default function AdminPanel({ publicUrl = "/" }) {
  const {
    ui,
    locale: interfaceLocale,
    setLocale: setInterfaceLocale,
  } = useI18n();
  const [session, setSession] = useState(null),
    [kind, setKind] = useState("projetos");
  const itemLabel = itemLabels[kind];
  const createLabel = `${ui(itemLabel.createPrefix)} ${ui(itemLabel.singular)}`;
  const [items, setItems] = useState([]),
    [selected, setSelected] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [contentLocale, setContentLocale] = useState("pt-BR");
  const [imageColors, setImageColors] = useState({});
  const [projectStep, setProjectStep] = useState(0);
  const {
    draft,
    setDraft,
    changeDraft,
    acceptSaved,
    undo,
    redo,
    undoCount,
    redoCount,
    breakGroup,
  } = useDraftHistory({
    context: kind === "projetos" && !selected?.id ? projectStep : null,
    onRestore: (step) => {
      if (kind === "projetos" && !selected?.id && step !== null)
        setProjectStep(step);
    },
  });
  const [baseline, setBaseline] = useState(null),
    [previewOpen, setPreviewOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const filterDialog = useRef(null);
  const deleteReturnFocus = useRef(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const discardReturnFocus = useRef(null);
  const discardResolver = useRef(null);
  const createButton = useRef(null);
  const [pendingFilter, setPendingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const dirty =
    draft !== null && draftFingerprint(projectPayload(draft)) !== baseline;
  useEffect(() => {
    const controller = new AbortController();
    request("/auth/session", { signal: controller.signal })
      .then(setSession)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!session?.authenticated) return;
    const controller = new AbortController();
    setLoading(true);
    request(`/admin/${kind}`, { signal: controller.signal })
      .then(setItems)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [kind, session?.authenticated]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function run(action) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      return await action();
    } catch (e) {
      setError(e.message);
      if (e.status === 401 || e.status === 403) {
        const fresh = await request("/auth/session").catch(() => null);
        if (fresh) setSession(fresh);
      }
    } finally {
      setBusy(false);
    }
  }
  const mutation = (path, method, body) =>
    request(path, { method, body, csrf: session?.csrf });
  const refresh = async () => setItems(await request(`/admin/${kind}`));
  function leave() {
    if (!dirty) return Promise.resolve(true);
    discardReturnFocus.current = document.activeElement;
    setDiscardOpen(true);
    return new Promise((resolve) => {
      discardResolver.current = resolve;
    });
  }
  function resolveDiscard(confirmed) {
    setDiscardOpen(false);
    discardResolver.current?.(confirmed);
    discardResolver.current = null;
  }
  async function backToList() {
    if (!(await leave())) return;
    setSelected(null);
    setDraft(null);
    setBaseline(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function edit(row) {
    if (!(await leave())) return;
    if (row?.draft?.imagemId && row.imagemBg)
      setImageColors((colors) => ({
        ...colors,
        [row.draft.imagemId]: row.imagemBg,
      }));
    setSelected(row || { id: null });
    const initial = {
      ...structuredClone(
        (contentLocale === "pt-BR"
          ? row?.draft
          : row?.draftByLocale?.[contentLocale]) || blank(kind),
      ),
      visibilidade: row?.visibilidade || "privado",
    };
    if (
      kind === "projetos" &&
      initial.tagDireita === "EM DESENVOLVIMENTO" &&
      !initial.detalhes?.fim
    ) {
      const details = initial.detalhes || {};
      initial.detalhes = withProjectPeriod({ ...details, fim: "present" });
      if (!details.inicio && details.periodo) {
        initial.detalhes.periodo = details.periodo;
      }
    }
    setProjectStep(0);
    setDraft(initial);
    setBaseline(draftFingerprint(projectPayload(initial)));
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function update(key, value, group = null) {
    changeDraft((old) => {
      const next = { ...old, [key]: value };
      if (key === "tagDireita") {
        const fim = old.detalhes?.fim;
        if (value === "FINALIZADO" && (!fim || fim === "present")) {
          next.detalhes = withProjectPeriod({ ...old.detalhes, fim: "" });
        } else if (value === "EM DESENVOLVIMENTO" && !fim) {
          next.detalhes = withProjectPeriod({
            ...old.detalhes,
            fim: "present",
          });
        }
      }
      return next;
    }, group);
  }
  function detail(key, value, group = null) {
    update("detalhes", { ...draft.detalhes, [key]: value }, group);
  }
  function field(
    key,
    label,
    {
      textarea = false,
      type = "text",
      required = false,
      maxLength = 500,
      details = false,
    } = {},
  ) {
    const value = details ? draft.detalhes[key] : draft[key];
    const props = {
      id: key,
      value: value ?? "",
      required,
      maxLength,
      onChange: (e) =>
        (details ? detail : update)(
          key,
          type === "number"
            ? e.target.value === ""
              ? ""
              : Number(e.target.value)
            : e.target.value,
          type === "text" || type === "url" ? key : null,
        ),
    };
    return (
      <label className="admin-field" key={key} htmlFor={key}>
        <span>
          {ui(label)}
          {required && <span aria-hidden="true"> *</span>}
        </span>
        {textarea ? (
          <textarea {...props} rows={3} />
        ) : (
          <input
            {...props}
            type={type}
            pattern={type === "url" ? "https?://.*" : undefined}
            {...(type === "number" ? { min: 1900, max: 2200 } : {})}
          />
        )}
      </label>
    );
  }
  function rich(key, label, details = false) {
    return (
      <div className="admin-field" key={key}>
        <span>{ui(label)}</span>
        <TextEditor
          disabled={busy}
          pendingIds={(selected?.pendingUnits || [])
            .filter((unit) =>
              unit.startsWith(`${details ? "detalhes." : ""}${key}.content.@`),
            )
            .map((unit) => unit.split("@").at(-1))}
          value={details ? draft.detalhes[key] : draft[key]}
          label={ui(label)}
          onChange={(value, typing) =>
            (details ? detail : update)(key, value, typing ? key : null)
          }
        />
      </div>
    );
  }
  async function save() {
    const { visibilidade, ...payload } = normalize(projectPayload(draft));
    const row = selected.id
      ? await mutation(`/admin/${kind}/${selected.id}`, "PUT", {
          draft: payload,
          locale: contentLocale,
          visibilidade,
          revision: selected.revision,
        })
      : await mutation(`/admin/${kind}`, "POST", {
          ...payload,
          visibilidade,
          locale: contentLocale,
          sourceLocale: contentLocale,
        });
    const saved = {
      ...structuredClone(row.draftByLocale?.[contentLocale] || row.draft),
      visibilidade: row.visibilidade,
      ...(draft._inactiveProfiles
        ? { _inactiveProfiles: draft._inactiveProfiles }
        : {}),
    };
    setSelected(row);
    if (row.review) setReviewOpen(true);
    acceptSaved(saved);
    setBaseline(draftFingerprint(projectPayload(saved)));
    await refresh();
    setNotice(
      ui(
        row.pendingUnits?.length
          ? "Rascunho salvo. A publicação anterior continua visível até a revisão."
          : "Item salvo.",
      ),
    );
  }
  function switchContentLocale(nextLocale) {
    if (nextLocale === contentLocale || dirty || busy) return;
    const next = selected?.id
      ? selected.draftByLocale?.[nextLocale]
      : blank(kind);
    setContentLocale(nextLocale);
    const normalized = {
      ...structuredClone(next || blank(kind)),
      visibilidade: selected?.visibilidade || draft?.visibilidade || "privado",
    };
    setDraft(normalized);
    setBaseline(draftFingerprint(projectPayload(normalized)));
  }
  async function upload(file, key) {
    if (!file) return;
    await run(async () => {
      if (file.size > 10 * 1024 * 1024)
        throw new Error(ui("O arquivo deve ter no máximo 10 MB."));
      const form = new FormData();
      form.append("file", file);
      const result = await mutation("/admin/uploads", "POST", form);
      if (result.imagemBg)
        setImageColors((colors) => ({
          ...colors,
          [result.id]: result.imagemBg,
        }));
      if (
        ["imagemId", "imagemSecundariaId"].includes(key) &&
        !result.mime.startsWith("image/")
      )
        throw new Error(ui("A capa deve ser uma imagem."));
      if (key === "credencialId")
        changeDraft((old) => ({
          ...old,
          credencialId: result.id,
          credencialUrl: "",
        }));
      else update(key, result.id);
      setNotice(ui("Arquivo enviado. Salve o item para vinculá-lo."));
    });
  }
  function fileField(key, label) {
    return (
      <div className="admin-field admin-upload">
        <label htmlFor={key}>{ui(label)}</label>
        <small>
          {["imagemId", "imagemSecundariaId"].includes(key)
            ? "JPEG, PNG ou WebP"
            : "JPEG, PNG, WebP ou PDF"}{" "}
          {ui("· até 10 MB")}
        </small>
        <div className="upload-control">
          <ImagePlus aria-hidden="true" />
          <input
            id={key}
            type="file"
            accept={
              ["imagemId", "imagemSecundariaId"].includes(key)
                ? "image/jpeg,image/png,image/webp"
                : "image/jpeg,image/png,image/webp,application/pdf"
            }
            onChange={(e) => {
              upload(e.target.files?.[0], key);
              e.target.value = "";
            }}
          />
        </div>
        {draft[key] && (
          <div className="file-preview">
            {["imagemId", "imagemSecundariaId"].includes(key) ? (
              // biome-ignore lint/performance/noImgElement: private previews require the session cookie on the original media request.
              <img
                src={`/api/media/${draft[key]}`}
                alt={ui("Capa selecionada")}
              />
            ) : (
              <a
                href={`/api/media/${draft[key]}`}
                target="_blank"
                rel="noreferrer"
              >
                {ui("Ver arquivo enviado ↗")}
              </a>
            )}
            <button type="button" onClick={() => update(key, null)}>
              {ui("Remover arquivo")}
            </button>
          </div>
        )}
      </div>
    );
  }
  async function reorder(next) {
    const previous = items;
    setItems(next);
    try {
      await mutation(`/admin/${kind}/order`, "PUT", {
        ids: next.map((item) => item.id),
      });
      return true;
    } catch (e) {
      setItems((current) => (current === next ? previous : current));
      setError(e.message);
      return false;
    }
  }
  function deleteItem(row) {
    deleteReturnFocus.current = document.activeElement;
    setPendingDelete({
      row,
      title: row.draft.titulo,
    });
  }
  function confirmDelete() {
    const { row } = pendingDelete;
    setPendingDelete(null);
    run(async () => {
      await mutation(`/admin/${kind}/${row.id}`, "DELETE", {
        revision: row.revision,
      });
      await refresh();
      setNotice(ui("Item excluído."));
      requestAnimationFrame(() => createButton.current?.focus());
    });
  }
  const messages = (
    <div className="admin-messages" aria-live="polite">
      {error && (
        <p role="alert" className="admin-error">
          {ui(error)}
        </p>
      )}
      {notice && <output className="admin-notice">{notice}</output>}
    </div>
  );
  const languagePicker = (
    <label className="admin-field">
      {ui("Idioma da interface")}
      <select
        value={interfaceLocale}
        onChange={(event) => setInterfaceLocale(event.target.value)}
      >
        <option value="pt-BR">Português</option>
        <option value="en-US">English</option>
      </select>
    </label>
  );
  if (!session)
    return (
      <main className="admin-login">
        {languagePicker}
        <h1>{ui("Administração")}</h1>
        {error ? (
          <>
            {messages}
            <button type="button" onClick={() => window.location.reload()}>
              {ui("Tentar novamente")}
            </button>
          </>
        ) : (
          <p>{ui("Carregando…")}</p>
        )}
      </main>
    );
  if (!session.authenticated)
    return (
      <main className="admin-login">
        <h1>{ui("Bem-vinda de volta")}</h1>
        <p>{ui("Entre para cuidar do seu portfólio.")}</p>
        {messages}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await mutation("/auth/login", "POST", {
                email,
                password,
              });
              setSession(result);
              setPassword("");
            });
          }}
        >
          <fieldset disabled={busy}>
            <label className="admin-field">
              {ui("E-mail")}
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="admin-field">
              {ui("Senha")}
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="primary" type="submit">
              {busy ? ui("Entrando…") : ui("Entrar")}
            </button>
          </fieldset>
        </form>
      </main>
    );
  const filteredItems = items.filter(
    (row) => statusFilter === "all" || row.visibilidade === statusFilter,
  );
  const visibleItems = filteredItems.filter((row) =>
    row.draft.titulo
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const publishedCount = items.filter(
    (row) => row.visibilidade === "publico",
  ).length;
  return (
    <>
      <TranslationReview
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        row={selected}
        kind={kind}
        mutation={mutation}
        onUpdate={async (row) => {
          setSelected(row);
          if (!row.review) setNotice(ui("Item salvo."));
          const next = {
            ...structuredClone(row.draftByLocale?.[contentLocale] || row.draft),
            visibilidade: row.visibilidade,
            ...(draft._inactiveProfiles
              ? { _inactiveProfiles: draft._inactiveProfiles }
              : {}),
          };
          acceptSaved(next);
          setBaseline(draftFingerprint(projectPayload(next)));
          await refresh();
        }}
      />
      <ConfirmDialog
        open={discardOpen}
        title={ui("Descartar as alterações?")}
        description={ui(
          "Você tem alterações não salvas. Se sair agora, elas serão perdidas.",
        )}
        cancelLabel={ui("Cancelar")}
        confirmLabel={ui("Confirmar")}
        onCancel={() => resolveDiscard(false)}
        onConfirm={() => resolveDiscard(true)}
        returnFocus={discardReturnFocus}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        destructive
        title={ui("Excluir este item?")}
        description={
          <>
            {ui("Você está prestes a excluir")}{" "}
            <strong>“{pendingDelete?.title}”</strong>
            {ui(
              ". Esta ação é definitiva e não pode ser desfeita pelo painel.",
            )}
          </>
        }
        cancelLabel={ui("Cancelar")}
        confirmLabel={ui("Excluir")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        returnFocus={deleteReturnFocus}
      />
      <div
        className="admin-workspace"
        onBlurCapture={breakGroup}
        onKeyDownCapture={(event) => {
          if (
            !draft ||
            previewOpen ||
            discardOpen ||
            pendingDelete ||
            event.nativeEvent.isComposing ||
            event.altKey ||
            !(event.ctrlKey || event.metaKey)
          )
            return;
          const key = event.key.toLowerCase();
          if (key !== "z" && key !== "y") return;
          event.preventDefault();
          event.stopPropagation();
          if (busy) return;
          if (key === "y" || event.shiftKey) redo();
          else undo();
        }}
      >
        <aside className="admin-sidebar" aria-label={ui("Painel de Fernanda")}>
          <div className="admin-sidebar-brand">
            <span className="admin-brand-logo">
              Fernanda<span className="site-logo-accent">.</span>
            </span>
          </div>
          <nav className="admin-tabs" aria-label={ui("Seções do portfólio")}>
            {Object.entries(sections).map(([key, label]) => {
              const Icon = sectionIcons[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={kind === key ? "page" : undefined}
                  disabled={busy}
                  onClick={async () => {
                    if (key === kind) {
                      if (draft) await backToList();
                      return;
                    }
                    if (await leave()) {
                      setKind(key);
                      setSelected(null);
                      setDraft(null);
                      setBaseline(null);
                      setItems([]);
                      setSearch("");
                      setStatusFilter("all");
                      setError("");
                      setNotice("");
                    }
                  }}
                >
                  <span className="nav-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  {ui(label)}
                </button>
              );
            })}
          </nav>
          <div className="admin-sidebar-bottom">
            <LocalizationSettings request={request} mutation={mutation} />
            <label className="admin-field">
              {ui("Idioma da interface")}
              <select
                value={interfaceLocale}
                onChange={(event) => setInterfaceLocale(event.target.value)}
              >
                <option value="pt-BR">Português</option>
                <option value="en-US">English</option>
              </select>
            </label>
            <div className="admin-actions">
              <Link href={publicUrl} target="_blank">
                {ui("Ver site")}
                <ArrowUpRight aria-hidden="true" />
              </Link>
              <button
                className="logout-button"
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (await leave())
                    run(async () => {
                      await mutation("/auth/logout", "POST", {});
                      setSelected(null);
                      setDraft(null);
                      setBaseline(null);
                      setSession(await request("/auth/session"));
                    });
                }}
              >
                <LogOut aria-hidden="true" />
                {ui("Sair")}
              </button>
            </div>
          </div>
        </aside>
        <main className="admin-main">
          <header
            className={`admin-header ${draft ? "admin-editor-header" : ""}`}
          >
            {draft ? (
              <button type="button" disabled={busy} onClick={backToList}>
                <ArrowLeft aria-hidden="true" />
                {ui("Voltar")}
              </button>
            ) : (
              <div>
                <h1>{ui(sections[kind])}</h1>
                <p className="page-description">
                  {ui(sectionDescriptions[kind])}
                </p>
              </div>
            )}
            {draft && (
              <div className="admin-savebar">
                <fieldset
                  className="admin-history"
                  aria-label={ui("Histórico do item")}
                >
                  <button
                    type="button"
                    disabled={busy || !undoCount}
                    aria-label={ui("Desfazer ({0})", { 0: undoCount })}
                    title={ui("Desfazer (Ctrl+Z / ⌘Z)")}
                    onClick={undo}
                  >
                    <Undo2 aria-hidden="true" />
                    <span className="history-count" aria-hidden="true">
                      {undoCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy || !redoCount}
                    aria-label={ui("Refazer ({0})", { 0: redoCount })}
                    title={ui("Refazer (Ctrl+Y / ⌘⇧Z)")}
                    onClick={redo}
                  >
                    <Redo2 aria-hidden="true" />
                    <span className="history-count" aria-hidden="true">
                      {redoCount}
                    </span>
                  </button>
                </fieldset>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPreviewOpen(true)}
                  aria-label={ui("Preview")}
                  title={ui("Preview")}
                >
                  <Eye aria-hidden="true" />
                </button>
                {(kind !== "projetos" || selected.id || projectStep === 2) && (
                  <button
                    className="primary"
                    type="submit"
                    form="admin-item-form"
                    disabled={busy || !dirty}
                    aria-label={ui("Salvar")}
                    title={ui("Salvar")}
                  >
                    <Save aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
            {!draft && (
              <button
                ref={createButton}
                className="primary"
                type="button"
                disabled={busy || loading}
                onClick={() => edit(null)}
              >
                <Plus aria-hidden="true" /> {createLabel}
              </button>
            )}
          </header>
          {draft && (
            <section
              className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-[#a38f7e]/25"
              aria-label={ui("Idioma do conteúdo")}
            >
              {[
                ["pt-BR", "Português"],
                ["en-US", "English"],
              ].map(([locale, label]) => (
                <button
                  key={locale}
                  type="button"
                  disabled={busy || (dirty && locale !== contentLocale)}
                  aria-pressed={contentLocale === locale}
                  className={`px-3 py-2 rounded border ${contentLocale === locale ? "border-[#c85266] text-[#c85266]" : "border-[#a38f7e]/40"}`}
                  onClick={() => switchContentLocale(locale)}
                >
                  {ui(label)}
                </button>
              ))}
              {dirty && (
                <span className="text-sm">
                  {ui("Salve antes de mudar o idioma.")}
                </span>
              )}
              <span>
                {ui("Idioma de origem: {0}", {
                  0: selected?.sourceLocale || contentLocale,
                })}
              </span>
              {selected?.review && (
                <div aria-live="polite" className="text-sm text-[#a94158]">
                  <p>
                    {ui("{0} trecho(s) exigem revisão antes de publicar.", {
                      0: selected.review.units.length,
                    })}
                  </p>
                  <button
                    type="button"
                    className="mt-2 underline"
                    disabled={busy || dirty}
                    onClick={() => setReviewOpen(true)}
                  >
                    {ui("Revisar traduções")}
                  </button>
                </div>
              )}
            </section>
          )}
          {messages}
          {!draft ? (
            <>
              <section
                className="admin-overview"
                aria-label={ui("Resumo da seção")}
              >
                <div>
                  <span>{ui("Total de itens")}</span>
                  <strong>
                    {loading ? "—" : items.length.toString().padStart(2, "0")}
                  </strong>
                </div>
                <div>
                  <span>
                    <i className="status-dot published" />
                    {ui("Públicos")}
                  </span>
                  <strong>
                    {loading ? "—" : publishedCount.toString().padStart(2, "0")}
                  </strong>
                </div>
                <div>
                  <span>
                    <i className="status-dot" />
                    {ui("Privados")}
                  </span>
                  <strong>
                    {loading
                      ? "—"
                      : (items.length - publishedCount)
                          .toString()
                          .padStart(2, "0")}
                  </strong>
                </div>
              </section>
              <section className="admin-list" aria-label={ui("Itens")}>
                <div className="list-heading">
                  <label className="admin-search">
                    <Search aria-hidden="true" />
                    <input
                      type="search"
                      aria-label={ui("Buscar itens")}
                      placeholder={ui("Buscar por título…")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <div className="list-tools">
                    <button
                      type="button"
                      aria-label={
                        statusFilter === "all"
                          ? ui("Filtrar itens")
                          : ui("Filtrar itens (filtro ativo)")
                      }
                      title={ui("Filtrar itens")}
                      aria-haspopup="dialog"
                      aria-controls="content-filter"
                      onClick={() => {
                        setPendingFilter(statusFilter);
                        filterDialog.current.showModal();
                      }}
                      className={
                        statusFilter !== "all" ? "filter-active" : undefined
                      }
                    >
                      <SlidersHorizontal aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <dialog
                  ref={filterDialog}
                  className="filter-dialog"
                  id="content-filter"
                  aria-labelledby="filter-title"
                >
                  <form
                    method="dialog"
                    onSubmit={() => setStatusFilter(pendingFilter)}
                  >
                    <div className="filter-dialog-heading">
                      <h2 id="filter-title">{ui("Filtrar itens")}</h2>
                      <button
                        type="button"
                        aria-label={ui("Fechar filtros")}
                        onClick={() => filterDialog.current.close()}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                    <fieldset className="filter-options">
                      <legend>{ui("Visibilidade")}</legend>
                      {[
                        ["all", ui("Todos")],
                        ["publico", ui("Públicos")],
                        ["privado", ui("Privados")],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="status"
                            value={value}
                            checked={pendingFilter === value}
                            onChange={() => setPendingFilter(value)}
                          />
                          {ui(label)}
                        </label>
                      ))}
                    </fieldset>
                    <div className="filter-dialog-actions">
                      <button
                        type="button"
                        onClick={() => setPendingFilter("all")}
                      >
                        {ui("Limpar")}
                      </button>
                      <button className="primary" type="submit">
                        {ui("Aplicar filtros")}
                      </button>
                    </div>
                  </form>
                </dialog>
                {loading ? (
                  <output
                    className="admin-loading"
                    aria-label={ui("Carregando itens")}
                  >
                    <div />
                    <div />
                    <div />
                  </output>
                ) : !visibleItems.length ? (
                  <div className="admin-empty">
                    <FolderOpen aria-hidden="true" />
                    <h2>
                      {search || statusFilter !== "all"
                        ? ui("Nenhum resultado")
                        : ui("Sua próxima história começa aqui")}
                    </h2>
                    <p>
                      {search || statusFilter !== "all"
                        ? ui("Tente outro título ou ajuste o filtro.")
                        : ui("Crie seu primeiro item e mostre o que você faz.")}
                    </p>
                    {(search || statusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                        }}
                      >
                        {statusFilter === "all"
                          ? ui("Limpar busca")
                          : ui("Limpar filtros")}
                      </button>
                    )}
                  </div>
                ) : (
                  <SortableList
                    key={`${kind}-${search}-${statusFilter}`}
                    items={items}
                    getLabel={(row) => row.draft.titulo}
                    visibleIds={filteredItems.map((row) => row.id)}
                    search={search}
                    disabled={busy || loading}
                    onReorder={reorder}
                  >
                    {(row) => {
                      const Icon = sectionIcons[kind];
                      return (
                        <>
                          <button
                            className="item-title"
                            type="button"
                            disabled={busy}
                            onClick={() => edit(row)}
                          >
                            <span className="item-cover" aria-hidden="true">
                              {projectCover(row.draft).url ? (
                                // biome-ignore lint/performance/noImgElement: authenticated media preview.
                                <img
                                  src={projectCover(row.draft).url}
                                  alt=""
                                  draggable={false}
                                />
                              ) : (
                                <Icon />
                              )}
                            </span>
                            <span className="item-copy">
                              <strong>{row.draft.titulo}</strong>
                              <span
                                className={`item-status ${row.visibilidade === "publico" ? "published" : ""}`}
                              >
                                <i className="status-dot" />
                                {row.visibilidade === "publico"
                                  ? ui("Público")
                                  : ui("Privado")}
                              </span>
                            </span>
                          </button>
                          <div className="item-actions">
                            <button
                              className="edit-item"
                              type="button"
                              aria-label={ui("Editar {0}", {
                                0: row.draft.titulo,
                              })}
                              title={ui("Editar")}
                              disabled={busy}
                              onClick={() => edit(row)}
                            >
                              <Pencil aria-hidden="true" />
                            </button>
                            <button
                              className="delete-item"
                              type="button"
                              aria-label={ui("Deletar {0}", {
                                0: row.draft.titulo,
                              })}
                              title={ui("Deletar")}
                              disabled={busy}
                              onClick={() => deleteItem(row)}
                            >
                              <Trash2 aria-hidden="true" />
                            </button>
                          </div>
                        </>
                      );
                    }}
                  </SortableList>
                )}
                <div className="list-footer">
                  {ui("{0} de {1} itens", {
                    0: visibleItems.length,
                    1: items.length,
                  })}
                </div>
              </section>
            </>
          ) : (
            <section className="admin-edit" aria-label={ui("Editor")}>
              <form
                id="admin-item-form"
                key={`${kind}-${selected?.id || "new"}`}
                noValidate={kind === "projetos"}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (busy) return;
                  if (kind === "projetos") {
                    const advancing = !selected.id && projectStep < 2;
                    if (
                      !validateProjectForm(
                        e.currentTarget,
                        draft,
                        setProjectStep,
                        (text) => setError(ui(text)),
                        advancing ? projectStep : undefined,
                        ui,
                      )
                    )
                      return;
                    if (advancing) {
                      breakGroup();
                      setProjectStep(projectStep + 1);
                      return;
                    }
                  }
                  if (dirty) run(save);
                }}
              >
                <fieldset disabled={busy}>
                  <div className="form-section">
                    {kind !== "projetos" &&
                      field("titulo", ui("Título"), {
                        required: true,
                        maxLength: 160,
                      })}
                    {kind !== "projetos" && (
                      <label className="admin-field" htmlFor="visibilidade">
                        <span>{ui("Visibilidade")}</span>
                        <select
                          id="visibilidade"
                          value={draft.visibilidade}
                          onChange={(e) =>
                            update("visibilidade", e.target.value)
                          }
                        >
                          <option value="publico">{ui("Público")}</option>
                          <option value="privado">{ui("Privado")}</option>
                        </select>
                      </label>
                    )}
                    {kind === "projetos" && (
                      <ProjectEditor
                        draft={draft}
                        step={projectStep}
                        setStep={setProjectStep}
                        selected={selected}
                        busy={busy}
                        dirty={dirty}
                        field={field}
                        rich={rich}
                        update={update}
                        changeDraft={changeDraft}
                        run={run}
                        mutation={mutation}
                        setNotice={setNotice}
                        setError={setError}
                        breakGroup={breakGroup}
                      />
                    )}
                    {kind === "experiencias" && (
                      <>
                        {field("categoria", ui("Categoria"))}
                        <ProjectDates
                          startLabel={ui("Início da experiência")}
                          endLabel={ui("Fim da experiência")}
                          allowPresent
                          value={draft}
                          disabled={busy}
                          onChange={(value) => changeDraft(() => value)}
                        />
                        {field("papel", ui("Meu papel"))}
                        {!draft.inicio &&
                          !draft.fim &&
                          field("periodo", ui("Período descritivo"))}
                        {fileField("imagemId", ui("Imagem da experiência"))}
                        {field("imagemAlt", ui("Texto alternativo"))}
                        {rich("descricao", ui("Descrição"))}
                        <ExperienceFields
                          draft={draft}
                          changeDraft={changeDraft}
                          disabled={busy}
                        />
                        {draft.imagemDupla && (
                          <>
                            {fileField(
                              "imagemSecundariaId",
                              ui("Segunda imagem"),
                            )}
                            {field(
                              "imagemSecundariaAlt",
                              ui("Texto alternativo da segunda imagem"),
                            )}
                          </>
                        )}
                      </>
                    )}
                    {kind === "premios" && (
                      <>
                        <div className="field-grid">
                          {field("ano", ui("Ano"), {
                            type: "number",
                            required: true,
                          })}
                          {field("categoria", ui("Categoria"))}
                        </div>
                        {field("instituicao", ui("Instituição"))}
                        {rich("descricao", ui("Descrição"))}
                        {fileField("credencialId", ui("Arquivo da credencial"))}
                        {!draft.credencialId &&
                          field(
                            "credencialUrl",
                            ui("Ou link externo da credencial"),
                            {
                              type: "url",
                              maxLength: 2048,
                            },
                          )}
                      </>
                    )}
                  </div>
                </fieldset>
                {busy && <output>{ui("Processando…")}</output>}
              </form>
            </section>
          )}
        </main>
      </div>
      {draft && (
        <DraftPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          kind={kind}
          locale={contentLocale}
          draft={{
            ...normalize(projectPayload(draft)),
            imagemBg: imageColors[draft.imagemId],
          }}
        />
      )}
    </>
  );
}
