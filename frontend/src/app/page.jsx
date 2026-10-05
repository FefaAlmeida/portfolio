import DevContentRefresh from "@/components/dev-content-refresh";
import Experiencias from "@/components/experiencia";
import Header from "@/components/header";
import Hero, { Statement } from "@/components/hero";
import Premios from "@/components/premios";
import Projects from "@/components/projects";
import About, { Education } from "@/components/sobreMim";
import defaults from "@/i18n/default-site.json";
import { t } from "@/i18n/messages";
import { publicContent } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = {
  alternates: { canonical: "/", languages: { "pt-BR": "/", "en-US": "/en" } },
};

export default async function Home({ locale = "pt-BR" }) {
  const m = t(locale);
  const results = await Promise.allSettled(
    ["projetos", "experiencias", "premios", "site"].map((kind) =>
      publicContent(kind, locale),
    ),
  );
  const [projetos, experiencias, premios, site] = results.map((r) =>
    r.status === "fulfilled" ? r.value : [],
  );
  const unavailable = results.some((r) => r.status === "rejected");
  if (locale === "en-US" && unavailable)
    return (
      <>
        <Header locale={locale} />
        <main className="p-10 pt-40">
          <output>{m.unavailable}</output>
        </main>
      </>
    );
  return (
    <>
      {process.env.NODE_ENV === "development" && <DevContentRefresh />}
      <Header locale={locale} />
      <a
        href="#conteudo"
        className="sr-only fixed top-3 left-3 z-[60] rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        {m.skipContent}
      </a>
      <main id="conteudo" tabIndex={-1}>
        <Hero
          locale={locale}
          content={site?.heroTitle ? site : defaults[locale]}
        />
        <About
          locale={locale}
          content={site?.aboutTitle ? site : defaults[locale]}
        />
        <Education locale={locale} />
        <Statement
          locale={locale}
          content={site?.heroTitle ? site : defaults[locale]}
        />
        {unavailable && (
          <output className="block p-6 text-center">{m.unavailable}</output>
        )}

        <Projects projects={projetos} locale={locale} statement={site?.heroTitle} />

        <Experiencias experiencias={experiencias} locale={locale} />
        <Premios premiosData={premios} locale={locale} />
      </main>
    </>
  );
}
