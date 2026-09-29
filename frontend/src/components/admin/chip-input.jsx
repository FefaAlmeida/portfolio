"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import { useI18n } from "@/i18n/provider";

export default function ChipInput({
  label,
  value = [],
  onChange,
  disabled = false,
}) {
  const { ui } = useI18n();
  const id = useId();
  const [text, setText] = useState("");

  function add() {
    const item = text.trim();
    if (!item || disabled || value.length >= 60) return;
    if (
      !value.some(
        (existing) => existing.toLocaleLowerCase() === item.toLocaleLowerCase(),
      )
    ) {
      onChange([...value, item]);
    }
    setText("");
  }

  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <div className="chip-input">
        <input
          id={id}
          value={text}
          disabled={disabled || value.length >= 60}
          maxLength={500}
          placeholder={ui("Digite e pressione Enter")}
          onChange={(event) => setText(event.target.value)}
          onBlur={add}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              add();
            }
          }}
        />
      </div>
      <ul className="technology-list">
        {value.map((item) => (
          <li key={item} className="technology-chip">
            <span>{item}</span>
            <button
              className="technology-remove"
              type="button"
              aria-label={ui("Remover {0}", { 0: item })}
              disabled={disabled}
              onClick={() =>
                onChange(value.filter((technology) => technology !== item))
              }
            >
              <X size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
