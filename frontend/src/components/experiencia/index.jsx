import { EXPERIENCIAS } from "@/data/experiencias";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const navigationButtonClass =
  "pointer-events-auto static h-12 w-12 cursor-pointer border border-[#dfd0c7] bg-[#fbf7f0] text-[#221f1e] shadow-md transition-colors hover:border-[#c85266] hover:bg-[#c85266] hover:text-white disabled:border-[#dfd0c7] disabled:bg-[#fbf7f0]/75 disabled:text-[#8a7c75] disabled:opacity-65 dark:border-[#6a5158] dark:bg-[#34272c] dark:text-[#f5ede6] dark:hover:border-[#ef8799] dark:hover:bg-[#bd536b] dark:hover:text-white dark:disabled:border-[#59454a] dark:disabled:bg-[#34272c] dark:disabled:text-[#a99599]";

export default function Experiencias() {
  return (
    <section
      id="experiencias"
      className="w-full overflow-hidden border-t border-[#e2dacb] bg-[#f4eee1] px-5 py-20 font-[family-name:var(--font-geist-sans)] text-[#221f1e] dark:border-[#493b41] dark:bg-[#231c20] dark:text-[#f5ede6] sm:px-10 md:px-14"
    >
      <div className="max-w-7xl mx-auto">
        <Carousel className="w-full" aria-label="Projetos extracurriculares">
          <div className="mb-9 border-b border-[#e2dacb] pb-8 dark:border-[#493b41]">
            <h2 className="break-words font-serif text-3xl font-normal leading-tight tracking-tight text-[#221f1e] dark:text-[#f5ede6] sm:text-4xl lg:text-5xl">
              Projetos Extracurriculares
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#62554f] dark:text-[#c8b8b7] sm:text-base">
              Iniciativas de liderança, trabalho voluntário, docência e
              jornalismo jovem em que desempenhei papéis ativos de impacto
              social e comunitário.
            </p>
          </div>

          <div className="relative sm:px-12">
            <CarouselContent className="-ml-4">
              {EXPERIENCIAS.map((item, index) => (
                <CarouselItem key={item.id} className="pl-4">
                  <article className="grid items-start gap-8 pb-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
                    <div>
                      <div className="relative h-[330px] w-full overflow-hidden rounded-2xl border border-[#e2dacb] bg-[#e2dacb] shadow-[0_16px_36px_rgba(40,29,26,0.12)] dark:border-[#493b41] dark:bg-[#493b41] sm:h-[420px] lg:h-[450px]">
                        <img
                          src={item.imagemUrl}
                          alt={`Imagem do projeto ${item.titulo}`}
                          className="h-full w-full object-cover select-none"
                          draggable="false"
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#221f1e]/50 to-transparent"
                          aria-hidden="true"
                        />
                        <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-[#221f1e]/85 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                          {item.periodo}
                        </div>
                        <span
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#221f1e]/70 px-3 py-1 font-mono text-xs tracking-widest text-white backdrop-blur-sm"
                          aria-label={`Projeto ${index + 1} de ${EXPERIENCIAS.length}`}
                        >
                          {String(index + 1).padStart(2, "0")} /{" "}
                          {String(EXPERIENCIAS.length).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#dfd0c7] bg-[#fbf7f0]/80 px-3 py-1 text-[11px] font-medium text-[#62554f] dark:border-[#59454a] dark:bg-[#34272c] dark:text-[#d4c3c4]"
                          >
                            {tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0 lg:pt-4">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ad5268] dark:text-[#ef8799]">
                        {item.categoria}
                      </span>
                      <h3 className="mt-3 font-serif text-4xl font-normal leading-tight tracking-tight text-[#221f1e] dark:text-[#f5ede6] sm:text-5xl">
                        {item.titulo}
                      </h3>
                      <p className="mt-3 inline-flex rounded-full bg-[#c85266]/10 px-3 py-1.5 text-xs font-semibold text-[#a94158] dark:bg-[#ef8799]/15 dark:text-[#ef8799]">
                        {item.papel}
                      </p>
                      <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#524b45] dark:text-[#d3c4c2]">
                        {item.descricao}
                      </p>

                      <div className="mt-7 border-t border-[#e2dacb] pt-5 dark:border-[#493b41]">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ad5268] dark:text-[#ef8799]">
                          Impacto & resultados
                        </h4>
                        <dl className="mt-3 divide-y divide-[#e2dacb] dark:divide-[#493b41]">
                          {[
                            {
                              label: "Realização",
                              value: item.impactoXYZ?.realizacao,
                            },
                            {
                              label: "Métricas & alcance",
                              value: item.impactoXYZ?.metrica,
                            },
                            {
                              label: "Atuação & métodos",
                              value: item.impactoXYZ?.metodo,
                            },
                          ]
                            .filter(({ value }) => value)
                            .map(({ label, value }) => (
                              <div
                                key={label}
                                className="grid gap-1 py-3.5 sm:grid-cols-[125px_minmax(0,1fr)] sm:gap-4"
                              >
                                <dt className="text-xs font-semibold text-[#a94158] dark:text-[#ef8799]">
                                  {label}
                                </dt>
                                <dd className="text-sm leading-6 text-[#524b45] dark:text-[#d3c4c2]">
                                  {value}
                                </dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="pointer-events-none absolute -left-3 -right-3 top-[165px] z-10 flex -translate-y-1/2 items-center justify-between sm:top-[210px] lg:top-[225px]">
              <CarouselPrevious
                aria-label="Projeto anterior"
                className={navigationButtonClass}
              />
              <CarouselNext
                aria-label="Próximo projeto"
                className={navigationButtonClass}
              />
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
