import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="min-h-screen bg-[#f4eee1] text-[#221f1e] flex flex-col justify-between px-6 py-8 md:px-16 md:py-12 select-none">
      
      {/* 1. Tag de Topo */}
      <div className="pt-4">
        <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#a38f7e] font-medium">
          Portfólio Pessoal · Estudante SENAI
        </span>
      </div>

      {/* 2. Título Principal (Serifado & Responsivo) */}
      <div className="my-auto py-12">
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[110px] leading-[0.95] tracking-tight font-normal text-[#221f1e]">
          Transformando aprendizado em <br className="hidden sm:block" />
          projetos e <span className="text-[#c85266]">conquistas.</span>
        </h1>
      </div>

      {/* 3. Seção Inferior: Descrição + Botões de Ação */}
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          
          {/* Subtítulo / Descrição */}
          <p className="text-base md:text-lg text-[#524b45] max-w-xl leading-relaxed font-sans">
            Estudante no SENAI apaixonada por aprender e criar. Reúno aqui meus
            projetos acadêmicos, experiências extracurriculares e os prêmios que marcam a minha trajetória.
          </p>

          {/* Chamadas para Ação (CTA) */}
          <div className="flex items-center gap-6 pt-2 sm:pt-0">
            {/* Botão Principal */}
            <Button 
              className="bg-[#c85266] hover:bg-[#b34356] text-white rounded-none px-7 py-6 text-base font-normal transition-colors"
            >
              Ver projetos
            </Button>

            {/* Link Estilizado */}
            <a 
              href="#premios" 
              className="text-[#221f1e] hover:text-[#c85266] text-base border-b border-[#221f1e] hover:border-[#c85266] pb-0.5 transition-colors"
            >
              Ver prêmios
            </a>
          </div>

        </div>

        {/* 4. Rodapé do Hero: Divisor + Informações do Portfólio */}
        <div className="pt-6 border-t border-[#e2dacb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#8c7e72]">
          <span>Portfólio Pessoal · Trajetória, Experiências & Prêmios</span>
          
          {/* Blocos de amostra de cor (Swatches) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 bg-[#221f1e]" title="Preto/Café" />
            <div className="w-8 h-3 bg-[#a66368]" title="Rosa Médio" />
            <div className="w-8 h-3 bg-[#c85266]" title="Vermelho Rosado" />
            <div className="w-8 h-3 bg-[#e8dece]" title="Creme Secundário" />
            <div className="w-8 h-3 bg-[#f8c2b8]" title="Rosa Claro" />
          </div>
        </div>
      </div>

    </section>
  )
}