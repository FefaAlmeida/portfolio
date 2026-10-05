"use client";

import { useId } from "react";
import ArticlePreviewCard from "@/components/card";
import {
  Container,
  Section,
  SectionHeading,
  SectionSubtitle,
} from "@/components/portfolio/section";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { t } from "@/i18n/messages";

const options = {
  align: "start",
  loop: true,
  active: false,
  breakpoints: {
    "(min-width: 1024px)": { active: true },
    "(prefers-reduced-motion: reduce)": { duration: 0 },
  },
};

export default function Projects({
  projects = [],
  locale = "pt-BR",
  statement,
}) {
  const m = t(locale);
  const statementWords = (statement || m.hero).trim().split(/\s+/);
  const id = useId();
  return (
    <Section
      id="projetos"
      className="pt-8 pb-12 md:pb-20 md:pt-10 font-[Arial,Helvetica,sans-serif]"
      aria-labelledby={`projects-title-${id}`}
    >
      <Container>
        <SectionHeading
          id={`projects-title-${id}`}
          title={m.projectsTitle}
          description={m.projectsIntro}
          className="mb-3 font-serif text-xl text-left md:w-full md:font-[Arial,Helvetica,sans-serif] md:text-base md:border-b md:mb-10 md:pb-8 [&_h2]:text-[clamp(2.75rem,12vw,3.5rem)] md:[&_h2]:text-[clamp(36px,4vw,60px)] [&_h2]:leading-[1.15] [&_p]:hidden md:[&_p]:block [&_p]:mt-5"
        />
        <SectionSubtitle
          className="mb-7 md:hidden"
          highlight={statementWords.at(-1)}
        >
          {statementWords.slice(0, -1).join(" ")}
        </SectionSubtitle>
        <Carousel
          opts={options}
          aria-label={m.projectsTitle}
          className="w-full"
        >
          <CarouselContent
            id={id}
            className="work-track -ml-5 flex-col gap-y-7 pt-1.5 pb-[18px] lg:flex-row"
          >
            {projects.map((project) => (
              <CarouselItem key={project.id} className="flex pl-5 lg:basis-1/3">
                <ArticlePreviewCard projeto={project} locale={locale} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {projects.length > 3 && (
            <>
              <CarouselPrevious
                variant="brand"
                className="-left-14 hidden size-11 lg:flex"
                aria-label={m.previousProject}
                aria-controls={id}
              />
              <CarouselNext
                variant="brand"
                className="-right-14 hidden size-11 lg:flex"
                aria-label={m.nextProject}
                aria-controls={id}
              />
            </>
          )}
        </Carousel>
      </Container>
    </Section>
  );
}
