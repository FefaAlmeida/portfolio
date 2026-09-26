"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { id: "inicio", label: "Início" },
  { id: "sobre", label: "Sobre" },
  { id: "projetos", label: "Projetos" },
  { id: "experiencias", label: "Experiência" },
  { id: "premios", label: "Prêmios" },
];

export default function Header() {
  const [activeSection, setActiveSection] = useState("inicio");
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 32);
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
        onClick={() => {
          setMenuOpen(false);
        }}
        className={`nav-link ${activeSection === id ? "nav-link-active" : ""} ${mobile ? "nav-link-mobile" : ""}`}
      >
        {label}
      </a>
    ));

  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="site-header-inner">
        <button
          type="button"
          className="site-logo font-serif"
          onClick={() => {
            document
              .getElementById("inicio")
              ?.scrollIntoView({ behavior: "smooth" });
            setMenuOpen(false);
          }}
        >
          Fernanda<span className="site-logo-accent">.</span>
        </button>

        <nav className="site-nav-desktop" aria-label="Seções do portfólio">
          {navLinks()}
        </nav>

        <div className="site-header-actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="site-icon-button"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? (
              <Sun size={19} aria-hidden="true" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="site-icon-button site-menu-button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X size={21} aria-hidden="true" />
            ) : (
              <Menu size={21} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="site-nav-mobile"
          aria-label="Seções do portfólio"
        >
          {navLinks(true)}
        </nav>
      )}
    </header>
  );
}
