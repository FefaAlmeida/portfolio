"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";
import TextEditor from "./editor";
import TranslationReview from "./translation-review";

export default function LocalizationSettings({ request, mutation }) {
  const { ui, locale: interfaceLocale } = useI18n();
  const dialog = useRef(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [site, setSite] = useState(null);
  const [locale, setLocale] = useState("pt-BR");
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function run(action) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (error) {
      setError(ui(error.message));
    } finally {
      setBusy(false);
    }
  }
  const currency = (value) =>
    new Intl.NumberFormat(interfaceLocale, {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const update = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  function accept(result) {
    setSite(result);
    setDraft(structuredClone(result.draftByLocale[locale]));
    setDirty(false);
  }
  return (
    <>
      <TranslationReview
        open={reviewOpen}
        onOpenChange={(value) => {
          setReviewOpen(value);
          if (!value) dialog.current.showModal();
        }}
        row={site}
        kind="paginas"
        mutation={mutation}
        onUpdate={async (result) => {
          accept(result);
        }}
      />
      <button
        type="button"
        onClick={() => {
          dialog.current.showModal();
          if (site) return;
          run(async () => {
            const [nextSettings, nextSite] = await Promise.all([
              request("/admin/i18n/settings"),
              request("/admin/i18n/site"),
            ]);
            setSettings(nextSettings);
            accept(nextSite);
          });
        }}
      >
        {ui("Traduções e orçamento")}
      </button>
      <dialog
        ref={dialog}
        className="i18n-settings m-auto max-h-[calc(100dvh-2rem)] w-[min(900px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border bg-background p-6 text-foreground backdrop:bg-black/60"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <header className="flex justify-between gap-4">
          <h2>{ui("Configurações de tradução")}</h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => dialog.current.close()}
          >
            {ui("Fechar")}
          </button>
        </header>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {notice && <output>{notice}</output>}
        {settings && (
          <section className="space-y-4 my-6">
            <p>
              {ui("Uso estimado: {0} de {1}", {
                0: currency(settings.budget.usedBrl),
                1: currency(settings.budget.apiLimitBrl),
              })}
            </p>
            <p>{ui("Reserva para câmbio e taxas: R$ 21.")}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  setSettings(
                    await mutation("/admin/i18n/settings", "PUT", {
                      glossary: settings.glossary,
                    }),
                  );
                  setNotice(ui("Glossário salvo."));
                });
              }}
            >
              <label className="admin-field">
                {ui("Glossário")}
                <textarea
                  rows={4}
                  maxLength={10000}
                  value={settings.glossary}
                  disabled={busy}
                  onChange={(event) =>
                    setSettings({ ...settings, glossary: event.target.value })
                  }
                />
              </label>
              <button type="submit" className="primary" disabled={busy}>
                {ui("Salvar glossário")}
              </button>
            </form>
          </section>
        )}
        {site && draft && (
          <section className="space-y-4 my-6">
            <h3>{ui("Introdução e sobre mim")}</h3>
            <div className="flex gap-3">
              {["pt-BR", "en-US"].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={locale === value}
                  disabled={busy || dirty}
                  onClick={() => {
                    setLocale(value);
                    setDraft(structuredClone(site.draftByLocale[value]));
                  }}
                >
                  {value === "pt-BR" ? "Português" : "English"}
                </button>
              ))}
            </div>
            {dirty && <p>{ui("Salve antes de mudar o idioma.")}</p>}
            {site.review && (
              <button
                type="button"
                disabled={busy || dirty}
                onClick={() => {
                  dialog.current.close();
                  setReviewOpen(true);
                }}
              >
                {ui("Revisar traduções")}
              </button>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  const result = await mutation("/admin/i18n/site", "PUT", {
                    locale,
                    revision: site.revision,
                    draft,
                  });
                  accept(result);
                  if (result.review) {
                    dialog.current.close();
                    setReviewOpen(true);
                  }
                  setSettings(await request("/admin/i18n/settings"));
                  setNotice(
                    ui(
                      result.pendingUnits.length
                        ? "Rascunho salvo. A publicação anterior continua visível até a revisão."
                        : "Textos salvos.",
                    ),
                  );
                });
              }}
            >
              <fieldset disabled={busy} className="space-y-4">
                <label className="admin-field">
                  {ui("Título de abertura")}
                  <input
                    required
                    maxLength={500}
                    value={draft.heroTitle}
                    onChange={(event) =>
                      update("heroTitle", event.target.value)
                    }
                  />
                </label>
                <label className="admin-field">
                  {ui("Título sobre mim")}
                  <input
                    required
                    maxLength={500}
                    value={draft.aboutTitle}
                    onChange={(event) =>
                      update("aboutTitle", event.target.value)
                    }
                  />
                </label>
                <TextEditor
                  label={ui("Texto sobre mim")}
                  disabled={busy}
                  value={draft.aboutParagraphs}
                  onChange={(value) => update("aboutParagraphs", value)}
                  pendingIds={site.pendingUnits
                    .filter((key) =>
                      key.startsWith("aboutParagraphs.content.@"),
                    )
                    .map((key) => key.split("@").at(-1))}
                />
                <button
                  type="submit"
                  className="primary"
                  disabled={busy || !dirty}
                >
                  {ui("Salvar textos")}
                </button>
              </fieldset>
            </form>
          </section>
        )}
      </dialog>
    </>
  );
}
