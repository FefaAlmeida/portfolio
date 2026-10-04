import { publicContent } from "@/lib/api";
import Home from "../page";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const ready = await publicContent("i18n/ready", "en-US").then((value) => value.ready).catch(() => false);
  return { alternates: { canonical: "/en", languages: { "pt-BR": "/", "en-US": "/en" } }, robots: { index: ready, follow: true } };
}

export default function EnglishHome() {
  return <Home locale="en-US" />;
}
