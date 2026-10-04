export const apiBase = () => process.env.API_URL || "http://127.0.0.1:3001";
export async function publicContent(kind, locale = "pt-BR") {
  const response = await fetch(
    `${apiBase()}/api/${kind}?locale=${encodeURIComponent(locale)}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) throw new Error("Conteúdo temporariamente indisponível.");
  return response.json();
}
