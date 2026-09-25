import React from 'react'
import { premios } from '@/data/projetos'

export default function Premios() {
  return (
    <section id="premios" className="w-full bg-[#f4eee1] text-[#221f1e] px-6 py-16 md:px-16 md:py-24 select-none border-t border-[#e2dacb]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#a38f7e] font-medium">
            05 · RECONHECIMENTOS
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#221f1e]">
            Prêmios e Conquistas
          </h2>
        </div>

        {/* Grid estilo Tabela com bordas conectadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-[#e2dacb] bg-[#f4eee1]/60">
          {premios.map((item, index) => {
            // Regras para desenhar as bordas internas sem duplicar
            const isLastRow = index >= premios.length - 3
            const isRightCol = (index + 1) % 3 === 0

            return (
              <div 
                key={item.id} 
                className={`p-8 md:p-10 flex flex-col justify-between gap-8 transition-colors hover:bg-white/40 ${
                  !isLastRow ? 'border-b border-[#e2dacb]' : ''
                } ${
                  !isRightCol ? 'md:border-r border-[#e2dacb]' : ''
                }`}
              >
                {/* Tag Superior */}
                <span className="text-xs uppercase tracking-widest text-[#a38f7e] font-semibold">
                  {item.tag}
                </span>

                {/* Título & Descrição */}
                <div className="space-y-3">
                  <h3 className="font-serif text-2xl md:text-3xl font-normal text-[#221f1e] leading-snug">
                    {item.titulo}
                  </h3>
                  <p className="text-sm md:text-base text-[#524b45] leading-relaxed font-sans">
                    {item.descricao}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}