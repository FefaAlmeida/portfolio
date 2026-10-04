"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { formatMessage } from "./format";
import { visitorLocaleUrl } from "./visitor-locale";

const Context = createContext({ locale: "pt-BR", setLocale: () => {} });
export function I18nProvider({
  locale: initialLocale = "pt-BR",
  children,
  root = false,
  admin = false,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pendingUrl = useRef(null);
  const [selectedLocale, setLocale] = useState(initialLocale);
  const locale =
    root && !admin ? (pathname === "/en" ? "en-US" : "pt-BR") : selectedLocale;
  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);
  useEffect(() => {
    const target = pendingUrl.current;
    if (!target || new URL(target, location.origin).pathname !== pathname)
      return;
    pendingUrl.current = null;
    // Next can append the hash twice when revisiting the initially cached route.
    // Keep the exact URL requested by the language switch without adding history.
    if (`${location.pathname}${location.search}${location.hash}` !== target) {
      window.history.replaceState(window.history.state, "", target);
    }
  }, [pathname]);
  function navigateLocale(nextLocale, { replace = false } = {}) {
    const target = visitorLocaleUrl(nextLocale);
    pendingUrl.current = target;
    if (replace) router.replace(target, { scroll: false });
    else router.push(target, { scroll: false });
  }
  useEffect(() => {
    if (!root) return;
    document.documentElement.lang = locale;
    if (admin) {
      document.cookie = `portfolio-admin-locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
      document.title = formatMessage(locale, "Administração | Portfólio");
    }
  }, [locale, root, admin]);
  return (
    <Context.Provider value={{ locale, setLocale, navigateLocale }}>
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  const { locale, setLocale, navigateLocale } = useContext(Context);
  return {
    locale,
    setLocale,
    navigateLocale,
    ui: (source, values) => formatMessage(locale, source, values),
  };
}
