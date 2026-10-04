import { portfolioSections } from "@/lib/sections";
import { formatMessage } from "./format";

const sources = {
  skipContent: "Pular para o conteúdo",
  nav: portfolioSections.map(({ label }) => label),
  projectsTitle: "Projetos",
  projectsIntro:
    "Uma coleção das soluções que desenvolvi, combinando tecnologia, design intuitivo e estrutura moderna. Clique em qualquer card para explorar os detalhes.",
  unavailable:
    "Parte do conteúdo está temporariamente indisponível. Tente novamente em instantes.",
  hero: "Transformando aprendizado em projetos e conquistas.",
  seeProjects: "Ver projetos",
  seeAwards: "Ver prêmios",
  awards: "Prêmios",
  learnMore: "Saiba mais",
  sourceCode: "Ver código fonte ↗",
  visitPlatform: "Visitar plataforma ↗",
  credential: "Ver credencial",
  nextProject: "Próximo projeto",
  previousProject: "Projeto anterior",
};
export const t = (locale) =>
  Object.fromEntries(
    Object.entries(sources).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map((text) => formatMessage(locale, text))
        : formatMessage(locale, value),
    ]),
  );
