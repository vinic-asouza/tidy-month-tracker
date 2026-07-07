import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionShellProps {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  centered?: boolean;
}

export function SectionShell({
  id,
  title,
  subtitle,
  badge,
  children,
  className,
  headerClassName,
  centered = false,
}: SectionShellProps) {
  return (
    <section id={id} className={cn("py-16 md:py-24 scroll-mt-16", className)}>
      <div className="container">
        <div
          className={cn(
            "mb-10 md:mb-12 max-w-2xl",
            centered && "mx-auto text-center",
            headerClassName
          )}
        >
          {badge && (
            <p className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              {badge}
            </p>
          )}
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && (
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
