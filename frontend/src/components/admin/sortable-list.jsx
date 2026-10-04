"use client";

import { GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

function SortableRow({
  row,
  label,
  className,
  disabled,
  onStart,
  onFinish,
  onCancel,
  onMove,
  children,
}) {
  const { ui } = useI18n();
  const controls = useDragControls();
  return (
    <Reorder.Item
      className={className}
      value={row}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onFinish}
      whileDrag={{ boxShadow: "0 8px 24px #2b211d26", scale: 1.01, zIndex: 2 }}
    >
      <button
        className="drag-handle"
        type="button"
        disabled={disabled}
        aria-label={ui("Reordenar {0}", { 0: label })}
        title={ui(
          "Segure para arrastar. No teclado, use Alt + seta para cima ou para baixo.",
        )}
        onPointerDown={(event) => {
          if (disabled || !event.isPrimary || event.button !== 0) return;
          if (!onStart()) return;
          controls.start(event);
        }}
        onPointerCancel={onCancel}
        onKeyDown={(event) => {
          if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            onMove(event.key === "ArrowUp" ? -1 : 1);
          }
          if (event.key === "Escape") {
            controls.cancel();
            onCancel();
          }
        }}
      >
        <GripVertical aria-hidden="true" />
      </button>
      {children}
    </Reorder.Item>
  );
}

export default function SortableList({
  items,
  visibleIds,
  search = "",
  getId = (item) => item.id,
  getLabel = (item) => String(item),
  className,
  itemClassName,
  disabled,
  onReorder,
  children,
}) {
  const [order, setOrder] = useState(items);
  const current = useRef(items);
  const active = useRef(false);
  const saving = useRef(false);
  useEffect(() => {
    current.current = items;
    setOrder(items);
  }, [items]);
  const visible = order.filter(
    (row) =>
      (!visibleIds || visibleIds.includes(getId(row))) &&
      getLabel(row)
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  function cancel() {
    active.current = false;
    current.current = items;
    setOrder(items);
  }
  async function finish() {
    if (!active.current) return;
    active.current = false;
    const next = current.current;
    if (next.every((row, index) => getId(row) === getId(items[index]))) return;
    saving.current = true;
    try {
      const saved = await onReorder(next);
      if (saved === false) cancel();
    } catch {
      cancel();
    } finally {
      saving.current = false;
    }
  }
  return (
    <Reorder.Group
      as="ol"
      className={className}
      axis="y"
      layoutScroll
      values={visible}
      onReorder={(nextVisible) => {
        if (!active.current || disabled) return;
        const visibleIds = new Set(nextVisible.map(getId));
        let index = 0;
        const next = current.current.map((row) =>
          visibleIds.has(getId(row)) ? nextVisible[index++] : row,
        );
        current.current = next;
        setOrder(next);
      }}
    >
      {visible.map((row) => (
        <SortableRow
          key={getId(row)}
          row={row}
          label={getLabel(row)}
          className={itemClassName}
          disabled={disabled || visible.length < 2}
          onStart={() => {
            if (saving.current) return false;
            active.current = true;
            return true;
          }}
          onFinish={finish}
          onCancel={cancel}
          onMove={(delta) => {
            const index = visible.findIndex(
              (item) => getId(item) === getId(row),
            );
            const target = visible[index + delta];
            if (!target || disabled || saving.current) return;
            const next = [...order];
            const from = next.indexOf(row);
            const to = next.indexOf(target);
            [next[from], next[to]] = [next[to], next[from]];
            active.current = true;
            current.current = next;
            setOrder(next);
            finish();
          }}
        >
          {children(row)}
        </SortableRow>
      ))}
    </Reorder.Group>
  );
}
