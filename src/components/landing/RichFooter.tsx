import { Link } from 'react-router-dom';
import { BuiltWithClaude } from '@/components/BuiltWithClaude';
import { Mail } from '@/lib/icons';
import { FOOTER, HEADER } from './content/copy';

/**
 * Footer rico con 4 columnas — masterplan §9.12.
 * Reemplaza el LegalFooter minimalista (que sigue vivo para otras páginas
 * públicas). Aprovecha la oportunidad de descubrimiento que el footer del
 * landing actual desperdicia.
 */
export function RichFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-neutral-50/60 px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        {/* Top: brand + tagline + columnas */}
        <div className="grid gap-10 md:grid-cols-[1.1fr_2fr] md:gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src="/paw_friend_icon_principal.svg"
                alt="Paw Friend"
                className="h-9 w-9"
                width={36}
                height={36}
              />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-purple-800">{HEADER.brandLead}</span>
                <span className="ml-0.5 text-purple-500">{HEADER.brandTail}</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{FOOTER.tagline}</p>

            <a
              href={`mailto:${FOOTER.contactEmail}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {FOOTER.contactEmail}
            </a>
          </div>

          {/* Columnas */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {FOOTER.columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom: copyright + atribución */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} Paw Friend · Hecho en Chile, para Chile y Latam
          </p>
          <BuiltWithClaude />
        </div>
      </div>
    </footer>
  );
}
