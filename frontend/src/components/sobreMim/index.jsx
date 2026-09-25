export default function About() {
  return (
    <section id="sobre" className="w-full bg-[#f4eee1] text-[#221f1e] px-6 py-16 md:px-16 md:py-24 select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
        
        {/* Lado Esquerdo: Foto em Círculo */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-2 border-[#d6cec0] shadow-sm">
            <img 
              src="/sua-foto.jpg" // Substitua pelo caminho da sua imagem
              alt="Fernanda Monteiro" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Lado Direito: Textos */}
        <div className="md:col-span-7 space-y-6">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#221f1e]">
            Sobre Mim
          </h2>

          <div className="space-y-4 text-base md:text-lg text-[#524b45] leading-relaxed font-sans">
            <p>
              Olá, sou a Fernanda Monteiro. Sou estudante do SENAI, apaixonada por tecnologia e design, e por resolver problemas do mundo real através da criatividade e código.
            </p>
            <p>
              Minha jornada no mundo digital começou com curiosidade e se transformou em projetos concretos. No SENAI, transformo teoria em prática, desenvolvendo habilidades técnicas sólidas em desenvolvimento web e sistemas.
            </p>
            <p>
              Além da sala de aula, busco expandir meus horizontes através de projetos extracurriculares desafiadores, onde aplico meus conhecimentos em contextos diversos. Minha dedicação e resultados foram reconhecidos com prêmios escolares que me motivam a continuar inovando.
            </p>
            <p>
              Este portfólio é uma janela para minha evolução, reunindo minha experiência, minhas conquistas e minha visão. Convido você a explorar meu trabalho e conhecer minha trajetória.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}