'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { motion } from 'framer-motion'

const ArticlePreviewCard = ({ projeto }) => {
  // Se "projeto" não for passado por engano, evita que a aplicação quebre
  if (!projeto) return null

  const bgCor = projeto.bgCor || 'bg-[#c85266]'
  const textCor = projeto.textCor || 'text-white'

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full cursor-pointer max-w-md"
        >
          <Card className={`group relative flex flex-col justify-between overflow-hidden border-0 rounded-2xl ${bgCor} ${textCor} p-0 shadow-sm transition-shadow hover:shadow-lg h-[440px]`}>
            
            {/* HOVER OVERLAY */}
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
              <span className="rounded-full border border-white/80 px-6 py-2.5 text-sm font-medium tracking-wide text-white">
                Saiba mais
              </span>
            </div>

            {/* 1. IMAGEM DE CAPA */}
            <div className="relative h-40 w-full overflow-hidden bg-black/10 shrink-0">
              <img
                src={projeto.imagemUrl || 'https://images.shadcnspace.com/assets/blog/blog-img12.jpg'}
                alt={projeto.titulo || 'Imagem do projeto'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* 2. CONTEÚDO DO CARD */}
            <div className="flex flex-1 flex-col justify-between p-6">
              
              {/* TAGS */}
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-90">
                <span>{projeto.tagEsquerda || '01 · PROJETO'}</span>
                <span>{projeto.tagDireita || 'CONCLUÍDO'}</span>
              </div>

              {/* TÍTULO E PITCH */}
              <div className="my-auto py-2">
                <h3 className="font-serif text-2xl md:text-3xl font-normal leading-snug tracking-tight mb-2">
                  {projeto.titulo}
                </h3>
                <p className="text-xs md:text-sm font-normal leading-relaxed opacity-90 line-clamp-3">
                  {projeto.pitch}
                </p>
              </div>

              {/* TECNOLOGIAS */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {projeto.tecnologias?.map((tech, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-white/40 px-3 py-0.5 text-[11px] font-medium backdrop-blur-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>

            </div>
          </Card>
        </motion.div>
      </DialogTrigger>

      {/* MODAL DE DETALHES DINÂMICO (LARGURA AUMENTADA) */}
      <DialogContent className="sm:max-w-2xl md:sm:max-w-3xl w-full border-[#e2dacb] bg-[#f4eee1] text-[#221f1e] p-8">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest text-[#a38f7e]">
              {projeto.tagEsquerda} — {projeto.tagDireita}
            </span>
            <h2 className="mt-1 font-serif text-3xl font-bold">{projeto.titulo}</h2>
          </div>
          
          <div className="space-y-4">
            {projeto.problema && (
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-[#a38f7e]">O Problema</h4>
                <p className="text-[#524b45] text-sm leading-relaxed mt-1">{projeto.problema}</p>
              </div>
            )}

            {projeto.solucao && (
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-[#a38f7e]">A Solução</h4>
                <p className="text-[#524b45] text-sm leading-relaxed mt-1">{projeto.solucao}</p>
              </div>
            )}

            {projeto.papel && (
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-[#a38f7e]">Meu Papel</h4>
                <p className="text-[#524b45] text-sm leading-relaxed mt-1">{projeto.papel}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 pt-4 border-t border-[#e2dacb]">
            {projeto.linkGithub && (
              <a href={projeto.linkGithub} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#c85266] hover:underline">
                Ver Código Fonte
              </a>
            )}
            {projeto.linkDeploy && (
              <a href={projeto.linkDeploy} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#c85266] hover:underline">
                Visitar Plataforma
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ArticlePreviewCard