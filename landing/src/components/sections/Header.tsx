import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/content/navigation";
import { AUTH_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <a href="#inicio" className="hover:opacity-80 transition-opacity">
          <BrandMark size="sm" />
        </a>

        <nav className="hidden md:flex items-center gap-6" aria-label="Principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={AUTH_URL}>Entrar</a>
          </Button>
          <Button size="sm" asChild>
            <a href={AUTH_URL}>Começar</a>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-muted-foreground"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t bg-background overflow-hidden transition-all duration-200",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container py-4 flex flex-col gap-3" aria-label="Mobile">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" asChild>
              <a href={AUTH_URL}>Entrar</a>
            </Button>
            <Button size="sm" asChild>
              <a href={AUTH_URL}>Começar</a>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
