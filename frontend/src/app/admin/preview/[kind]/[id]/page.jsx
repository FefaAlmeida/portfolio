import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ArticlePreviewCard from "@/components/card";
import Experiencias from "@/components/experiencia";
import Premios from "@/components/premios";
import { formatMessage } from "@/i18n/format";
import { I18nProvider } from "@/i18n/provider";
import { apiBase } from "@/lib/api";
export const dynamic = "force-dynamic";
export default async function Preview({ params, searchParams }) {
  const { kind, id } = await params;
  const locale =
    (await searchParams).locale ||
    (await headers()).get("x-portfolio-locale") ||
    "pt-BR";
  const ui = (text) => formatMessage(locale, text);
  if (!["projetos", "experiencias", "premios"].includes(kind)) notFound();
  const response = await fetch(
    `${apiBase()}/api/admin/${kind}/${encodeURIComponent(id)}`,
    { cache: "no-store", headers: { cookie: (await cookies()).toString() } },
  );
  if (response.status === 401) redirect("/admin");
  if (!response.ok) notFound();
  const row = await response.json();
  const draft = row.draftByLocale?.[locale] || row.draft;
  const item = {
    ...draft,
    imagemBg: row.imagemBg,
    id,
    imagemUrl: draft.imagemId ? `/api/media/${draft.imagemId}` : "",
    credencialUrl: draft.credencialId
      ? `/api/media/${draft.credencialId}`
      : draft.credencialUrl,
  };
  return (
    <I18nProvider locale={locale}>
      <header className="admin-preview-header">
        <Link href="/admin">{ui("← Voltar ao painel")}</Link>
        <h1>{ui("Prévia do rascunho")}</h1>
        <p>{ui("Somente você pode ver esta versão.")}</p>
      </header>
      {kind === "projetos" && (
        <div className="mx-auto max-w-xl p-6">
          <p className="mb-4">
            {ui("Clique no card para conferir os detalhes.")}
          </p>
          <ArticlePreviewCard projeto={item} locale={locale} />
        </div>
      )}
      {kind === "experiencias" && <Experiencias experiencias={[item]} />}
      {kind === "premios" && <Premios premiosData={[item]} locale={locale} />}
    </I18nProvider>
  );
}
