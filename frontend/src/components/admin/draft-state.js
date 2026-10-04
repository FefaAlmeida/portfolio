import { getSchema } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { TextAlignment } from "./text-alignment";

const schema = getSchema([StarterKit, TextAlignment]);
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}
function documents(value) {
  if (Array.isArray(value)) return value.map(documents);
  if (value && typeof value === "object") {
    // Tiptap adds default attributes when it reads a saved document.
    if (value.type === "doc") return schema.nodeFromJSON(value).toJSON();
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, documents(item)]),
    );
  }
  return value;
}
export function draftFingerprint(draft) {
  return JSON.stringify(canonical(documents(draft)));
}
