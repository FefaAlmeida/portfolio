import BubbleField from "@/components/bubble-field";

export default function About() {
  return (
    <section
      id="sobre"
      className="relative w-full overflow-hidden bg-[#f4eee1] text-[#221f1e] px-6 py-16 md:px-16 md:py-24 select-none"
    >
      <BubbleField />

      <div className="relative z-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
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
        <div className="md:col-span-7">
          <h2 className="max-w-2xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.025em] text-[#221f1e] sm:text-5xl lg:text-6xl">
            Entre <span className="italic text-[#c85266]">código</span>, design
            e novas ideias.
          </h2>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#38322f] md:text-xl">
            Olá, sou{" "}
            <strong className="font-semibold">Fernanda Monteiro</strong>,
            estudante do SENAI movida pela curiosidade e pela vontade de
            transformar problemas reais em soluções criativas.
          </p>

          <div className="mt-5 max-w-2xl space-y-5 text-lg leading-relaxed text-[#38322f] md:text-xl">
            <p>
              No SENAI, transformo teoria em prática enquanto desenvolvo
              habilidades em desenvolvimento web e sistemas. Cada projeto é uma
              oportunidade de experimentar, aprender e dar forma a novas ideias.
            </p>

            <p>
              Também busco ir além da sala de aula. Projetos extracurriculares e
              conquistas escolares ampliam meu olhar e alimentam minha vontade
              de continuar evoluindo e inovando.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
