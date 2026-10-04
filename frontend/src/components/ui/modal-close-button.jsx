"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModalCloseButton({ className, label = "Fechar", ...props }) {
  const { ui } = useI18n();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "absolute top-5 right-5 cursor-pointer rounded-full border border-[#e6d7d4] bg-white/70 text-[#5a4b49] hover:bg-white dark:border-[#59454a] dark:bg-[#493b41] dark:text-[#f5ede6] dark:hover:bg-[#59454a]",
        className,
      )}
      {...props}
    >
      <XIcon aria-hidden="true" />
      <span className="sr-only">{ui(label)}</span>
    </Button>
  );
}
