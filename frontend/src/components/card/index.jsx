'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { motion } from 'framer-motion'

const ArticlePreviewCard = ({ projeto }) => {
  if (!projeto) return null

  const { detalhes } = projeto

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full cursor-pointer"
        >
          {/* CARD EM BEGE (#f4eee1) COM BORDA SUTIL */}
          <Card className="group relative flex flex-col justify-between overflow-hidden border border-[#e2dacb] dark:border-[#493b41] rounded-2xl bg-[#f4eee1] dark:bg-[#231c20] text-[#221f1e] dark:text-[#f5ede6] p-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-[450px]">
            
            {/* HOVER OVERLAY EM ROSA (#c85266) QUE SÓ APARECE AO PASSAR O MOUSE */}
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#c85266]/90 dark:bg-[#ad4861]/90 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
              <span className="rounded-full border border-[#f4eee1] bg-[#f4eee1]/20 px-6 py-2 text-sm font-medium tracking-wider text-[#f4eee1] backdrop-blur-md">
                Saiba mais
              </span>
            </div>

            {/* 1. IMAGEM DE CAPA LIMPA E NÍTIDA (SEM GRADIENTE QUE LAVA A FOTO) */}
            <div className="relative h-44 w-full overflow-hidden bg-[#e2dacb] dark:bg-[#493b41] shrink-0 border-b border-[#e2dacb] dark:border-[#493b41]">
              <img
                src={projeto.imagemUrl || 'https://images.shadcnspace.com/assets/blog/blog-img12.jpg'}
                alt={projeto.titulo || 'Imagem do projeto'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* 2. CONTEÚDO DO CARD */}
            <div className="flex flex-1 flex-col justify-between p-6 pt-4">
              
              {/* TAGS EM ROSA */}
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-[#c85266] dark:text-[#ef8799]">
                <span>{projeto.tagEsquerda || '01 · PROJETO'}</span>
                <span className="px-2.5 py-0.5 rounded-full border border-[#c85266]/30 dark:border-[#ef8799]/35 bg-[#c85266]/10 dark:bg-[#ef8799]/15 text-[#c85266] dark:text-[#ef8799]">
                  {projeto.tagDireita || 'CONCLUÍDO'}
                </span>
              </div>

              {/* TÍTULO E PITCH */}
              <div className="my-auto py-2">
                <h3 className="font-serif text-2xl md:text-3xl font-normal leading-snug tracking-tight text-[#221f1e] dark:text-[#f5ede6] group-hover:text-[#c85266] dark:group-hover:text-[#ef8799] transition-colors mb-2">
                  {projeto.titulo}
                </h3>
                <p className="text-xs md:text-sm font-normal leading-relaxed text-[#524b45] dark:text-[#c8b8b7] line-clamp-3">
                  {projeto.pitch}
                </p>
              </div>

              {/* BADGES DAS TECNOLOGIAS EM ROSA */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {projeto.tecnologias?.map((tech, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-[#c85266]/30 dark:border-[#ef8799]/35 bg-[#c85266]/10 dark:bg-[#ef8799]/15 px-3 py-0.5 text-[10px] font-mono font-medium text-[#c85266] dark:text-[#ef8799]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

            </div>
          </Card>
        </motion.div>
      </DialogTrigger>

      {/* MODAL DE DETALHES */}
      <DialogContent className="sm:max-w-2xl md:max-w-3xl w-full border-[#e2dacb] dark:border-[#493b41] bg-[#f4eee1] dark:bg-[#231c20] text-[#221f1e] dark:text-[#f5ede6] p-6 sm:p-8 max-h-[85vh] overflow-y-auto rounded-3xl">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c85266] dark:text-[#ef8799]">
              <span>{projeto.tagEsquerda} — {projeto.tagDireita}</span>
              {detalhes?.periodo && <span>• {detalhes.periodo}</span>}
            </div>
            <h2 className="mt-1 font-serif text-2xl sm:text-4xl font-normal text-[#221f1e] dark:text-[#f5ede6]">{projeto.titulo}</h2>
            {projeto.subtitulo && (
              <p className="text-xs sm:text-sm text-[#73685f] dark:text-[#baaaa8] mt-1">{projeto.subtitulo}</p>
            )}
          </div>
          
          <div className="space-y-4">
            {projeto.problema && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#c85266] dark:text-[#ef8799]">O Problema</h4>
                <p className="text-[#524b45] dark:text-[#c8b8b7] text-xs sm:text-sm leading-relaxed mt-1">{projeto.problema}</p>
              </div>
            )}

            {projeto.solucao && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#c85266] dark:text-[#ef8799]">A Solução</h4>
                <p className="text-[#524b45] dark:text-[#c8b8b7] text-xs sm:text-sm leading-relaxed mt-1">{projeto.solucao}</p>
              </div>
            )}

            {projeto.papel && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#c85266] dark:text-[#ef8799]">Meu Papel</h4>
                <p className="text-[#524b45] dark:text-[#c8b8b7] text-xs sm:text-sm leading-relaxed mt-1">{projeto.papel}</p>
              </div>
            )}

            {detalhes?.modeloNegocio && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#c85266] dark:text-[#ef8799]">Modelo de Negócio</h4>
                <p className="text-[#524b45] dark:text-[#c8b8b7] text-xs sm:text-sm leading-relaxed mt-1">{detalhes.modeloNegocio}</p>
              </div>
            )}

            {detalhes?.diferencial && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#c85266] dark:text-[#ef8799]">Diferencial</h4>
                <p className="text-[#524b45] dark:text-[#c8b8b7] text-xs sm:text-sm leading-relaxed mt-1">{detalhes.diferencial}</p>
              </div>
            )}

            {(detalhes?.funcionalidadesAdmin || detalhes?.funcionalidadesUsuario) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {detalhes?.funcionalidadesAdmin && (
                  <div className="p-4 rounded-2xl border border-[#e2dacb] dark:border-[#493b41] bg-[#e9e1d1]/50 dark:bg-[#493b41]/50">
                    <h5 className="font-bold text-xs uppercase text-[#c85266] dark:text-[#ef8799] mb-2">Painel Admin</h5>
                    <ul className="list-disc list-inside text-xs text-[#524b45] dark:text-[#c8b8b7] space-y-1">
                      {detalhes.funcionalidadesAdmin.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detalhes?.funcionalidadesUsuario && (
                  <div className="p-4 rounded-2xl border border-[#e2dacb] dark:border-[#493b41] bg-[#e9e1d1]/50 dark:bg-[#493b41]/50">
                    <h5 className="font-bold text-xs uppercase text-[#221f1e] dark:text-[#f5ede6] mb-2">Painel Usuário</h5>
                    <ul className="list-disc list-inside text-xs text-[#524b45] dark:text-[#c8b8b7] space-y-1">
                      {detalhes.funcionalidadesUsuario.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {detalhes?.aplicacoes && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#c85266] dark:text-[#ef8799] mb-1">Aplicações Práticas</h4>
                <ul className="list-disc list-inside text-xs sm:text-sm text-[#524b45] dark:text-[#c8b8b7] space-y-1">
                  {detalhes.aplicacoes.map((app, i) => (
                    <li key={i}>{app}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 pt-4 border-t border-[#e2dacb] dark:border-[#493b41]">
            {projeto.linkGithub && (
              <a href={projeto.linkGithub} target="_blank" rel="noreferrer" className="text-xs sm:text-sm font-semibold text-[#c85266] dark:text-[#ef8799] hover:underline">
                Ver Código Fonte →
              </a>
            )}
            {projeto.linkDeploy && (
              <a href={projeto.linkDeploy} target="_blank" rel="noreferrer" className="text-xs sm:text-sm font-semibold text-[#c85266] dark:text-[#ef8799] hover:underline">
                Visitar Plataforma →
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ArticlePreviewCard