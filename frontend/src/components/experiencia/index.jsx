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
    <section id="experiencias" className="w-full bg-[#f4eee1] dark:bg-[#231c20] text-[#221f1e] dark:text-[#f5ede6] py-20 px-6 sm:px-10 md:px-14 border-t border-[#e2dacb] dark:border-[#493b41] select-none overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        <Carousel className="w-full">
          
          {/* CABEÇALHO DA SEÇÃO COM NAVEGAÇÃO INTEGRADA E ESPAÇADA */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e2dacb] dark:border-[#493b41] pb-8 mb-10">
            <div className="space-y-2">
              <span className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#a38f7e] dark:text-[#c8aeb1] font-semibold block">
                04 · TRAJETÓRIA & PROTAGONISMO
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#221f1e] dark:text-[#f5ede6]">
                Projetos Extracurriculares
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <p className="text-sm text-[#524b45] dark:text-[#c8b8b7] max-w-md font-sans leading-relaxed">
                Iniciativas de liderança, trabalho voluntário, docência e jornalismo jovem em que desempenhei papéis ativos de impacto social e comunitário.
              </p>

              {/* CONTROLES DE NAVEGAÇÃO COM RESPIRO ADEQUADO */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                <CarouselPrevious className="static translate-y-0 border border-[#e2dacb] dark:border-[#493b41] bg-[#f4eee1] dark:bg-[#231c20] hover:bg-[#c85266] dark:hover:bg-[#bd536b] hover:text-white dark:hover:text-white hover:border-[#c85266] dark:hover:border-[#ef8799] text-[#221f1e] dark:text-[#f5ede6] h-11 w-11 transition-all shadow-sm" />
                <CarouselNext className="static translate-y-0 border border-[#e2dacb] dark:border-[#493b41] bg-[#f4eee1] dark:bg-[#231c20] hover:bg-[#c85266] dark:hover:bg-[#bd536b] hover:text-white dark:hover:text-white hover:border-[#c85266] dark:hover:border-[#ef8799] text-[#221f1e] dark:text-[#f5ede6] h-11 w-11 transition-all shadow-sm" />
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
                    <div className="relative h-[320px] sm:h-[400px] lg:h-[450px] w-full rounded-2xl overflow-hidden shadow-sm bg-[#e2dacb] dark:bg-[#493b41]">
                      <img
                        src={item.imagemUrl}
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 bg-[#221f1e]/90 dark:bg-[#120f11]/90 backdrop-blur-md text-[#f4eee1] text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                        {item.periodo}
                      </div>
                    </div>
                    
                    {/* TAGS LIMPAS SEM '#' */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium px-3.5 py-1 rounded-full bg-[#e2dacb]/60 dark:bg-[#493b41]/60 text-[#524b45] dark:text-[#c8b8b7] border border-[#e2dacb] dark:border-[#493b41]"
                        >
                          {tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CONTEÚDO EDITORIAL */}
                  <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#a38f7e] dark:text-[#c8aeb1] block mb-2">
                        {item.categoria}
                      </span>

                      <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#221f1e] dark:text-[#f5ede6] leading-tight mb-2">
                        {item.titulo}
                      </h3>
                      
                      <p className="text-xs sm:text-sm font-semibold text-[#c85266] dark:text-[#ef8799] uppercase tracking-wider mb-4">
                        {item.papel}
                      </p>

                      <p className="text-sm sm:text-base text-[#524b45] dark:text-[#c8b8b7] leading-relaxed mb-6 font-sans">
                        {item.descricao}
                      </p>

                      {/* BLANCO DE IMPACTO & RESULTADOS COM LINHA LATERAL ÚNICA */}
                      <div className="space-y-4 border-t border-[#e2dacb] dark:border-[#493b41] pt-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#a38f7e] dark:text-[#c8aeb1]">
                          Impacto & Resultados
                        </h4>
                        
                        {/* LINHA LATERAL ÚNICA CONTÍNUA */}
                        <div className="border-l-2 border-[#c85266]/40 dark:border-[#ef8799]/50 pl-5 space-y-4 font-sans text-sm md:text-base leading-relaxed text-[#524b45] dark:text-[#c8b8b7]">
                          {item.impactoXYZ?.realizacao && (
                            <div>
                              <strong className="text-[#221f1e] dark:text-[#f5ede6] font-semibold">Realização: </strong>
                              <span>{item.impactoXYZ.realizacao}</span>
                            </div>
                          )}
                          
                          {item.impactoXYZ?.metrica && (
                            <div>
                              <strong className="text-[#c85266] dark:text-[#ef8799] font-semibold">Métricas & Alcance: </strong>
                              <span>{item.impactoXYZ.metrica}</span>
                            </div>
                          )}

                          {item.impactoXYZ?.metodo && (
                            <div>
                              <strong className="text-[#221f1e] dark:text-[#f5ede6] font-semibold">Atuação & Métodos: </strong>
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
