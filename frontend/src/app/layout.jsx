import {
  Geist,
  Geist_Mono,
  Great_Vibes,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import VisitorLanguageDialog from "@/components/visitor-language-dialog";
import { formatMessage } from "@/i18n/format";
import { I18nProvider } from "@/i18n/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const signature = Great_Vibes({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const locale = (await headers()).get("x-portfolio-locale") || "pt-BR";
  const ui = (text) => formatMessage(locale, text);
  return {
    metadataBase: new URL(
      process.env.PUBLIC_URL || "https://fernandagabriela.com",
    ),
    title: ui("Fernanda Gabriela | Portfólio"),
    description: ui(
      "Portfólio de projetos técnicos do SENAI e impacto social.",
    ),
  };
}

export default async function RootLayout({ children }) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-portfolio-locale") || "pt-BR";
  const admin = requestHeaders.get("x-portfolio-admin") === "true";
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${signature.variable} h-full antialiased`}
    >
      <head>
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} root admin={admin}>
          {children}
          {!admin && <VisitorLanguageDialog />}
        </I18nProvider>
      </body>
    </html>
  );
}
