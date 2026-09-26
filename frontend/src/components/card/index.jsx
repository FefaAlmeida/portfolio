'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { motion } from 'framer-motion'

const ArticlePreviewCard = ({ projeto }) => {
  if (!projeto) return null

  const { detalhes } = projeto
  const secoes = [
    { titulo: 'O problema', texto: projeto.problema },
    { titulo: 'A solução', texto: projeto.solucao },
    { titulo: 'Meu papel', texto: projeto.papel },
    { titulo: 'Modelo de negócio', texto: detalhes?.modeloNegocio },
    { titulo: 'Diferencial', texto: detalhes?.diferencial },
  ].filter(({ texto }) => texto)

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
          <Card className="group relative flex flex-col justify-between overflow-hidden border border-[#e2dacb] dark:border-[#493b41] rounded-2xl bg-[#f4eee1] dark:bg-[#231c20] text-[#221f1e] dark:text-[#f5ede6] p-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-[482px]">
            
            {/* HOVER OVERLAY EM ROSA TRANSLÚCIDO */}
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#c85266]/70 dark:bg-[#ad4861]/75 opacity-0 backdrop-blur-[1px] transition-all duration-300 group-hover:opacity-100">
              <span className="rounded-lg bg-white px-9 py-3.5 font-serif text-lg font-medium leading-none tracking-normal text-[#b9435c] shadow-[0_4px_12px_rgba(76,25,39,0.12)]">
                Saiba mais
              </span>
            </div>

            {/* Fundo sólido correspondente ao fundo de cada logo. */}
            <div
              className="relative h-52 w-full overflow-hidden shrink-0 border-b border-[#e2dacb] dark:border-[#493b41]"
              style={{ backgroundColor: projeto.imagemBg || '#f4eee1' }}
            >
              <div className="flex h-full w-full items-center justify-center px-6 py-3">
                <img
                  src={projeto.imagemUrl || 'https://images.shadcnspace.com/assets/blog/blog-img12.jpg'}
                  alt={projeto.titulo || 'Imagem do projeto'}
                  className="block max-h-full max-w-full object-contain object-center"
                />
              </div>
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
      <DialogContent className="project-dialog-scroll w-full max-h-[88vh] gap-0 overflow-y-auto rounded-[28px] border border-[#e4d8cf] bg-[#fbf7f0] p-0 font-[family-name:var(--font-geist-sans)] text-[#221f1e] shadow-[0_24px_70px_rgba(38,24,25,0.18)] dark:border-[#59454a] dark:bg-[#231c20] dark:text-[#f5ede6] sm:max-w-2xl md:max-w-3xl">
        <header className="border-b border-[#eadbd8] bg-[#f7ebe8] px-6 pb-7 pt-9 dark:border-[#493b41] dark:bg-[#302329] sm:px-10 sm:pb-8 sm:pt-10">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b9435c] dark:text-[#ef8799]">
            <span>{projeto.tagEsquerda}</span>
            <span aria-hidden="true">·</span>
            <span>{projeto.tagDireita}</span>
            {detalhes?.periodo && <span className="text-[#8c7775] dark:text-[#baaaa8]">/ {detalhes.periodo}</span>}
          </div>
          <DialogTitle className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl">
            {projeto.titulo}
          </DialogTitle>
          {projeto.subtitulo && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#695d58] dark:text-[#c8b8b7] sm:text-base">{projeto.subtitulo}</p>
          )}
        </header>

        <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-8">
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {secoes.map(({ titulo, texto }) => (
              <section key={titulo} className="border-l-2 border-[#c85266]/50 pl-4 dark:border-[#ef8799]/50">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b9435c] dark:text-[#ef8799]">{titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4f4843] dark:text-[#d4c8c3] sm:text-[15px]">{texto}</p>
              </section>
            ))}
          </div>

          {(detalhes?.funcionalidadesAdmin || detalhes?.funcionalidadesUsuario) && (
            <section className="mt-9 border-t border-[#e9ded6] pt-7 dark:border-[#493b41]">
              <h3 className="font-serif text-2xl text-[#221f1e] dark:text-[#f5ede6]">Funcionalidades</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { titulo: 'Painel admin', itens: detalhes?.funcionalidadesAdmin },
                  { titulo: 'Painel usuário', itens: detalhes?.funcionalidadesUsuario },
                ].filter(({ itens }) => itens).map(({ titulo, itens }) => (
                  <div key={titulo} className="rounded-2xl border border-[#eadfd6] bg-white/65 p-5 dark:border-[#59454a] dark:bg-[#34272c]">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b9435c] dark:text-[#ef8799]">{titulo}</h4>
                    <ul className="mt-4 space-y-3 text-sm leading-5 text-[#4f4843] dark:text-[#d4c8c3]">
                      {itens.map((item) => (
                        <li key={item} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c85266] dark:bg-[#ef8799]" />{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {detalhes?.aplicacoes && (
            <section className="mt-9 border-t border-[#e9ded6] pt-7 dark:border-[#493b41]">
              <h3 className="font-serif text-2xl text-[#221f1e] dark:text-[#f5ede6]">Aplicações práticas</h3>
              <ul className="mt-4 divide-y divide-[#e9ded6] dark:divide-[#493b41]">
                {detalhes.aplicacoes.map((app) => (
                  <li key={app} className="flex gap-3 py-3 text-sm leading-6 text-[#4f4843] dark:text-[#d4c8c3]">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c85266] dark:bg-[#ef8799]" />{app}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(projeto.linkGithub || projeto.linkDeploy) && (
            <footer className="mt-8 flex flex-wrap gap-3 border-t border-[#e9ded6] pt-6 dark:border-[#493b41]">
              {projeto.linkGithub && (
                <a href={projeto.linkGithub} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-[#c85266] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad4861] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c85266]">
                  Ver código fonte ↗
                </a>
              )}
              {projeto.linkDeploy && (
                <a href={projeto.linkDeploy} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-[#c85266]/35 px-5 py-2.5 text-sm font-semibold text-[#b9435c] transition-colors hover:bg-[#c85266]/10 dark:text-[#ef8799]">
                  Visitar plataforma ↗
                </a>
              )}
            </footer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ArticlePreviewCard
