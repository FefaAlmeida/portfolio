"use client";

import { Check, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Dialog } from "radix-ui";
import { useId, useState } from "react";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { useI18n } from "@/i18n/provider";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const format = (value) =>
  value === "present"
    ? "Presente"
    : value
      ? `${value.slice(5)}/${value.slice(0, 4)}`
      : "";

function MonthField({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
  allowPresent,
  clearable,
}) {
  const { ui } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("");
  const validYear = /^[1-9]\d{3}$/.test(year);
  return (
    <div className="admin-field">
      <label htmlFor={id}>{ui(label)}</label>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (next)
            setYear(
              (value !== "present" && value?.slice(0, 4)) ||
                String(new Date().getFullYear()),
            );
          setOpen(next);
        }}
      >
        <Dialog.Trigger asChild>
          <button
            id={id}
            type="button"
            className="project-date-trigger"
            disabled={disabled}
          >
            {ui(format(value)) || "mm/yyyy"}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="month-picker-overlay" />
          <Dialog.Content className="month-picker" aria-describedby={undefined}>
            <Dialog.Title>{ui(label)}</Dialog.Title>
            <Dialog.Close asChild>
              <ModalCloseButton size="icon-lg" className="[&_svg]:size-5" />
            </Dialog.Close>
            <div className="month-picker-year">
              <button
                type="button"
                aria-label={ui("Ano anterior")}
                disabled={!validYear || Number(year) <= 1000}
                onClick={() => setYear(String(Number(year) - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <input
                aria-label={ui("Ano")}
                inputMode="numeric"
                maxLength={4}
                value={year}
                onChange={(event) =>
                  setYear(event.target.value.replace(/\D/g, ""))
                }
              />
              <button
                type="button"
                aria-label={ui("Próximo ano")}
                disabled={!validYear || Number(year) >= 9999}
                onClick={() => setYear(String(Number(year) + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="month-picker-months">
              {months.map((month, index) => {
                const date = `${year}-${String(index + 1).padStart(2, "0")}`;
                return (
                  <button
                    key={ui(month)}
                    type="button"
                    aria-pressed={date === value}
                    disabled={
                      !validYear || (min && date < min) || (max && date > max)
                    }
                    onClick={() => {
                      onChange(date);
                      setOpen(false);
                    }}
                  >
                    {ui(month)}
                  </button>
                );
              })}
            </div>
            {(allowPresent || clearable) && (
              <div className="month-picker-footer">
                <button
                  type="button"
                  className="month-picker-action"
                  aria-pressed={allowPresent ? value === "present" : undefined}
                  onClick={() => {
                    onChange(allowPresent ? "present" : "");
                    setOpen(false);
                  }}
                >
                  {allowPresent && <Clock3 size={18} aria-hidden="true" />}
                  <span>
                    {allowPresent ? ui("Presente") : ui("Limpar data")}
                  </span>
                  {allowPresent && value === "present" && (
                    <Check size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export function withProjectPeriod(value) {
  return {
    ...value,
    periodo:
      value.inicio && value.fim
        ? `${format(value.inicio)} – ${format(value.fim)}`
        : value.inicio
          ? format(value.inicio)
          : value.fim
            ? value.fim === "present"
              ? "Presente"
              : `Até ${format(value.fim)}`
            : "",
  };
}

export default function ProjectDates({
  value = {},
  status,
  startLabel = "Início do projeto",
  endLabel = "Fim do projeto",
  allowPresent = status === "EM DESENVOLVIMENTO",
  onChange,
  disabled,
}) {
  const { ui } = useI18n();
  function change(key, date) {
    onChange(withProjectPeriod({ ...value, [key]: date }));
  }
  return (
    <>
      <div className="field-grid">
        <MonthField
          label={startLabel}
          value={value.inicio}
          max={value.fim === "present" ? undefined : value.fim}
          disabled={disabled}
          onChange={(date) => change("inicio", date)}
        />
        <MonthField
          label={endLabel}
          allowPresent={allowPresent}
          clearable
          value={value.fim}
          min={value.inicio}
          disabled={disabled}
          onChange={(date) => change("fim", date)}
        />
      </div>
      {!value.inicio &&
        (!value.fim || value.fim === "present") &&
        value.periodo &&
        value.periodo !== "present" &&
        value.periodo !== "Presente" && (
          <p className="field-hint">
            {ui("Período cadastrado:")}
            {value.periodo}
            {ui(". Selecione as datas para atualizá-lo.")}
          </p>
        )}
    </>
  );
}
