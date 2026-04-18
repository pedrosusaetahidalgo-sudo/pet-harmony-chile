/**
 * Atribución "Con IA de Claude".
 *
 * Logo oficial de Claude (símbolo color #d97757) en public/claude-logo.svg.
 * Respeta guidelines: no se modifica, no se combina con la marca Paw Friend,
 * no implica endorsement. Solo indica que el producto usa la API de Claude.
 */
export function BuiltWithClaude({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://claude.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ${className}`}
      aria-label="Construido con IA de Claude (Anthropic) — abre claude.com en una pestaña nueva"
    >
      <img
        src="/claude-logo.svg"
        alt=""
        aria-hidden="true"
        className="h-3.5 w-3.5"
        loading="lazy"
        decoding="async"
      />
      <span>
        Con IA de <span className="font-medium">Claude</span>
      </span>
    </a>
  );
}
