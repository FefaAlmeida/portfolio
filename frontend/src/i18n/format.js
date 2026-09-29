import en from "./en-US.json";
import pt from "./pt-BR.json";
export function formatMessage(locale, source, values = {}) {
  const catalog = locale === "en-US" ? en : pt;
  const text = catalog[source] ?? source;
  if (
    !Object.hasOwn(catalog, source) &&
    typeof source === "string" &&
    source.includes(": ")
  ) {
    return source
      .split("; ")
      .map((issue) => {
        const index = issue.indexOf(": ");
        if (index < 0) return formatMessage(locale, issue);
        const field = issue
          .slice(0, index)
          .split(".")
          .filter((key) => !/^\d+$/.test(key))
          .map((key) => (locale === "en-US" ? en[key] : pt[key]) || key)
          .join(" / ");
        const reason = issue.slice(index + 2);
        return `${field}: ${(locale === "en-US" ? en[reason] : pt[reason]) || (reason.startsWith("Invalid ") || reason.startsWith("Too ") ? (locale === "en-US" ? "Check the fields you entered." : "Verifique os campos informados.") : reason)}`;
      })
      .join("; ");
  }
  return String(text).replace(
    /\{(\w+)\}/g,
    (match, key) => values[key] ?? match,
  );
}
