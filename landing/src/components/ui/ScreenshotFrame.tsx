import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenshotFrameProps {
  src?: string;
  alt: string;
  fallback: ReactNode;
  className?: string;
  aspectRatio?: "video" | "wide";
}

export function ScreenshotFrame({
  src,
  alt,
  fallback,
  className,
  aspectRatio = "video",
}: ScreenshotFrameProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card card-shadow",
        aspectRatio === "video" ? "aspect-video" : "aspect-[16/10]",
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
          {fallback}
        </div>
      )}
    </div>
  );
}
