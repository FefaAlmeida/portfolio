"use client";

import { ArrowUpRight, Award } from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
} from "@/components/portfolio/section";
import RichText from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { t } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";

function awardLogo(item) {
  if (item.imagemUrl) return item.imagemUrl;
  const institution = `${item.instituicao || ""} ${item.titulo}`;
  if (/letrus/i.test(institution)) return "/awards/logo-letrus.svg";
  if (/olitef|educação financeira|financial education/i.test(institution))
    return "/awards/logo-olitef.png";
  if (
    ["03", "06"].includes(item.id) ||
    /sesi|leitor destaque|destaque em redação|outstanding reader|outstanding writing/i.test(
      institution,
    )
  )
    return "/awards/logo-sesi.svg";
  return null;
}

export default function Premios({ premiosData = [], locale = "pt-BR" }) {
  const { ui } = useI18n();
  const m = t(locale);
  if (!premiosData.length) return null;
  return (
    <Section
      id="premios"
      className="bg-recognition pt-[52px] pb-14 md:pt-19 md:pb-[86px]"
      aria-labelledby="awards-title"
    >
      <Container>
        <SectionHeading
          id="awards-title"
          className="mb-[25px] md:mb-[34px] [&_p]:mt-3.5"
          title={ui("Reconhecimentos")}
          description={ui(
            "Conquistas em leitura, escrita e formação acadêmica.",
          )}
        />
        <ul className="grid grid-cols-1 gap-5 pt-1.5 pb-[18px] lg:grid-cols-3">
          {premiosData.map((item) => {
            const logo = awardLogo(item);
            return (
              <li key={item.id} className="min-w-0">
                <Card className="h-full min-h-[275px] gap-0 rounded-md border border-recognition-border bg-recognition-card p-6 ring-0 has-data-[slot=card-footer]:pb-6 md:min-h-[285px] md:px-[25px] md:pt-[26px] transition-colors hover:border-primary motion-reduce:transition-none">
                  <CardHeader className="mb-[25px] flex items-start justify-between gap-4 p-0">
                    <div className="flex h-18 w-35 items-center">
                      {logo ? (
                        // biome-ignore lint/performance/noImgElement: private draft images need the session request.
                        <img
                          src={logo}
                          alt={
                            logo === "/awards/logo-sesi.svg"
                              ? "SESI"
                              : item.instituicao || item.titulo
                          }
                          width={140}
                          height={72}
                          loading="lazy"
                          className="size-full object-contain object-left dark:rounded dark:bg-[#fcfaf6] dark:p-2"
                        />
                      ) : (
                        <Award
                          className="size-10 text-primary"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {item.ano && (
                      <time
                        dateTime={String(item.ano)}
                        className="pt-2 text-[11px] font-medium tracking-wider text-muted-foreground tabular-nums"
                      >
                        {item.ano}
                      </time>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <h3 className="font-serif text-[26px] leading-tight tracking-[-.04em]">
                      {item.titulo}
                    </h3>
                    <RichText
                      value={item.descricao}
                      className="mt-3.5 text-xs leading-[1.85] text-muted-foreground"
                    />
                  </CardContent>
                  <CardFooter className="mt-auto justify-end rounded-none border-0 bg-transparent p-0 pt-[26px]">
                    {item.credencialUrl ? (
                      <Button
                        asChild
                        variant="brand"
                        size="sm"
                        className="landing-action credential-action h-[30px] min-h-[29px] gap-1.5 rounded px-2 text-[10px] [&_svg]:size-2.5"
                      >
                        <a
                          href={item.credencialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={ui(
                            "Ver credencial: {0}{1} (abre em nova aba)",
                            {
                              0: item.titulo,
                              1: item.ano ? ` ${item.ano}` : "",
                            },
                          )}
                        >
                          {m.credential}
                          <ArrowUpRight aria-hidden="true" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="brand"
                        size="sm"
                        className="landing-action credential-action h-[30px] min-h-[29px] gap-1.5 rounded px-2 text-[10px] [&_svg]:size-2.5"
                        disabled
                        title={ui("Credencial ainda não disponível")}
                      >
                        {m.credential}
                        <ArrowUpRight aria-hidden="true" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
