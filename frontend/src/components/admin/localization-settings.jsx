"use client";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

export default function LocalizationSettings({ request, mutation }) {
  const { ui, locale: interfaceLocale } = useI18n();
  const dialog = useRef(null);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialog.current.showModal();
          run(async () => setSettings(await request("/admin/i18n/settings")));
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
      </dialog>
    </>
  );
}
