import "./admin.css";
import { headers } from "next/headers";
import { formatMessage } from "@/i18n/format";
export async function generateMetadata() {
  const locale = (await headers()).get("x-portfolio-locale") || "pt-BR";
  const ui = (text) => formatMessage(locale, text);
  return {
    title: ui("Administração | Portfólio"),
    robots: { index: false, follow: false },
  };
}
export default function AdminLayout({ children }) {
  return <div className="admin-shell">{children}</div>;
}
