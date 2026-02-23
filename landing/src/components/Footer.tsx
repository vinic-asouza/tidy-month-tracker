import { Wallet } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 bg-muted/30">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            <span>Tidy Month Tracker</span>
            <span className="text-border">·</span>
            <span>Dados na nuvem, com segurança</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Termos
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
