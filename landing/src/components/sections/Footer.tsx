import { BrandMark } from "@/components/brand/BrandMark";
import { footer, site } from "@/content/copy";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-10">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <BrandMark size="sm" />
            <p className="text-sm text-muted-foreground">{footer.tagline}</p>
          </div>

          <nav className="flex items-center gap-6 text-sm" aria-label="Legal">
            <a
              href="#"
              className="text-muted-foreground opacity-50 cursor-not-allowed"
              aria-disabled="true"
              tabIndex={-1}
            >
              {footer.privacy}
            </a>
            <a
              href="#"
              className="text-muted-foreground opacity-50 cursor-not-allowed"
              aria-disabled="true"
              tabIndex={-1}
            >
              {footer.terms}
            </a>
          </nav>
        </div>

        <p className="text-center md:text-left text-xs text-muted-foreground mt-8">
          © {currentYear} {site.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
