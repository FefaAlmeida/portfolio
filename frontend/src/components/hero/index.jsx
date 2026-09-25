import { ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="min-h-screen bg-[#f4eee1] text-[#221f1e] flex flex-col justify-between px-6 py-8 md:px-16 md:py-12 select-none">
      {/* 1. Título Principal (Serifado & Responsivo) */}
      <div className="my-auto py-12">
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[110px] leading-[0.95] tracking-tight font-normal text-[#221f1e]">
          Transformando aprendizado em <br className="hidden sm:block" />
          projetos e <span className="text-[#c85266]">conquistas.</span>
        </h1>
      </div>

      {/* 2. Navegação para o conteúdo */}
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button
          asChild
          className="group h-13 rounded-none border border-[#c85266] bg-[#c85266] px-6 text-[15px] font-medium text-white shadow-none hover:bg-[#b34356]"
        >
          <a href="#projetos">
            Ver projetos
            <ArrowDownRight className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="group h-13 rounded-none border-[#b9aa98] bg-transparent px-6 text-[15px] font-medium text-[#221f1e] shadow-none hover:border-[#c85266] hover:bg-[#c85266]/5 hover:text-[#c85266]"
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
