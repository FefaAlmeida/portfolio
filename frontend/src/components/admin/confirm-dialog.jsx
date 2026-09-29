"use client";

import { Trash2 } from "lucide-react";
import { AlertDialog } from "radix-ui";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { useI18n } from "@/i18n/provider";

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
  returnFocus,
}) {
  const { ui } = useI18n();
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={`fixed inset-0 isolate z-50 backdrop-blur-sm ${destructive ? "bg-[#c85252]/25 dark:bg-[#ad4848]/30" : "bg-[#48484b]/30 dark:bg-[#242426]/45"}`}
        />
        <AlertDialog.Content
          className={`admin-confirm-dialog ${destructive ? "is-destructive" : ""}`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
          }}
        >
          {destructive && (
            <span className="admin-confirm-icon">
              <Trash2 size={24} aria-hidden="true" />
            </span>
          )}
          {destructive ? (
            <>
              <AlertDialog.Title>{title}</AlertDialog.Title>
              <AlertDialog.Description>{description}</AlertDialog.Description>
            </>
          ) : (
            <div className="admin-discard-message">
              <div>
                <AlertDialog.Title>{title}</AlertDialog.Title>
                <AlertDialog.Description>{description}</AlertDialog.Description>
              </div>
            </div>
          )}
          <div className="admin-confirm-actions">
            <AlertDialog.Cancel asChild>
              <button type="button">{cancelLabel}</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className="confirm-action"
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
          {!destructive && (
            <ModalCloseButton
              size="icon-xs"
              label={ui("Fechar e continuar editando")}
              onClick={onCancel}
            />
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
