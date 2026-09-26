import React from 'react'

export default function Premios({ premiosData }) {
  const listaPremios = premiosData || [
    {
      id: '01',
      categoria: 'REDAÇÃO',
      titulo: 'Desempenho Letrus',
      descricao: 'Certificado de reconhecimento pelo excelente desempenho nas produções textuais da plataforma Letrus em 2025.'
    },
    {
      id: '02',
      categoria: 'REDAÇÃO',
      titulo: 'Desempenho Letrus',
      descricao: 'Certificado de reconhecimento pelo desempenho de destaque nas redações da plataforma Letrus em 2024.'
    },
    {
      id: '03',
      categoria: 'REDAÇÃO',
      titulo: 'Destaque em Redação',
      descricao: 'Certificado de destaque pela participação ativa e evolução técnica em escrita e redação em 2023.'
    },
    {
      id: '04',
      categoria: 'ACADÊMICO',
      titulo: 'Destaque Avalia SESI',
      descricao: 'Reconhecimento como estudante destaque na avaliação de desempenho do SESI.'
    },
    {
      id: '05',
      categoria: 'OLIMPÍADA',
      titulo: 'Medalha de Bronze OLITEF',
      descricao: 'Premiação com medalha de bronze na Olimpíada de Educação Financeira.'
    },
    {
      id: '06',
      categoria: 'CULTURA',
      titulo: 'Leitor Destaque',
      descricao: 'Certificado de leitor destaque concedido pela biblioteca escolar.'
    }
  ]

  return (
    /* FUNDO ROSA CLARINHO (#f8e1e7) COM TEXTOS EM TOM ESCURO (#221f1e) */
    <section id="premios" className="w-full bg-[#f8e1e7] dark:bg-[#30222a] text-[#221f1e] dark:text-[#f5ede6] py-20 px-4 sm:px-8 md:px-12 select-none overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#ebcad2] dark:border-[#674650] pb-8">
          <div className="space-y-2">
            <span className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#c85266] dark:text-[#ef8799] font-semibold block">
              05 · RECONHECIMENTOS
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#221f1e] dark:text-[#f5ede6] tracking-tight">
              Prêmios e Conquistas
            </h2>
          </div>
        </div>

        {/* GRID DE CARDS COM BORDAS EM ROSA SUAVE E HOVER LEVE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#ebcad2] dark:border-[#674650]">
          {listaPremios.map((item) => (
            <div
              key={item.id}
              className="group border-b border-r border-[#ebcad2] dark:border-[#674650] p-8 sm:p-10 flex flex-col justify-between space-y-6 hover:bg-[#f3d3dc] dark:hover:bg-[#432e38] transition-colors duration-300 min-h-[220px]"
            >
              {/* CATEGORIA / NÚMERO EM ROSA DESTAQUE */}
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c85266] dark:text-[#ef8799] block">
                {item.id} · {item.categoria}
              </span>

              {/* TÍTULO E DESCRIÇÃO */}
              <div className="space-y-3 my-auto">
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#221f1e] dark:text-[#f5ede6] group-hover:translate-x-1 group-hover:text-[#c85266] dark:group-hover:text-[#ef8799] transition-all duration-300 leading-snug">
                  {item.titulo}
                </h3>
                <p className="text-xs sm:text-sm font-sans leading-relaxed text-[#524b45] dark:text-[#c8b8b7] font-normal">
                  {item.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}