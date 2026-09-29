"use client";
import { ArrowUpRight, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMessage } from "@/i18n/format";
import {
  readVisitorLocale,
  rememberVisitorLocale,
  visitorLocaleUrl,
} from "@/i18n/visitor-locale";

export default function VisitorLanguageDialog() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("pt-BR");
  const [confirmed, setConfirmed] = useState(false);
  const ui = (text) => formatMessage(selected, text);
  useEffect(() => {
    if (!["/", "/en"].includes(pathname) || confirmed) return;
    const saved = readVisitorLocale();
    if (saved) {
      if (pathname === "/" && saved === "en-US")
        location.replace(visitorLocaleUrl(saved));
      return;
    }
    const preferred = (navigator.languages || [navigator.language]).find(
      (value) => /^(pt|en)(-|$)/i.test(value),
    );
    setSelected(/^en/i.test(preferred || "") ? "en-US" : "pt-BR");
    setOpen(true);
  }, [pathname, confirmed]);
  function confirm() {
    rememberVisitorLocale(selected);
    setConfirmed(true);
    setOpen(false);
    if (pathname !== (selected === "en-US" ? "/en" : "/"))
      location.replace(visitorLocaleUrl(selected));
  }
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-[#a38f7e]/20 bg-[#fcfaf6] p-7 text-[#302729] shadow-2xl sm:max-w-[510px] sm:p-10 dark:bg-[#231c20] dark:text-[#f5ede6]"
      >
        <span className="font-serif text-3xl tracking-tight">
          Fernanda Gabriela
        </span>
        <DialogTitle className="mt-5 min-h-20 font-serif text-4xl font-normal leading-tight">
          {ui("Qual idioma você prefere?")}
        </DialogTitle>
        <DialogDescription className="text-[#716469] dark:text-[#d0bfc2]">
          {ui(
            "Escolha como deseja conhecer meu trabalho. Você pode mudar depois no menu.",
          )}
        </DialogDescription>
        <div
          role="radiogroup"
          aria-label={ui("Idioma do site")}
          className="my-4 grid gap-3"
        >
          {[
            ["pt-BR", "Português", "Brasil"],
            ["en-US", "English", "Estados Unidos"],
          ].map(([locale, label, region]) => (
            <label
              key={locale}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition-colors ${selected === locale ? "border-[#c85266] bg-[#c85266]/10" : "border-[#a38f7e]/30"}`}
            >
              <input
                className="size-4 accent-[#c85266]"
                type="radio"
                name="visitor-language"
                value={locale}
                checked={selected === locale}
                onChange={() => setSelected(locale)}
              />
              <span className="flex-1">
                <span className="block text-lg">{label}</span>
                <span className="text-sm opacity-70">{ui(region)}</span>
              </span>
              {selected === locale && (
                <Check className="size-5 text-[#c85266]" aria-hidden="true" />
              )}
            </label>
          ))}
        </div>
        <Button
          onClick={confirm}
          className="min-h-12 justify-between rounded-xl bg-[#a94158] px-5 text-white hover:bg-[#91364b]"
        >
          {ui("Continuar neste idioma")}
          <ArrowUpRight aria-hidden="true" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
