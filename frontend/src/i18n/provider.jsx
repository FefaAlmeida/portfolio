"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { formatMessage } from "./format";

const Context = createContext({ locale: "pt-BR", setLocale: () => {} });
export function I18nProvider({
  locale: initialLocale = "pt-BR",
  children,
  root = false,
  admin = false,
}) {
  const [locale, setLocale] = useState(initialLocale);
  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);
  useEffect(() => {
    if (!root) return;
    document.documentElement.lang = locale;
    if (admin) {
      document.cookie = `portfolio-admin-locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
      document.title = formatMessage(locale, "Administração | Portfólio");
    }
  }, [locale, root, admin]);
  return (
    <Context.Provider value={{ locale, setLocale }}>
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  const { locale, setLocale } = useContext(Context);
  return {
    locale,
    setLocale,
    ui: (source, values) => formatMessage(locale, source, values),
  };
}
