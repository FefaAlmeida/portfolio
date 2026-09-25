import Image from "next/image";
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
      <section id="projetos" className="relative w-full bg-neutral-900 text-[#f4eee1] py-20 px-4 overflow-hidden">
        
        {/* ELEMENTOS DE FUNDO (Efeito de brilho suave e grade sutil) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#c85266]/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

        <div className="relative max-w-7xl mx-auto space-y-12">
          
          {/* CABEÇALHO DA SEÇÃO */}
          <div className="max-w-2xl mx-auto text-center space-y-4">
            
            {/* TAG SUPERIOR */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#a38f7e]/30 bg-[#a38f7e]/10 text-[#a38f7e] text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c85266] animate-pulse" />
              Portfólio & Experiências
            </div>

            {/* TÍTULO PRINCIPAL */}
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-white tracking-tight">
              Projetos selecionados & trabalhos recentes
            </h2>

            {/* TEXTINHO DE APRESENTAÇÃO */}
            <p className="text-sm sm:text-base text-[#a38f7e] font-normal leading-relaxed max-w-xl mx-auto">
              Uma coleção das soluções que desenvolvi no SENAI e em projetos pessoais, combinando tecnologia, design intuitivo e estrutura moderna. Clique em qualquer card para explorar os detalhes.
            </p>
          </div>

          {/* GRID RESPONSIVA DOS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center pt-4">
            {PROJETOS.map((item) => (
              <ArticlePreviewCard key={item.id} projeto={item} />
            ))}
          </div>

        </div>
      </section>

      {/* SEÇÃO DE EXPERIÊNCIAS EXTRACURRICULARES */}
      <Experiencias />

      {/* SEÇÃO DE PRÊMIOS E CONQUISTAS */}
      <Premios />
    
    </>
  );
}