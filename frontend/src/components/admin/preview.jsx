"use client";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import ArticlePreviewCard from "@/components/card";
import Experiencias from "@/components/experiencia";
import Premios from "@/components/premios";
import { I18nProvider, useI18n } from "@/i18n/provider";

const previewWidths = {
  projetos: "max-w-[480px]",
  experiencias: "max-w-7xl",
  premios: "max-w-4xl",
};

export default function DraftPreview({
  open,
  onOpenChange,
  kind,
  draft,
  locale = "pt-BR",
}) {
  const { ui } = useI18n();
  const item = {
    ...draft,
    id: "preview",
    imagemUrl: draft.imagemId ? `/api/media/${draft.imagemId}` : "",
    credencialUrl: draft.credencialId
      ? `/api/media/${draft.credencialId}`
      : draft.credencialUrl,
  };
  return (
    <I18nProvider locale={locale}>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content
            aria-describedby={undefined}
            className={`fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[#f4eee1] font-[family-name:var(--font-geist-sans)] text-[#221f1e] shadow-xl outline-none dark:bg-[#231c20] dark:text-[#f5ede6] ${previewWidths[kind]}`}
          >
            <Dialog.Title className="sr-only">
              {ui("Preview do item")}
            </Dialog.Title>
            <div className="flex shrink-0 justify-end px-3 pt-3 pb-2">
              <Dialog.Close
                aria-label={ui("Fechar prévia")}
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#a38f7e]/30 transition-colors hover:bg-[#a38f7e]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c85266]"
              >
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
            <div className="project-dialog-scroll min-h-0 overflow-y-auto overscroll-contain [&>section]:border-t-0 [&>section]:pt-2 [&>section]:pb-8">
              {kind === "projetos" && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <ArticlePreviewCard projeto={item} locale={locale} />
                </div>
              )}
              {kind === "experiencias" && (
                <Experiencias experiencias={[item]} />
              )}
              {kind === "premios" && (
                <Premios premiosData={[item]} locale={locale} />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </I18nProvider>
  );
}
