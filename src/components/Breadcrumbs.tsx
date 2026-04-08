import { Link } from "react-router-dom";
import { ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/**
 * Breadcrumbs visibles para paginas con > 2 niveles de profundidad.
 * El ultimo item siempre se renderiza como texto plano (es la pagina actual).
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs text-muted-foreground overflow-x-auto", className)}
    >
      <ol className="flex items-center gap-1 min-w-0">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate max-w-[160px]",
                    isLast && "text-foreground font-medium"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
