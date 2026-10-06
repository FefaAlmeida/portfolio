"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import RichText from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/provider";

function FormattedText({ value, fallback }) {
  if (!value) return <p>{fallback}</p>;
  if (typeof value === "object" && !Array.isArray(value))
    return <RichText value={value} className="break-words" links={false} />;
  return (
    <p className="whitespace-pre-wrap break-words">{texts(value).join("\n")}</p>
  );
}

function boldPhrases(value) {
  const phrases = [];
  let current = "";
  const flush = () => {
    if (current) phrases.push(current);
    current = "";
  };
  function walk(node) {
    if (node?.type === "text") {
      if (node.marks?.some((mark) => mark.type === "bold"))
        current += node.text;
      else flush();
    } else {
      for (const child of node?.content || []) walk(child);
      flush();
    }
  }
  walk(value);
  flush();
  return phrases;
}

function texts(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value))
    value.forEach((item) => {
      texts(item, result);
    });
  else if (value?.type === "text") result.push(value.text);
  else if (value?.content) texts(value.content, result);
  return result;
}
function ChangedText({ before, after }) {
  const left = texts(before).join("\n");
  const right = texts(after).join("\n");
  if (left === right) return <p className="whitespace-pre-wrap">{right}</p>;
  let start = 0,
    end = 0;
  while (
    start < Math.min(left.length, right.length) &&
    left[start] === right[start]
  )
    start++;
  while (
    end < Math.min(left.length, right.length) - start &&
    left[left.length - end - 1] === right[right.length - end - 1]
  )
    end++;
  return (
    <p className="whitespace-pre-wrap break-words">
      {right.slice(0, start)}
      <del className="bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200">
        {left.slice(start, left.length - end)}
      </del>{" "}
      <ins className="bg-emerald-100 text-emerald-900 no-underline dark:bg-emerald-950 dark:text-emerald-200">
        {right.slice(start, right.length - end)}
      </ins>
      {end ? right.slice(-end) : ""}
    </p>
  );
}
const labels = {
  titulo: "Título",
  subtitulo: "Subtítulo",
  descricao: "Descrição",
  problema: "O problema",
  solucao: "A solução",
  heroTitle: "Título de abertura",
  aboutTitle: "Título sobre mim",
  aboutParagraphs: "Texto sobre mim",
  categoria: "Categoria",
  instituicao: "Instituição",
  papel: "Papel",
  periodo: "Período",
  resultados: "Resultados",
  imagemAlt: "Texto alternativo",
  imagemLegenda: "Legenda",
  imagemSecundariaAlt: "Texto alternativo",
  midias: "Mídias",
  detalhes: "Detalhes",
};
function Proposal({ unit, index, busy, decide, generate }) {
  const { ui } = useI18n();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() =>
    unit.mode === "bold"
      ? [boldPhrases(unit.proposal).join("\n")]
      : texts(unit.proposal ?? unit.source),
  );
  const [instruction, setInstruction] = useState("");
  return (
    <section className="rounded-2xl border border-[#a38f7e]/30 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">
          {ui(labels[unit.key.split(".")[0]] || "Texto")} ·{" "}
          {ui("Trecho {0}", { 0: index + 1 })}
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs ${unit.status === "approved" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "bg-[#c85266]/10"}`}
        >
          {ui(
            unit.status === "approved"
              ? "Aprovado"
              : unit.status === "rejected"
                ? "Rejeitado"
                : unit.status === "error"
                  ? "Falha na tradução"
                  : unit.status === "suggested"
                    ? "Proposta pronta"
                    : "Tradução pendente",
          )}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0">
          <h4 className="mb-2 text-xs uppercase tracking-wide opacity-70">
            {ui("Alterações no original")}
          </h4>
          {unit.mode === "bold" ? (
            <FormattedText value={unit.source} />
          ) : (
            <ChangedText before={unit.beforeSource} after={unit.source} />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="mb-2 text-xs uppercase tracking-wide opacity-70">
            {ui("Tradução anterior")}
          </h4>
          <FormattedText
            value={unit.previous}
            fallback={ui("Sem tradução anterior")}
          />
        </div>
        <div className="min-w-0">
          <h4 className="mb-2 text-xs uppercase tracking-wide opacity-70">
            {ui("Proposta de tradução")}
          </h4>
          {editing ? (
            <div className="grid gap-2">
              {unit.mode === "bold" && (
                <p className="text-sm">
                  {ui(
                    "Cole os trechos exatos da tradução que devem ficar em negrito, um por linha. Deixe vazio para remover os destaques.",
                  )}
                </p>
              )}
              {values.map((value, i) => (
                <textarea
                  key={`${unit.key}-${i}`}
                  aria-label={ui("Tradução do trecho {0}, parte {1}", {
                    0: index + 1,
                    1: i + 1,
                  })}
                  className="min-h-24 w-full rounded-lg border border-[#a38f7e]/40 bg-transparent p-3"
                  value={value}
                  disabled={busy}
                  onChange={(event) =>
                    setValues((current) =>
                      current.map((text, j) =>
                        j === i ? event.target.value : text,
                      ),
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <FormattedText
              value={unit.proposal}
              fallback={
                unit.source === null
                  ? ui("Remover este trecho da tradução")
                  : ui("Aguardando proposta")
              }
            />
          )}
        </div>
      </div>
      {unit.error && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {ui(unit.error)}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || (unit.proposal === null && unit.source !== null)}
          onClick={() => decide("approve", unit.key)}
        >
          {ui("Aprovar")}
        </Button>
        {unit.source !== null && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (editing) {
                decide(
                  "edit",
                  unit.key,
                  unit.mode === "bold"
                    ? values[0].split("\n").filter((value) => value.trim())
                    : values,
                );
                setEditing(false);
              } else setEditing(true);
            }}
          >
            {ui(
              editing
                ? "Salvar edição e aprovar"
                : unit.mode === "bold"
                  ? "Editar destaques"
                  : "Editar tradução",
            )}
          </Button>
        )}
        {editing && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setEditing(false)}
          >
            {ui("Cancelar edição")}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => decide("reject", unit.key)}
        >
          {ui("Rejeitar")}
        </Button>
        {unit.previous !== null && unit.source !== null && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => decide("keep", unit.key)}
          >
            {ui("Manter anterior")}
          </Button>
        )}
      </div>
      {unit.source !== null && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-lg border border-[#a38f7e]/40 bg-transparent px-3 py-2 text-sm"
            maxLength={1000}
            aria-label={ui("Orientação para outra tradução")}
            placeholder={ui(
              "Orientação opcional, como: use um tom mais natural",
            )}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => generate(unit.key, instruction)}
          >
            {ui("Tentar novamente")}
          </Button>
        </div>
      )}
    </section>
  );
}
export default function TranslationReview({
  open,
  onOpenChange,
  row,
  kind,
  mutation,
  onUpdate,
}) {
  const { ui } = useI18n();
  const [data, setData] = useState(row);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(null);
  const state = data?.review;
  const id = kind === "paginas" ? "site" : data?.id;
  useEffect(() => {
    if (open) setData(row);
  }, [open, row]);
  const action = useCallback(
    async (operation, body = {}) => {
      setBusy(true);
      setError("");
      try {
        const next = await mutation(
          `/admin/reviews/${kind}/${id}/${operation}`,
          "POST",
          { version: state.version, ...body },
        );
        setData(next);
        await onUpdate(next);
        if (!next.review) onOpenChange(false);
      } catch (failure) {
        setError(ui(failure.message));
      } finally {
        setBusy(false);
      }
    },
    [mutation, kind, id, state, onUpdate, onOpenChange, ui],
  );
  useEffect(() => {
    if (!open || !state || busy || started.current === state.version) return;
    const keys = state.units
      .filter((unit) => unit.status === "pending")
      .map((unit) => unit.key);
    if (!keys.length) return;
    started.current = state.version;
    void action("generate", { keys });
  }, [open, state, busy, action]);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#fcfaf6] p-5 text-[#302729] sm:max-w-[1180px] sm:p-8 dark:bg-[#231c20] dark:text-[#f5ede6]"
      >
        <DialogTitle className="pr-10 font-serif text-3xl font-normal">
          {ui("Revisar traduções")}
        </DialogTitle>
        <DialogDescription>
          {ui(
            "Seu rascunho está salvo. O site só muda depois da confirmação final.",
          )}
        </DialogDescription>
        {error && (
          <p role="alert" className="text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <output>
            {busy
              ? ui("Processando. Suas decisões serão preservadas.")
              : ui("{0} de {1} trechos aprovados", {
                  0:
                    state?.units.filter((unit) => unit.status === "approved")
                      .length || 0,
                  1: state?.units.length || 0,
                })}
          </output>
          <Button
            variant="outline"
            disabled={
              busy ||
              !state?.units.some(
                (unit) => unit.status === "suggested" && !unit.error,
              )
            }
            onClick={() => action("decide", { action: "approve-all" })}
          >
            {ui("Aprovar todas as propostas")}
          </Button>
        </div>
        <div className="grid gap-5">
          {state?.units.map((unit, index) => (
            <Proposal
              key={`${unit.key}:${JSON.stringify(unit.proposal)}`}
              unit={unit}
              index={index}
              busy={busy}
              decide={(choice, key, values) =>
                action("decide", { action: choice, key, texts: values })
              }
              generate={(key, instruction) =>
                action("generate", { keys: [key], retry: true, instruction })
              }
            />
          ))}
        </div>
        <footer className="sticky -bottom-5 flex flex-wrap justify-end gap-3 border-t border-[#a38f7e]/20 bg-[#fcfaf6] py-4 dark:bg-[#231c20]">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {ui("Revisar depois")}
          </Button>
          <Button
            disabled={
              busy ||
              !state ||
              state.units.some((unit) => unit.status !== "approved")
            }
            onClick={() => action("complete")}
          >
            {ui(
              state?.visibility === "publico"
                ? "Concluir e publicar nos dois idiomas"
                : "Concluir revisão do rascunho",
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
