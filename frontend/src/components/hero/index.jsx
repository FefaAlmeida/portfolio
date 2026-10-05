import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container, Section } from "@/components/portfolio/section";
import RichText from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import defaults from "@/i18n/default-site.json";
import { formatMessage } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function Hero({ locale = "pt-BR", content }) {
  const m = t(locale);
  const value = { ...defaults[locale], ...content };
  const ui = (text) => formatMessage(locale, text);
  return (
    <Section
      id="inicio"
      className="pt-24 pb-8 min-[421px]:pt-[108px] md:pt-[121px] md:pb-[42px] lg:pt-32 lg:pb-[62px]"
      aria-labelledby="intro-title"
    >
      <Container>
        <div className="min-w-0">
          <p className="whitespace-nowrap font-serif text-[clamp(2rem,11.5vw,4rem)] leading-[1.08] font-normal tracking-[-.06em] text-black dark:text-foreground md:text-foreground md:whitespace-normal md:text-[clamp(3.5rem,7.8vw,6.5rem)]">
            {value.introGreeting}
          </p>
          <h1
            id="intro-title"
            className="mt-2 whitespace-nowrap font-serif text-[clamp(2.25rem,12.8vw,4.5rem)] leading-[1.08] font-normal tracking-[-.06em] md:mt-3 md:whitespace-normal md:text-[clamp(4rem,8.8vw,7.5rem)]"
          >
            <span className="text-black dark:text-foreground">
              {value.introName}
            </span>{" "}
            <span className="text-primary">{value.introSurname}</span>
          </h1>
        </div>
        <div className="mt-6 grid items-end gap-5 md:mt-9 md:grid-cols-[1.2fr_1fr]">
          <RichText
            value={value.introDescription}
            className="max-w-[460px] text-sm leading-[1.85] text-muted-foreground md:text-[15px]"
          />
          <div className="grid grid-cols-2 items-center gap-3 md:flex md:flex-wrap md:justify-end md:gap-6">
            <Button
              asChild
              className="landing-action h-11 gap-3 rounded-sm px-4 text-xs md:h-12 md:gap-[31px] md:px-5 md:text-[13px]"
            >
              <a href="#projetos">
                {m.seeProjects}
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 gap-2 rounded-sm border-transparent bg-transparent px-2 text-xs text-foreground md:border-black md:px-5 md:h-12 md:gap-3 md:px-5 md:text-[13px]"
            >
              <a
                href={value.githubUrl}
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
    <Section
      className="hidden md:block md:pt-24 md:pb-10 lg:pt-28"
      aria-label={title}
    >
      <Container>
        <p className="max-w-none font-serif text-[clamp(2.5rem,12.3vw,4.5rem)] leading-[1.03] tracking-[-.045em] md:max-w-[16ch] md:text-[clamp(2.25rem,7.7vw,6.875rem)] md:leading-[1.02]">
          {words.slice(0, -1).join(" ")}{" "}
          <span className="text-primary">{words.at(-1)}</span>
        </p>
      </Container>
    </Section>
  );
}
