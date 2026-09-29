"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";
import { rememberVisitorLocale, visitorLocaleUrl } from "@/i18n/visitor-locale";
import { cn } from "@/lib/utils";

const iconClass =
  "site-icon-button size-[38px] cursor-pointer rounded-full border-transparent bg-transparent p-0 text-[#524b45] shadow-none hover:bg-transparent hover:text-[#c85266] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c85266] dark:text-[#d0bfc2] dark:hover:text-[#ef8799] motion-reduce:transition-none";

const links = [
  { id: "inicio", label: "Início" },
  { id: "sobre", label: "Sobre" },
  { id: "projetos", label: "Projetos" },
  { id: "experiencias", label: "Experiência" },
  { id: "premios", label: "Prêmios" },
];

export default function Header({ locale = "pt-BR" }) {
  const { ui } = useI18n();
  const m = t(locale);
  const [activeSection, setActiveSection] = useState("inicio");
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollAnimation = useRef(0);

  useEffect(() => {
    const cancelScroll = () => cancelAnimationFrame(scrollAnimation.current);
    const cancelOnKey = (event) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
          "Escape",
          "Tab",
        ].includes(event.key)
      ) {
        cancelScroll();
      }
    };

    window.addEventListener("wheel", cancelScroll, { passive: true });
    window.addEventListener("touchstart", cancelScroll, { passive: true });
    window.addEventListener("pointerdown", cancelScroll, { passive: true });
    window.addEventListener("keydown", cancelOnKey);
    window.addEventListener("popstate", cancelScroll);

    return () => {
      cancelScroll();
      window.removeEventListener("wheel", cancelScroll);
      window.removeEventListener("touchstart", cancelScroll);
      window.removeEventListener("pointerdown", cancelScroll);
      window.removeEventListener("keydown", cancelOnKey);
      window.removeEventListener("popstate", cancelScroll);
    };
  }, []);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (!section) return;

    cancelAnimationFrame(scrollAnimation.current);
    setMenuOpen(false);

    const start = window.scrollY;
    const headerHeight =
      document.querySelector(".site-header-inner")?.getBoundingClientRect()
        .height ?? 72;
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const destination =
      id === "inicio"
        ? 0
        : section.getBoundingClientRect().top + start - headerHeight - 24;
    const target = Math.max(0, Math.min(destination, maxScroll));
    const distance = target - start;

    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, "", `#${id}`);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: target, behavior: "instant" });
      return;
    }

    const duration = Math.min(1800, Math.max(1000, Math.abs(distance) * 0.45));
    const startedAt = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      // Quintic easing keeps both departure and arrival gentle.
      const eased =
        progress < 0.5 ? 16 * progress ** 5 : 1 - (-2 * progress + 2) ** 5 / 2;
      window.scrollTo({ top: start + distance * eased, behavior: "instant" });
      if (progress < 1)
        scrollAnimation.current = requestAnimationFrame(animate);
    };
    scrollAnimation.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    let frame = 0;
    let floating = false;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hasScrolled = window.scrollY > (floating ? 24 : 72);
        floating = hasScrolled;
        setScrolled(hasScrolled);
        const threshold = window.innerHeight * 0.38;
        let current = "inicio";

        for (const link of links) {
          const section = document.getElementById(link.id);
          if (section && section.getBoundingClientRect().top <= threshold) {
            current = link.id;
          }
        }

        setActiveSection(current);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("portfolio-theme", nextDark ? "dark" : "light");
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
    setIsDark(nextDark);
  };

  const navLinks = (mobile = false) =>
    links.map(({ id, label }) => (
      <a
        key={id}
        href={`#${id}`}
        aria-current={activeSection === id ? "location" : undefined}
        onClick={(event) => {
          if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          )
            return;
          event.preventDefault();
          scrollToSection(id);
        }}
        className={cn(
          "nav-link inline-flex min-h-[38px] items-center justify-center rounded-[14px] px-2.5 py-2 text-sm font-medium text-[#524b45] transition duration-300 hover:-translate-y-px hover:text-[#c85266] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c85266] dark:text-[#d0bfc2] dark:hover:text-[#ef8799] motion-reduce:transition-none",
          activeSection === id &&
            "nav-link-active text-[#b9435c] dark:text-[#ef8799]",
          mobile && "nav-link-mobile w-full justify-start px-4",
        )}
      >
        {m.nav[links.findIndex((item) => item.id === id)] || label}
      </a>
    ));

  return (
    <header
      className={cn(
        "site-header fixed inset-x-0 top-0 z-50 text-[#221f1e] dark:text-[#f5ede6]",
        scrolled && "site-header-scrolled",
      )}
    >
      <div
        className={cn(
          "site-header-inner flex min-h-[72px] items-center justify-between gap-[18px] bg-[#f4eee1] px-[clamp(20px,4vw,64px)] py-2 transition-[background-color,backdrop-filter] duration-[420ms] dark:bg-[#231c20] max-[420px]:min-h-[60px] max-[420px]:px-4 motion-reduce:transition-none",
          scrolled &&
            "bg-[#f4eee1]/84 backdrop-blur-[20px] dark:bg-[#231c20]/84",
        )}
      >
        <button
          type="button"
          className="site-logo relative inline-flex h-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent px-1 text-black dark:text-[#f5ede6] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c85266] max-[420px]:h-11"
          aria-label={ui("Fernanda — voltar ao início")}
          onClick={() => scrollToSection("inicio")}
        >
          <span
            className="site-logo-name block whitespace-nowrap font-serif text-[28px] leading-none font-normal tracking-[-.06em] max-[420px]:text-[22px]"
            aria-hidden="true"
          >
            Fernanda<span className="text-primary">.</span>
          </span>
        </button>

        <div className="site-header-actions flex items-center">
          <Button asChild variant="ghost" className={iconClass}>
            <a
              href={locale === "en-US" ? "/" : "/en"}
              onClick={event => {
                const next = locale === "en-US" ? "pt-BR" : "en-US";
                rememberVisitorLocale(next);
                if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                  event.preventDefault(); location.assign(visitorLocaleUrl(next));
                }
              }}
              hrefLang={locale === "en-US" ? "pt-BR" : "en-US"}
              aria-label={
                locale === "en-US"
                  ? ui("Versão em português")
                  : ui("English version")
              }
            >
              {locale === "en-US" ? "PT" : "EN"}
            </a>
          </Button>
          <Button
            type="button"
            onClick={toggleTheme}
            variant="ghost"
            className={cn(
              iconClass,
              "site-theme-button text-[#231c20] hover:text-[#231c20] dark:text-[#f4eee1] dark:hover:text-[#f4eee1]",
            )}
            aria-label={
              isDark ? ui("Ativar modo claro") : ui("Ativar modo escuro")
            }
            title={isDark ? ui("Ativar modo claro") : ui("Ativar modo escuro")}
          >
            {isDark ? (
              <Sun
                size={21}
                className="size-[21px]"
                fill="currentColor"
                aria-hidden="true"
              />
            ) : (
              <Moon
                size={21}
                className="size-[21px]"
                fill="currentColor"
                aria-hidden="true"
              />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(iconClass, "site-menu-button min-[1001px]:hidden")}
            aria-label={menuOpen ? ui("Fechar menu") : ui("Abrir menu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X size={21} className="size-[21px]" aria-hidden="true" />
            ) : (
              <Menu size={21} className="size-[21px]" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      <nav
        className="site-nav-desktop fixed top-4 left-1/2 z-[1] flex -translate-x-1/2 scale-[.98] items-center gap-[3px] rounded-[22px] border border-transparent px-1 whitespace-nowrap max-[1000px]:hidden"
        aria-label={ui("Seções do portfólio")}
      >
        <div className="site-nav-links flex min-w-0 items-center gap-4">
          {navLinks()}
        </div>
      </nav>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="site-nav-mobile flex flex-col bg-[#f4eee1] px-4 pt-2 pb-3.5 shadow-[0_12px_18px_#281d1a0f] min-[1001px]:hidden dark:bg-[#231c20]"
          aria-label={ui("Seções do portfólio")}
        >
          {navLinks(true)}
        </nav>
      )}
    </header>
  );
}
