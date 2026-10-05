import BubbleField from "@/components/bubble-field";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }) {
  return (
    <div
      data-slot="portfolio-container"
      className={cn("relative z-10 mx-auto w-full max-w-[1072px]", className)}
      {...props}
    />
  );
}

export function Section({ className, children, bubbles = true, ...props }) {
  return (
    <section
      className={cn(
        "relative isolate scroll-mt-28 bg-background px-4 text-foreground md:px-8 lg:px-20",
        className,
      )}
      {...props}
    >
      {bubbles && <BubbleField />}
      {children}
    </section>
  );
}

export function SectionHeading({ title, description, className, id }) {
  return (
    <header className={cn("mb-9", className)}>
      <h2
        id={id}
        className="font-serif text-[clamp(2.25rem,9vw,2.75rem)] md:text-[clamp(2rem,4vw,3.125rem)] leading-[1.2] font-normal tracking-[-.035em]"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-[680px] text-sm leading-[1.85] text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

export function SectionSubtitle({ children, highlight, className }) {
  return (
    <p
      className={cn(
        "text-left font-serif text-xl leading-snug font-light text-muted-foreground",
        className,
      )}
    >
      {children} <span className="text-primary">{highlight}</span>
    </p>
  );
}
