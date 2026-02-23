import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenshotPlaceholderProps {
  label: string;
  /** Quando informado, exibe a imagem em vez do placeholder */
  src?: string;
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
}

const aspectMap = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[21/9]",
};

export function ScreenshotPlaceholder({
  label,
  src,
  alt,
  className,
  aspectRatio = "video",
}: ScreenshotPlaceholderProps) {
  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-2xl card-shadow", aspectMap[aspectRatio], className)}>
        <img
          src={src}
          alt={alt ?? label}
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground",
        aspectMap[aspectRatio],
        className
      )}
    >
      <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
