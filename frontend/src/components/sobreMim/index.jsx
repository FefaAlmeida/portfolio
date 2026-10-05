import Image from "next/image";
import { ParallaxGroup, ParallaxLayer } from "@/components/portfolio/parallax";
import {
  Container,
  Section,
  SectionSubtitle,
} from "@/components/portfolio/section";
import RichText from "@/components/rich-text";
import defaults from "@/i18n/default-site.json";
import { formatMessage } from "@/i18n/format";
import styles from "./about.module.css";

export default function About({
  content = defaults["pt-BR"],
  locale = "pt-BR",
}) {
  return (
    <Section
      id="sobre"
      className="[&>.bubble-field]:hidden md:[&>.bubble-field]:block pb-10 md:pb-19"
      aria-labelledby="about-title"
    >
      <Container className="grid grid-cols-1 gap-3 border-t pt-7 md:gap-6 md:grid-cols-[.87fr_1.3fr] md:gap-x-10 md:pt-12 lg:gap-x-19">
        <h2
          id="about-title"
          className="mx-auto w-full text-left font-serif text-[clamp(2.75rem,12vw,3.5rem)] leading-[1.15] font-normal tracking-[-.035em] md:mx-0 md:w-auto md:col-start-2 md:self-end md:text-[42px] md:leading-tight md:tracking-tight"
        >
          {content.aboutTitle}
        </h2>
        <PortraitCollage
          locale={locale}
          className="hidden md:block md:col-start-1 md:row-span-2 md:row-start-1"
        />
        <RichText
          value={content.aboutParagraphs}
          className="hidden self-start text-sm text-muted-foreground md:block md:space-y-5 md:leading-[1.95] md:col-start-2"
        />
        <RichText
          value={content.aboutParagraphs}
          className="mx-auto w-full space-y-4 text-left font-serif text-xl leading-snug font-light text-muted-foreground md:hidden"
        />
      </Container>
    </Section>
  );
}

export function PortraitCollage({ locale = "pt-BR", className = "" }) {
  const ui = (text) => formatMessage(locale, text);
  return (
    <ParallaxGroup
      as="figure"
      className={`${styles.collage} relative mx-auto w-full max-w-[460px] self-center ${className}`}
    >
      <ParallaxLayer
        distance={14}
        className={`${styles.photo} ${styles.large}`}
      >
        <div className={styles.frame}>
          <Image
            src="/foto_perfil.jpeg"
            alt={ui("Fernanda Gabriela durante uma viagem")}
            fill
            sizes="(min-width: 768px) 332px, 72vw"
            className={styles.travel}
          />
        </div>
      </ParallaxLayer>
      <ParallaxLayer
        distance={30}
        className={`${styles.photo} ${styles.small}`}
      >
        <div className={styles.frame}>
          <Image
            src="/foto_sobre_secundaria.jpeg"
            alt="Fernanda Gabriela"
            fill
            sizes="(min-width: 768px) 207px, 45vw"
            className={styles.portrait}
          />
        </div>
      </ParallaxLayer>
    </ParallaxGroup>
  );
}

export function Education({ locale = "pt-BR" }) {
  const ui = (text) => formatMessage(locale, text);
  return (
    <Section
      id="educacao"
      className="[&>.bubble-field]:hidden md:[&>.bubble-field]:block bg-transparent pb-10 md:border-y md:bg-secondary md:py-12"
      aria-labelledby="education-title"
    >
      <Container className="grid gap-5 border-t pt-7 md:border-0 md:pt-0 md:grid-cols-[.7fr_1.5fr] md:items-center md:gap-8 lg:gap-12">
        <header>
          <h2
            id="education-title"
            className="mx-auto w-full text-left font-serif text-[clamp(2.75rem,12vw,3.5rem)] leading-[1.15] font-normal tracking-[-.035em] md:mx-0 md:w-auto md:text-[42px] md:leading-tight md:tracking-tight"
          >
            {ui("Educação")}
          </h2>
          <SectionSubtitle
            className="mt-3 mb-2 md:mb-0 md:max-w-[360px]"
            highlight={ui("soluções.")}
          >
            {ui("Construindo uma base sólida para transformar ideias em")}
          </SectionSubtitle>
        </header>
        <article className="mx-auto w-full rounded-sm border bg-card p-4 md:mx-0 md:w-auto md:rounded-none md:border-0 md:border-l md:bg-transparent md:py-2 md:pr-0 md:pl-8 lg:pl-10">
          <p className="mb-3 flex items-center gap-2 text-xs md:mb-3.5 md:gap-[11px] md:text-[11px] tracking-[.035em] text-primary tabular-nums">
            <time dateTime="2025-01">{ui("Jan 2025")}</time>
            <span aria-hidden="true">—</span>
            <time dateTime="2026-12">{ui("Dez 2026")}</time>
          </p>
          <h3 className="max-w-[560px] font-serif text-[26px] leading-tight font-normal tracking-tight text-pretty md:text-[29px] md:leading-snug">
            {ui("Técnico em Desenvolvimento de Sistemas")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {ui("SENAI São Caetano do Sul")}
          </p>
        </article>
      </Container>
    </Section>
  );
}
