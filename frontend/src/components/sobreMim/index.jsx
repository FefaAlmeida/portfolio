import BubbleField from "@/components/bubble-field";

export default function About() {
  return (
    <section
      id="sobre"
      className="relative w-full overflow-hidden bg-[#f4eee1] dark:bg-[#231c20] text-[#221f1e] dark:text-[#f5ede6] px-6 py-16 md:px-16 md:py-24 select-none"
    >
      <BubbleField />

      <div className="relative z-20 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
        {/* Lado Esquerdo: Foto em Círculo */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-2 border-[#d6cec0] dark:border-[#5b484e] shadow-sm">
            <img
              src="/foto_perfil.jpeg" // Substitua pelo caminho da sua imagem
              alt="Fernanda Monteiro"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Lado Direito: Textos */}
        <div className="md:col-span-7">
          <h2 className="max-w-2xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.025em] text-[#221f1e] dark:text-[#f5ede6] sm:text-5xl lg:text-6xl">
            Entre <span className="italic text-[#c85266] dark:text-[#ef8799]">código</span>, design
            e novas ideias.
          </h2>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#38322f] dark:text-[#e2d3cf] md:text-xl">
            Oie, sou{" "}
            <strong className="font-semibold">Fernanda Monteiro</strong>,
            estudante do SESI 222 e do SENAI São Caetano do Sul, onde curso Desenvolvimento de Sistemas. Minha curiosidade me leva a buscar novos conhecimentos e, principalmente, a entender como eles podem ser transformados em algo concreto. Gosto de pensar em soluções criativas para problemas reais, especialmente quando podem facilitar a vida, ajudar alguém ou transformar uma realidade.
          </p>

          <div className="mt-5 max-w-2xl space-y-5 text-lg leading-relaxed text-[#38322f] dark:text-[#e2d3cf] md:text-xl">
            <p>
              É no SENAI que encontro espaço para colocar essa vontade em prática. Ao desenvolver projetos de sistemas e aplicações web, transformo o que aprendo em experiências concretas, testando ideias, enfrentando desafios e descobrindo novas formas de solucionar problemas.
            </p>

            <p>
              Essa busca por aprender e criar também ultrapassa a tecnologia. Por meio de projetos extracurriculares e experiências escolares, tenho contato com diferentes pessoas, ideias e realidades, o que alimenta minha vontade de continuar aprendendo e usar aquilo que aprendo para contribuir com as pessoas ao meu redor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
