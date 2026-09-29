import { Fragment } from "react";
export function hasText(value) {
  if (typeof value === "string") return Boolean(value.trim());
  return Boolean(value?.text || value?.content?.some(hasText));
}
export default function RichText({ value, className = "", links = true }) {
  if (!value) return null;
  if (typeof value === "string") return <p className={className}>{value}</p>;
  function render(node, key) {
    const children = node.content?.map((child, i) =>
      render(child, `${key}-${i}`),
    );
    if (node.type === "text") {
      let text = node.text;
      for (const mark of node.marks || []) {
        if (mark.type === "bold")
          text = (
            <strong className="font-semibold text-highlight">{text}</strong>
          );
        if (mark.type === "italic") text = <em>{text}</em>;
        if (
          links &&
          mark.type === "link" &&
          /^https?:\/\//i.test(mark.attrs?.href || "")
        )
          text = (
            <a
              href={mark.attrs.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {text}
            </a>
          );
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
    switch (node.type) {
      case "doc":
        return <Fragment key={key}>{children}</Fragment>;
      case "paragraph":
        return <p key={key}>{children || <br />}</p>;
      case "bulletList":
        return (
          <ul key={key} className="list-disc pl-6">
            {children}
          </ul>
        );
      case "orderedList":
        return (
          <ol
            key={key}
            start={node.attrs?.start || 1}
            className="list-decimal pl-6"
          >
            {children}
          </ol>
        );
      case "listItem":
        return <li key={key}>{children}</li>;
      case "hardBreak":
        return <br key={key} />;
      default:
        return null;
    }
  }
  return <div className={`space-y-3 ${className}`}>{render(value, "doc")}</div>;
}
