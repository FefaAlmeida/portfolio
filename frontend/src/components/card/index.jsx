"use client";

import { ArrowUpRight, X } from "lucide-react";
import ProjectMedia from "@/components/project-media";
import RichText, { hasText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { t } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";
import { projectCover } from "@/lib/project-media";
import ProjectFeatures from "./project-features";

function Technologies({ items = [], label, compact = false }) {
  return (
    <ul className="work-technologies flex flex-wrap gap-1" aria-label={label}>
      {items.map((tech) => (
        <li key={tech}>
          <Badge className={compact ? "px-2 py-px text-[9px]" : ""}>
            {tech}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export default function ArticlePreviewCard({ projeto, locale = "pt-BR" }) {
  const { ui } = useI18n();
  if (!projeto) return null;
  const m = t(locale);
  const cover = projectCover(projeto);
  const development = projeto.tagDireita === "EM DESENVOLVIMENTO";
  const details = projeto.detalhes;
  const additional = [
    hasText(projeto.solucao) ? projeto.solucao : details?.modeloNegocio,
    details?.diferencial,
  ].filter(hasText);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="work-card group relative isolate flex w-full min-w-0 cursor-pointer rounded-2xl text-left outline-none transition-transform duration-500 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset motion-reduce:transform-none motion-reduce:transition-none"
          aria-label={ui("Ver detalhes de {0}", { 0: projeto.titulo })}
        >
          <Card className="work-card-content w-full flex-1 gap-0 rounded-2xl border p-0 ring-0">
            <Badge
              variant={development ? "development" : "completed"}
              className="absolute top-4 left-4 z-10 max-w-[calc(100%-2rem)] text-[9px]"
            >
              {ui(development ? "Em desenvolvimento" : "Concluído")}
            </Badge>
            <div
              className="work-cover flex h-52 w-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: cover.color }}
            >
              {/* biome-ignore lint/performance/noImgElement: authenticated draft media uses the original session. */}
              <img
                src={cover.url || "/file.svg"}
                alt={cover.alt || ""}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-[30px] leading-tight font-normal">
                  {projeto.titulo}
                </h3>
                <ArrowUpRight
                  className="size-5 shrink-0 text-primary max-sm:hidden [@media(hover:none)]:hidden"
                  aria-hidden="true"
                />
              </div>
              <RichText
                value={projeto.pitch || projeto.subtitulo || projeto.descricao}
                links={false}
                className="line-clamp-2 min-h-[3.2em] text-[13px] leading-[1.6] text-muted-foreground"
              />
              <Technologies
                items={projeto.tecnologias}
                label={ui("Tecnologias")}
                compact
              />
              <span
                className="work-mobile-action flex items-center justify-end gap-1.5 text-xs font-medium text-primary sm:[@media(hover:hover)]:hidden"
                aria-hidden="true"
              >
                {m.learnMore}
                <ArrowUpRight className="size-3" />
              </span>
            </CardContent>
          </Card>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-black/50 opacity-0 backdrop-blur-[1.5px] transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:hidden [@media(hover:none)]:hidden motion-reduce:transition-none"
          />
          <span
            className="work-card-action pointer-events-none absolute top-1/2 left-1/2 z-20 inline-flex min-h-13 -translate-x-1/2 translate-y-0 scale-90 -rotate-4 items-center gap-3 rounded-lg bg-primary px-6 text-sm font-semibold whitespace-nowrap text-primary-foreground opacity-0 transition duration-500 group-hover:-translate-y-1/2 group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-100 group-focus-visible:-translate-y-1/2 group-focus-visible:scale-100 group-focus-visible:rotate-0 group-focus-visible:opacity-100 max-sm:hidden [@media(hover:none)]:hidden motion-reduce:transition-none"
            aria-hidden="true"
          >
            {m.learnMore}
            <ArrowUpRight className="size-4" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="portfolio-project-modal flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-card p-0 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-4rem)] sm:max-w-[880px] sm:rounded-[22px] sm:border data-[video-expanded=true]:inset-0 data-[video-expanded=true]:h-dvh data-[video-expanded=true]:max-h-none data-[video-expanded=true]:w-screen data-[video-expanded=true]:max-w-none data-[video-expanded=true]:translate-none data-[video-expanded=true]:rounded-none"
        overlayClassName="bg-primary/20 backdrop-blur-md"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <header className="grid shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 px-5 pt-5 pb-4 sm:px-8 sm:pt-6">
          <DialogTitle className="col-start-2 text-center font-serif text-[32px] leading-[1.15] font-normal tracking-tight sm:text-[38px]">
            {projeto.titulo}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-full bg-card"
              aria-label={ui("Fechar")}
            >
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </header>
        <div className="project-dialog-scroll work-modal-scroll min-h-0 flex-1 overflow-auto overscroll-contain px-5 pb-[max(28px,env(safe-area-inset-bottom))] sm:px-8 sm:pb-8">
          <ProjectMedia project={projeto} />
          <div className="mt-6 space-y-3 text-sm leading-[1.85] text-muted-foreground">
            {projeto.descricao != null ? (
              <RichText value={projeto.descricao} />
            ) : (
              <>
                <RichText
                  value={
                    hasText(projeto.pitch) ? projeto.pitch : projeto.problema
                  }
                />
                {additional.map((text) => (
                  <RichText key={JSON.stringify(text)} value={text} />
                ))}
              </>
            )}
          </div>
          <ProjectFeatures profiles={details?.perfis} />
          <footer className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <Technologies
              items={projeto.tecnologias}
              label={ui("Tecnologias")}
            />
            <div className="flex flex-wrap gap-3">
              {projeto.linkDeploy && (
                <Button asChild variant="outline" className="h-11">
                  <a
                    href={projeto.linkDeploy}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {m.visitPlatform}
                  </a>
                </Button>
              )}
              {projeto.linkGithub && (
                <Button
                  asChild
                  className="work-code-link h-11 bg-[#111] text-white hover:bg-primary dark:bg-white dark:text-[#111] dark:hover:bg-primary"
                >
                  <a
                    href={projeto.linkGithub}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.97 2.24 3.29 1.27.1-.73.4-1.23.72-1.51-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.75 10.75 0 0 1 5.64 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v2.78c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
                    </svg>
                    {ui("Ver código")}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
              )}
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
