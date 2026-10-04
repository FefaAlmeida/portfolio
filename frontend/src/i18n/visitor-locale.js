export const VISITOR_LOCALE_KEY = "portfolio-visitor-locale";
const YEAR_SECONDS = 31536000;
export function rememberVisitorLocale(locale) {
  try {
    localStorage.setItem(
      VISITOR_LOCALE_KEY,
      JSON.stringify({ locale, expiresAt: Date.now() + YEAR_SECONDS * 1000 }),
    );
  } catch {}
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store is not available in all supported browsers.
    document.cookie = `${VISITOR_LOCALE_KEY}=${locale}; Path=/; SameSite=Lax; Max-Age=${YEAR_SECONDS}${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {}
}
export function readVisitorLocale() {
  try {
    const cookie = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${VISITOR_LOCALE_KEY}=`))
      ?.split("=")[1];
    if (["pt-BR", "en-US"].includes(cookie)) return cookie;
  } catch {}
  try {
    const saved = JSON.parse(localStorage.getItem(VISITOR_LOCALE_KEY));
    if (
      saved?.expiresAt > Date.now() &&
      ["pt-BR", "en-US"].includes(saved.locale)
    )
      return saved.locale;
    localStorage.removeItem(VISITOR_LOCALE_KEY);
  } catch {}
  return null;
}
export function visitorLocaleUrl(locale) {
  return `${locale === "en-US" ? "/en" : "/"}${location.search}${location.hash}`;
}
