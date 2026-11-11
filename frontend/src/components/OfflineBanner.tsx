import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Aviso leve quando o browser reporta offline.
 * Não exibe nem reutiliza dados financeiros cacheados (ADR-011 / ADR-012).
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      data-testid="offline-banner"
      className="sticky top-0 z-50 border-b border-border bg-muted px-4 py-2 text-sm text-foreground"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        <p>Sem conexão — reconecte para ver seus dados.</p>
      </div>
    </div>
  );
}
