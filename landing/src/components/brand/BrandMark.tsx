import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}

export function BrandMark({ size = "md", showText = true, className }: BrandMarkProps) {
  const iconSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <img
        src="/brand/logo.png"
        alt="Finto"
        className={cn(iconSize, "shrink-0 object-contain")}
        width={size === "sm" ? 32 : 36}
        height={size === "sm" ? 32 : 36}
      />
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-foreground",
            size === "sm" ? "text-sm" : "text-base"
          )}
        >
          Finto
        </span>
      )}
    </div>
  );
}
