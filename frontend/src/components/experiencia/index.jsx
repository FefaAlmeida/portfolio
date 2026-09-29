"use client";

import { ArrowUpRight, CalendarDays } from "lucide-react";
import { useId } from "react";
import {
  Container,
  Section,
  SectionHeading,
} from "@/components/portfolio/section";
import RichText from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import ExperienceGallery from "./gallery";

const copyClass =
  "text-sm leading-[1.85] text-muted-foreground [&_strong]:font-semibold [&_strong]:text-highlight";

function Instagram({ size = 17, ...props }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function paragraphs(description) {
  if (description?.type !== "doc") return [description, null];
  const [first, ...rest] = description.content || [];
  return [
    first && { type: "doc", content: [first] },
    rest.length ? { type: "doc", content: rest } : null,
  ];
}

function participationPeriod(item, ui) {
  const format = (value) =>
    value === "present"
      ? ui("Presente")
      : `${value.slice(5)}/${value.slice(0, 4)}`;
  return item.inicio
    ? [format(item.inicio), item.fim && format(item.fim)]
        .filter(Boolean)
        .join(" — ")
    : item.periodo;
}

export default function Experiencias({ experiencias = [] }) {
  const { ui } = useI18n();
  const instance = useId();
  if (!experiencias.length) return null;
  const anchor = (item) =>
    `experiencia-${item.id === "preview" ? instance : item.id}`;

  return (
    <Section
      id="experiencias"
      className="experience-journal border-t border-timeline py-12 md:pt-18 md:pb-12"
      aria-labelledby={`experience-title-${instance}`}
    >
      <Container>
        <p className="mb-4 text-[10px] font-semibold tracking-[.14em] text-primary uppercase">
          {ui("Além da sala de aula")}
        </p>
        <SectionHeading
          id={`experience-title-${instance}`}
          title={ui("Projetos extracurriculares")}
          className="mb-0 [&_h2]:font-display [&_p]:mt-3.5 [&_p]:text-[15px]"
          description={ui("Educação, comunicação e voluntariado")}
        />
        <div className="experience-stories relative before:absolute before:top-[52px] before:bottom-8 before:left-2 before:w-px before:bg-timeline md:before:left-1/2">
          {experiencias.map((item, index) => {
            const reversed = index % 2 === 1;
            const [context, contribution] = paragraphs(item.descricao);
            const links = [
              [item.siteUrl, ui("Site"), null],
              [item.instagramUrl, ui("Instagram"), Instagram],
            ].filter(([url]) => /^https?:\/\//i.test(url || ""));
            return (
              <article
                key={item.id}
                id={anchor(item)}
                className={cn(
                  "experience-story relative grid scroll-mt-28 grid-cols-1 gap-y-4 pt-7 pb-12 pl-7 outline-none last:pb-5 focus-visible:ring-2 focus-visible:ring-primary md:grid-cols-2 md:grid-rows-[auto_auto_auto_1fr] md:gap-x-14 md:pt-8 md:pb-16 md:pl-0 lg:gap-x-22 before:absolute before:top-[42px] before:left-0.5 before:size-[13px] before:rounded-full before:border-[3px] before:border-background before:bg-primary before:ring-1 before:ring-primary md:before:top-[46px] md:before:left-[calc(50%-6px)] after:absolute after:top-[52px] after:hidden after:h-px after:w-[21px] after:bg-timeline md:after:block lg:after:w-[37px] [&>*]:min-w-0",
                  reversed
                    ? "md:after:left-[calc(50%-28px)] lg:after:left-[calc(50%-44px)]"
                    : "md:after:left-[calc(50%+7px)]",
                  !item.imagemUrl && "experience-story-no-image",
                )}
                tabIndex={-1}
                aria-labelledby={`${anchor(item)}-title`}
              >
                <p
                  className={cn(
                    "experience-date relative z-10 flex min-h-10 items-center gap-2 rounded-lg border border-timeline bg-white dark:bg-card px-3 py-2 text-[11px] text-primary tabular-nums md:row-start-1 md:px-3.5 md:text-xs",
                    reversed
                      ? "justify-self-start md:col-start-1 md:justify-self-end"
                      : "justify-self-start md:col-start-2",
                  )}
                >
                  <CalendarDays size={15} aria-hidden="true" />
                  {participationPeriod(item, ui)}
                </p>
                <header
                  className={cn(
                    "experience-story-heading md:row-start-2",
                    reversed ? "md:col-start-1" : "md:col-start-2",
                  )}
                >
                  <div className="mb-2">
                    {item.categoria && (
                      <p className="text-[9px] leading-relaxed font-medium tracking-[.12em] text-muted-foreground uppercase">
                        {item.categoria}
                      </p>
                    )}
                  </div>
                  <h3
                    id={`${anchor(item)}-title`}
                    className="font-display text-[clamp(1.75rem,3vw,2.375rem)] leading-[1.2] tracking-[-.035em] text-pretty"
                  >
                    {item.titulo}
                  </h3>
                  {item.papel && (
                    <p className="mt-2.5 text-xs leading-relaxed font-semibold text-primary">
                      {item.papel}
                    </p>
                  )}
                </header>
                <RichText
                  value={context}
                  className={cn(
                    "experience-context md:row-start-3",
                    copyClass,
                    reversed ? "md:col-start-1" : "md:col-start-2",
                  )}
                />
                {item.imagemUrl && (
                  <figure
                    className={cn(
                      "experience-figure self-center md:row-span-4 md:row-start-1",
                      reversed ? "md:col-start-2" : "md:col-start-1",
                    )}
                  >
                    <ExperienceGallery item={item} />
                    {item.imagemLegenda && (
                      <figcaption className="sr-only">
                        {item.imagemLegenda}
                      </figcaption>
                    )}
                  </figure>
                )}
                <div
                  className={cn(
                    "experience-body md:row-start-4",
                    reversed ? "md:col-start-1" : "md:col-start-2",
                  )}
                >
                  <RichText value={contribution} className={copyClass} />
                  {!!links.length && (
                    <div className="experience-links mt-6 flex flex-wrap gap-2.5">
                      {links.map(([url, label, Icon], linkIndex) => (
                        <Button
                          asChild
                          key={label}
                          variant={
                            linkIndex === 0 && !Icon ? "default" : "outline"
                          }
                          className={cn(
                            "h-11 gap-2 border-highlight px-4 text-xs font-semibold text-highlight hover:border-highlight hover:bg-highlight hover:text-background",
                            linkIndex === 0 && !Icon
                              ? "bg-highlight text-background dark:bg-highlight dark:text-background dark:hover:bg-highlight/85"
                              : "bg-white dark:bg-card",
                          )}
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={ui("{0} de {1} (abre em nova aba)", {
                              0: label,
                              1: item.titulo,
                            })}
                          >
                            {Icon && <Icon size={17} aria-hidden="true" />}
                            {label}
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
