"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/portfolio/section";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { rememberVisitorLocale } from "@/i18n/visitor-locale";
import { portfolioSections as links } from "@/lib/sections";
import { cn } from "@/lib/utils";

const iconClass =
  "site-icon-button size-[38px] cursor-pointer rounded-full border-transparent bg-transparent p-0 text-[#524b45] shadow-none hover:bg-transparent hover:text-[#c85266] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c85266] dark:text-[#d0bfc2] dark:hover:text-[#ef8799] motion-reduce:transition-none";

export default function Header({ locale = "pt-BR" }) {
  const { ui, navigateLocale } = useI18n();
  const [activeSection, setActiveSection] = useState("inicio");
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollAnimation = useRef(0);
  const reduceMotion = useReducedMotion();
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const bodyOverflow = document.body.style.overflow;
    const main = document.querySelector("main");
    const wasInert = main?.inert;
    document.body.style.overflow = "hidden";
    if (main) main.inert = true;

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key !== "Tab") return;
      const controls = headerRef.current?.querySelectorAll("a[href], button");
      const visible = [...(controls || [])].filter(
        (control) =>
          control.getClientRects().length > 0 && !control.closest("[inert]"),
      );
      const first = visible[0];
      const last = visible.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1001px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = bodyOverflow;
      if (main) main.inert = wasInert;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

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
          mobile &&
            "nav-link-mobile w-full justify-center px-4 py-3 text-center font-serif text-[clamp(2rem,5.5vw,3.5rem)] leading-tight font-normal tracking-tight",
        )}
      >
        {ui(label)}
      </a>
    ));

  const preferenceControls = (
    <>
      <Button asChild variant="ghost" className={iconClass}>
        <a
          href={locale === "en-US" ? "/" : "/en"}
          onClick={(event) => {
            const next = locale === "en-US" ? "pt-BR" : "en-US";
            rememberVisitorLocale(next);
            if (
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              navigateLocale(next);
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
        aria-label={isDark ? ui("Ativar modo claro") : ui("Ativar modo escuro")}
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
    </>
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        "site-header fixed inset-x-0 top-0 z-50 text-[#221f1e] dark:text-[#f5ede6]",
        scrolled && "site-header-scrolled",
      )}
    >
      <div
        className={cn(
          "site-header-inner relative z-10 shrink-0 bg-[#f4eee1] px-6 md:px-8 lg:px-20 py-2 transition-[background-color,backdrop-filter] duration-[420ms] dark:bg-[#231c20] motion-reduce:transition-none",
          scrolled &&
            "bg-[#f4eee1]/84 backdrop-blur-[20px] dark:bg-[#231c20]/84",
          menuOpen &&
            "max-[1000px]:relative max-[1000px]:z-10 max-[1000px]:bg-transparent max-[1000px]:backdrop-blur-none dark:max-[1000px]:bg-transparent",
        )}
      >
        <Container className="flex min-h-14 items-center justify-between gap-[18px] max-[420px]:min-h-11">
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
            <div
              inert={menuOpen}
              aria-hidden={menuOpen}
              className={cn(
                "flex items-center transition-opacity duration-200 motion-reduce:transition-none",
                menuOpen
                  ? "pointer-events-none opacity-0"
                  : "opacity-100 delay-100",
              )}
            >
              {preferenceControls}
            </div>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                iconClass,
                "site-menu-button aria-expanded:bg-transparent dark:hover:bg-transparent min-[1001px]:hidden",
              )}
              ref={menuButtonRef}
              aria-label={menuOpen ? ui("Fechar menu") : ui("Abrir menu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="relative size-[21px]" aria-hidden="true">
                <Menu
                  strokeWidth={3.5}
                  className={cn(
                    "absolute inset-0 size-[21px] transition-[opacity,transform] duration-200 motion-reduce:transition-none",
                    menuOpen
                      ? "rotate-45 scale-75 opacity-0"
                      : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  strokeWidth={3.5}
                  className={cn(
                    "absolute inset-0 size-[21px] transition-[opacity,transform] duration-200 motion-reduce:transition-none",
                    menuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-45 scale-75 opacity-0",
                  )}
                />
              </span>
            </Button>
          </div>
        </Container>
      </div>

      <nav
        className="site-nav-desktop fixed top-4 left-1/2 z-20 flex -translate-x-1/2 scale-[.98] items-center gap-[3px] rounded-[22px] border border-transparent px-1 whitespace-nowrap max-[1000px]:hidden"
        aria-label={ui("Seções do portfólio")}
      >
        <div className="site-nav-links flex min-w-0 items-center gap-4">
          {navLinks()}
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.nav
            key="mobile-menu"
            id="mobile-navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: "easeInOut",
            }}
            className="site-nav-mobile fixed inset-0 flex h-dvh flex-col overflow-y-auto overscroll-contain bg-[#f4eee1]/75 px-6 py-[max(88px,env(safe-area-inset-bottom))] backdrop-blur-[20px] min-[1001px]:hidden dark:bg-[#231c20]/75"
            aria-label={ui("Seções do portfólio")}
          >
            <motion.div
              initial={{ y: reduceMotion ? 0 : 10 }}
              animate={{ y: 0 }}
              exit={{ y: reduceMotion ? 0 : 6 }}
              transition={{
                duration: reduceMotion ? 0 : 0.28,
                ease: "easeOut",
              }}
              className="my-auto flex w-full shrink-0 flex-col items-center gap-2 sm:gap-4"
            >
              {navLinks(true)}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
