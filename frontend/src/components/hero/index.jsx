import { ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BubbleField from "@/components/bubble-field";

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden min-h-screen bg-[#f4eee1] dark:bg-[#231c20] text-[#221f1e] dark:text-[#f5ede6] flex flex-col justify-between px-6 pb-8 pt-28 md:px-16 md:pb-12 md:pt-32 select-none">
      <BubbleField />

      {/* 1. Título Principal (Serifado & Responsivo) */}
      <div className="relative z-10 my-auto py-12">
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[110px] leading-[0.95] tracking-tight font-normal text-[#221f1e] dark:text-[#f5ede6]">
          Transformando aprendizado em <br className="hidden sm:block" />
          projetos e <span className="text-[#c85266] dark:text-[#ef8799]">conquistas.</span>
        </h1>
      </div>

      {/* 2. Navegação para o conteúdo */}
      <div className="relative z-10 flex flex-col justify-end gap-3 sm:flex-row">
        <Button
          asChild
          className="group h-13 rounded-none border border-[#c85266] dark:border-[#ef8799] bg-[#c85266] dark:bg-[#bd536b] px-6 text-[15px] font-medium text-white shadow-none hover:bg-[#b34356] dark:hover:bg-[#a94058]"
        >
          <a href="#projetos">
            Ver projetos
            <ArrowDownRight className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="group h-13 rounded-none border-[#b9aa98] dark:border-[#735962] bg-transparent px-6 text-[15px] font-medium text-[#221f1e] dark:text-[#f5ede6] shadow-none hover:border-[#c85266] dark:hover:border-[#ef8799] hover:bg-[#c85266]/5 dark:hover:bg-[#ef8799]/10 hover:text-[#c85266] dark:hover:text-[#ef8799]"
        >
          <a href="#premios">
            Ver prêmios
            <ArrowDownRight className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </a>
        </Button>
      </div>
    </section>
  );
}
