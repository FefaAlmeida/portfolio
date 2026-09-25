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
    <section id="experiencias" className="w-full bg-[#f4eee1] text-[#221f1e] py-20 px-6 sm:px-10 md:px-14 border-t border-[#e2dacb] select-none overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        <Carousel className="w-full">
          
          {/* CABEÇALHO DA SEÇÃO COM NAVEGAÇÃO INTEGRADA E ESPAÇADA */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e2dacb] pb-8 mb-10">
            <div className="space-y-2">
              <span className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#a38f7e] font-semibold block">
                04 · TRAJETÓRIA & PROTAGONISMO
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#221f1e]">
                Projetos Extracurriculares
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <p className="text-sm text-[#524b45] max-w-md font-sans leading-relaxed">
                Iniciativas de liderança, trabalho voluntário, docência e jornalismo jovem em que desempenhei papéis ativos de impacto social e comunitário.
              </p>

              {/* CONTROLES DE NAVEGAÇÃO COM RESPIRO ADEQUADO */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                <CarouselPrevious className="static translate-y-0 border border-[#e2dacb] bg-[#f4eee1] hover:bg-[#c85266] hover:text-white hover:border-[#c85266] text-[#221f1e] h-11 w-11 transition-all shadow-sm" />
                <CarouselNext className="static translate-y-0 border border-[#e2dacb] bg-[#f4eee1] hover:bg-[#c85266] hover:text-white hover:border-[#c85266] text-[#221f1e] h-11 w-11 transition-all shadow-sm" />
              </div>
            </div>
          </div>

          {/* CONTEÚDO DO CARROSSEL */}
          <CarouselContent className="-ml-4">
            {EXPERIENCIAS.map((item) => (
              <CarouselItem key={item.id} className="pl-4 w-full">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center py-2">
                  
                  {/* IMAGEM + TAGS (SEM #) */}
                  <div className="lg:col-span-5 flex flex-col space-y-5">
                    <div className="relative h-[320px] sm:h-[400px] lg:h-[450px] w-full rounded-2xl overflow-hidden shadow-sm bg-[#e2dacb]">
                      <img
                        src={item.imagemUrl}
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 bg-[#221f1e]/90 backdrop-blur-md text-[#f4eee1] text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                        {item.periodo}
                      </div>
                    </div>
                    
                    {/* TAGS LIMPAS SEM '#' */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium px-3.5 py-1 rounded-full bg-[#e2dacb]/60 text-[#524b45] border border-[#e2dacb]"
                        >
                          {tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CONTEÚDO EDITORIAL */}
                  <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#a38f7e] block mb-2">
                        {item.categoria}
                      </span>

                      <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#221f1e] leading-tight mb-2">
                        {item.titulo}
                      </h3>
                      
                      <p className="text-xs sm:text-sm font-semibold text-[#c85266] uppercase tracking-wider mb-4">
                        {item.papel}
                      </p>

                      <p className="text-sm sm:text-base text-[#524b45] leading-relaxed mb-6 font-sans">
                        {item.descricao}
                      </p>

                      {/* BLANCO DE IMPACTO & RESULTADOS COM LINHA LATERAL ÚNICA */}
                      <div className="space-y-4 border-t border-[#e2dacb] pt-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#a38f7e]">
                          Impacto & Resultados
                        </h4>
                        
                        {/* LINHA LATERAL ÚNICA CONTÍNUA */}
                        <div className="border-l-2 border-[#c85266]/40 pl-5 space-y-4 font-sans text-sm md:text-base leading-relaxed text-[#524b45]">
                          {item.impactoXYZ?.realizacao && (
                            <div>
                              <strong className="text-[#221f1e] font-semibold">Realização: </strong>
                              <span>{item.impactoXYZ.realizacao}</span>
                            </div>
                          )}
                          
                          {item.impactoXYZ?.metrica && (
                            <div>
                              <strong className="text-[#c85266] font-semibold">Métricas & Alcance: </strong>
                              <span>{item.impactoXYZ.metrica}</span>
                            </div>
                          )}

                          {item.impactoXYZ?.metodo && (
                            <div>
                              <strong className="text-[#221f1e] font-semibold">Atuação & Métodos: </strong>
                              <span>{item.impactoXYZ.metodo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

        </Carousel>

      </div>
    </section>
  )
}