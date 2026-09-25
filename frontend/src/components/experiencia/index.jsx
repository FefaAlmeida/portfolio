import React from 'react'
import { EXPERIENCIAS } from '@/data/experiencias'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function Experiencias() {
  return (
    <section id="experiencias" className="w-full bg-[#f4eee1] text-[#221f1e] py-20 px-4 sm:px-8 md:px-12 border-t border-[#e2dacb] select-none overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e2dacb] pb-6">
          <div className="space-y-1">
            <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#a38f7e] font-semibold">
              04 · TRAJETÓRIA & PROTAGONISMO
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#221f1e]">
              Projetos Extracurriculares
            </h2>
          </div>
          <p className="text-sm text-[#524b45] max-w-md font-sans leading-relaxed">
            Iniciativas de liderança, trabalho voluntário, docência e jornalismo jovem em que desempenhei papéis ativos de impacto social e comunitário.
          </p>
        </div>

        {/* CARROSSEL LIVRE (SEM CAIXA / SEM BORDAS ENVELOPANTES) */}
        <div className="relative w-full pt-4">
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {EXPERIENCIAS.map((item) => (
                <CarouselItem key={item.id} className="pl-4 w-full">
                  
                  {/* GRID DIRETA NO FUNDO DA PÁGINA */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                    
                    {/* IMAGEM + TAGS */}
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                      <div className="relative h-[320px] sm:h-[400px] lg:h-[460px] w-full rounded-2xl overflow-hidden shadow-sm bg-[#e2dacb]">
                        <img
                          src={item.imagemUrl}
                          alt={item.titulo}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 bg-[#221f1e]/90 backdrop-blur-md text-[#f4eee1] text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                          {item.periodo}
                        </div>
                      </div>
                      
                      {/* TAGS SUBTIS */}
                      <div className="flex flex-wrap gap-2">
                        {item.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium px-3 py-1 rounded-full bg-[#e2dacb]/50 text-[#524b45]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CONTEÚDO EDITORIAL */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                      <div>
                        {/* CATEGORIA E TÍTULO */}
                        <span className="text-xs font-semibold uppercase tracking-widest text-[#a38f7e] block mb-2">
                          {item.categoria}
                        </span>

                        <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#221f1e] leading-tight mb-2">
                          {item.titulo}
                        </h3>
                        
                        <p className="text-sm font-semibold text-[#c85266] uppercase tracking-wider mb-4">
                          {item.papel}
                        </p>

                        <p className="text-base text-[#524b45] leading-relaxed mb-6 font-sans">
                          {item.descricao}
                        </p>

                        {/* MÉTODO XYZ LIMPO (SEM BORDAS OU BOXES NESTED) */}
                        <div className="space-y-4 border-t border-[#e2dacb] pt-6">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-[#a38f7e]">
                            Impacto & Resultados (Método XYZ)
                          </h4>
                          
                          <div className="space-y-3 font-sans text-sm md:text-base leading-relaxed text-[#524b45]">
                            <div className="border-l-2 border-[#221f1e] pl-4 py-0.5">
                              <strong className="text-[#221f1e] font-semibold block sm:inline">Realização: </strong>
                              <span>{item.impactoXYZ.realizacao}</span>
                            </div>
                            
                            <div className="border-l-2 border-[#c85266] pl-4 py-0.5">
                              <strong className="text-[#c85266] font-semibold block sm:inline">Métricas & Alcance: </strong>
                              <span>{item.impactoXYZ.metrica}</span>
                            </div>

                            <div className="border-l-2 border-[#a38f7e] pl-4 py-0.5">
                              <strong className="text-[#221f1e] font-semibold block sm:inline">Atuação & Métodos: </strong>
                              <span>{item.impactoXYZ.metodo}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* CONTROLES DE NAVEGAÇÃO SUPERIORES (ALINHADOS AO CABEÇALHO) */}
            <div className="flex justify-end gap-3 pt-6 lg:pt-0 lg:absolute lg:-top-16 lg:right-0">
              <CarouselPrevious className="static translate-y-0 border-[#e2dacb] bg-transparent hover:bg-[#221f1e] hover:text-[#f4eee1] text-[#221f1e] h-11 w-11" />
              <CarouselNext className="static translate-y-0 border-[#e2dacb] bg-transparent hover:bg-[#221f1e] hover:text-[#f4eee1] text-[#221f1e] h-11 w-11" />
            </div>
          </Carousel>
        </div>

      </div>
    </section>
  )
}