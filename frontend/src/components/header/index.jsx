import * as React from "react"
import { Moon } from "lucide-react"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"

export default function Header() {
  return (
    <header className="w-full bg-[#f4eee1] px-6 py-4 flex items-center justify-between text-[#221f1e] border-b border-[#e2dacb] select-none">
      
      {/* Logótipo */}
      <a href="#" className="font-serif text-2xl font-bold hover:opacity-80 transition-opacity">
        Fernanda Monteiro.
      </a>

      {/* Menu de Navegação */}
      <Menubar className="hidden md:flex border-none bg-transparent shadow-none gap-2">
        <MenubarMenu>
          <MenubarTrigger className="text-[15px] text-[#524b45] hover:text-[#221f1e] cursor-pointer">
            <a href="#projetos">Projetos</a>
          </MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-[15px] text-[#524b45] hover:text-[#221f1e] cursor-pointer">
            <a href="#experiencia">Experiência</a>
          </MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-[15px] text-[#524b45] hover:text-[#221f1e] cursor-pointer">
            <a href="#premios">Prêmios</a>
          </MenubarTrigger>
        </MenubarMenu>
        
        <MenubarMenu>
          <MenubarTrigger className="text-[15px] text-[#524b45] hover:text-[#221f1e] cursor-pointer">
            <a href="#sobre">Sobre</a>
          </MenubarTrigger>
        </MenubarMenu>
        
        <MenubarMenu>
          <MenubarTrigger className="text-[15px] text-[#524b45] hover:text-[#221f1e] cursor-pointer">
            <a href="#contato">Contato</a>
          </MenubarTrigger>
        </MenubarMenu>
      </Menubar>

      {/* Botão de Modo Noturno */}
      <button 
        aria-label="Alternar modo noturno"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#524b45] border border-[#d6cec0] rounded-sm hover:bg-[#e8dece] hover:text-[#221f1e] transition-colors cursor-pointer"
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Modo Noturno</span>
      </button>

    </header>
  )
}