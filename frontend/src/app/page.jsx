import Header from "@/components/header";
import Hero from "@/components/hero";
import About from "@/components/sobreMim";
import ArticlePreviewCard from "@/components/card";
import Experiencias from "@/components/experiencia";
import Premios from "@/components/premios";
import { PROJETOS } from "@/data/projetos";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <About />

      {/* SEÇÃO DE PROJETOS */}
      <section id="projetos" className="relative w-full bg-neutral-900 dark:bg-[#F4EEE1] text-[#f4eee1] dark:text-[#221f1e] py-20 px-6 sm:px-12 overflow-hidden">
        
        {/* ELEMENTO DE FUNDO */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#c85266]/10 dark:hidden via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-12">
          
          {/* CABEÇALHO NO PADRÃO MINIMALISTA (IGUAL A FOTO 2) */}
          <div className="border-b border-[#a38f7e]/20 dark:border-[#a38f7e]/30 pb-8 space-y-3">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal leading-tight text-[#f4eee1] dark:text-[#221f1e] tracking-tight">
              Projetos & Trabalhos Recentes
            </h2>

            <p className="text-sm sm:text-base text-[#a38f7e] dark:text-[#524b45] font-normal leading-relaxed max-w-2xl pt-2">
              Uma coleção das soluções que desenvolvi, combinando tecnologia, design intuitivo e estrutura moderna. Clique em qualquer card para explorar os detalhes.
            </p>
          </div>

          {/* GRID DOS CARDS ROSAS COM DETALHES BEGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-2">
            {PROJETOS.map((item) => (
              <ArticlePreviewCard key={item.id} projeto={item} />
            ))}
          </div>

        </div>
      </section>

      <Experiencias />
      <Premios />
    </>
  );
}
