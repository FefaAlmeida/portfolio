import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full border px-2 py-0.5 font-mono text-[10px] leading-normal font-semibold",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary",
        completed:
          "border-emerald-700/25 bg-emerald-50 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-950 dark:text-emerald-300",
        development:
          "border-amber-700/25 bg-amber-50 text-amber-800 dark:border-amber-300/25 dark:bg-amber-950 dark:text-amber-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
