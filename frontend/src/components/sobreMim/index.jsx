import Image from "next/image";
import { Container, Section } from "@/components/portfolio/section";
import RichText from "@/components/rich-text";
import defaults from "@/i18n/default-site.json";
import { formatMessage } from "@/i18n/format";

export default function About({
  content = defaults["pt-BR"],
  locale = "pt-BR",
}) {
  const ui = (text) => formatMessage(locale, text);
  return (
    <Section
      id="sobre"
      className="pb-11 md:pb-19"
      aria-labelledby="about-title"
    >
      <Container className="grid grid-cols-1 gap-6 border-t pt-8 md:grid-cols-[.87fr_1.3fr] md:gap-x-10 md:pt-12 lg:gap-x-19">
        <h2
          id="about-title"
          className="font-serif text-[32px] leading-tight tracking-tight md:col-start-2 md:self-end md:text-[42px]"
        >
          {content.aboutTitle === defaults[locale].aboutTitle
            ? ui("Sobre mim")
            : content.aboutTitle}
        </h2>
        <figure className="relative mx-auto aspect-[466/585] w-full max-w-[460px] self-center md:col-start-1 md:row-span-2 md:row-start-1">
          <div className="absolute top-[5.6%] left-[16.5%] h-4/5 w-[73.4%] overflow-hidden rounded-[20px] border bg-card shadow-md">
            <Image
              src="/foto_perfil.jpeg"
              alt={ui("Fernanda Gabriela durante uma viagem")}
              fill
              sizes="(min-width: 768px) 340px, 74vw"
              className="size-full object-cover"
            />
          </div>
          <div className="absolute top-[56.1%] left-[48.3%] h-[36.9%] w-[46.1%] overflow-hidden rounded-[20px] border-[3px] border-background bg-card shadow-xl">
            <Image
              src="/foto_perfil.jpeg"
              alt=""
              fill
              sizes="(min-width: 768px) 340px, 74vw"
              className="size-full object-cover"
            />
          </div>
          <span
            aria-hidden="true"
            className="absolute top-[88.7%] left-[9%] size-2.5 rounded-full bg-primary/30"
          />
        </figure>
        <RichText
          value={content.aboutParagraphs}
          className="space-y-5 self-start text-sm leading-[1.95] text-muted-foreground md:col-start-2"
        />
      </Container>
    </Section>
  );
}

export function Education({ locale = "pt-BR" }) {
  const ui = (text) => formatMessage(locale, text);
  return (
    <Section
      id="educacao"
      className="border-y bg-secondary py-8 md:py-11"
      aria-labelledby="education-title"
    >
      <Container className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <h2
          id="education-title"
          className="font-serif text-[30px] leading-snug"
        >
          {ui("Educação")}
        </h2>
        <article>
          <p className="mb-3.5 flex items-center gap-[11px] text-[11px] tracking-[.035em] text-primary tabular-nums">
            <time dateTime="2025-01">{ui("Jan 2025")}</time>
            <span aria-hidden="true">—</span>
            <time dateTime="2026-12">{ui("Dez 2026")}</time>
          </p>
          <h3 className="max-w-[560px] font-serif text-[26px] leading-snug tracking-tight md:text-[29px]">
            {ui("Técnico em Desenvolvimento de Sistemas")}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui("SENAI São Caetano do Sul")}
          </p>
        </article>
      </Container>
    </Section>
  );
}
