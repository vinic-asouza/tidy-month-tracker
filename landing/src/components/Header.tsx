import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#inicio", label: "Início" },
  { href: "#beneficios", label: "Benefícios" },
  { href: "#preview", label: "Preview" },
  { href: "#estatisticas", label: "Estatísticas" },
  { href: "#como-funciona", label: "Como funciona" },
];

export function Header() {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50",
        "bg-card/80 backdrop-blur-xl card-shadow"
      )}
    >
      <div className="container flex h-full items-center justify-between gap-4 px-4">
        {/* Logo - mesma do frontend */}
        <a href="#inicio" className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Wallet className="h-4 w-4 text-primary-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <span className="hidden font-semibold tracking-tight text-foreground sm:inline text-base">
            Tidy Month Tracker
          </span>
        </a>

        {/* Nav links - scroll */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 text-base text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="rounded-lg text-base">
            Entrar
          </Button>
          <Button size="sm" className="rounded-lg text-base">
            Começar grátis
          </Button>
        </div>
      </div>
    </header>
  );
}
