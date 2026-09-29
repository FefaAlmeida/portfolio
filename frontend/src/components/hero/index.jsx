import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container, Section } from "@/components/portfolio/section";
import { Button } from "@/components/ui/button";
import { formatMessage } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function Hero({ locale = "pt-BR" }) {
  const m = t(locale);
  const ui = (text) => formatMessage(locale, text);
  return (
    <Section
      id="inicio"
      className="pt-24 pb-[34px] min-[421px]:pt-[108px] md:pt-[121px] md:pb-[42px] lg:pt-32 lg:pb-[62px]"
      aria-labelledby="intro-title"
    >
      <Container>
        <p className="max-w-[10ch] font-serif text-[clamp(2.875rem,11.7vw,4.5rem)] leading-[1.08] tracking-[-.06em] md:max-w-none md:text-[clamp(3.5rem,7.8vw,6.5rem)]">
          {ui("Oie! Meu nome é")}
        </p>
        <h1
          id="intro-title"
          className="mt-3 font-serif text-[clamp(3.375rem,13.5vw,5.2rem)] leading-[1.05] font-normal tracking-[-.06em] md:text-[clamp(4rem,8.8vw,7.5rem)] md:leading-[1.08]"
        >
          Fernanda{" "}
          <span className="block text-primary md:inline">
            {ui("Gabriela.")}
          </span>
        </h1>
        <div className="mt-6 grid items-end gap-6 md:mt-9 md:grid-cols-[1.2fr_1fr]">
          <p className="max-w-[460px] text-sm leading-[1.85] text-muted-foreground md:text-[15px]">
            {ui(
              "Desenvolvo aplicações web e participo de projetos de educação, comunicação e voluntariado.",
            )}
          </p>
          <div className="flex flex-wrap items-center gap-6 md:justify-end">
            <Button
              asChild
              className="landing-action h-12 gap-[31px] rounded-sm px-5 text-[13px]"
            >
              <a href="#projetos">
                {m.seeProjects}
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 gap-3 rounded-sm border-black bg-transparent px-5 text-[13px] text-foreground"
            >
              <a
                href="https://github.com/FefaAlmeida"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.97 2.24 3.29 1.27.1-.73.4-1.23.72-1.51-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.75 10.75 0 0 1 5.64 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v2.78c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
                </svg>
                {ui("GitHub")}
                <ArrowUpRight aria-hidden="true" />
                <span className="sr-only">{ui("(abre em nova aba)")}</span>
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function Statement({ content, locale = "pt-BR" }) {
  const title = content?.heroTitle || t(locale).hero;
  const words = title.trim().split(/\s+/);
  return (
    <Section className="py-16 md:py-24 lg:pt-28 lg:pb-30" aria-label={title}>
      <Container>
        <p className="max-w-[16ch] font-serif text-[clamp(2.25rem,7.7vw,6.875rem)] leading-[1.1] tracking-[-.045em] md:leading-[1.02]">
          {words.slice(0, -1).join(" ")}{" "}
          <span className="text-primary">{words.at(-1)}</span>
        </p>
      </Container>
    </Section>
  );
}
