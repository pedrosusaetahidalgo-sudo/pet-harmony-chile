import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Mostrar boton back. Por default true. */
  back?: boolean;
  /** Override del onClick del back. Si no se da, hace navigate(-1). */
  onBack?: () => void;
  /** Slot opcional a la derecha (botones de accion, badges, etc.) */
  actions?: ReactNode;
  /** Slot bajo el titulo (breadcrumbs, tabs, filtros) */
  children?: ReactNode;
  className?: string;
}

/**
 * Header consistente para todas las paginas que NO son tabs principales del
 * bottom nav. Garantiza:
 *  - Boton back uniforme arriba a la izquierda
 *  - Titulo + subtitulo opcional centrado/alineado
 *  - Slot de acciones (compartir, agregar, etc.)
 *  - Tap target >= 44px en mobile
 *  - Respeta safe area top
 */
export function PageHeader({
  title,
  subtitle,
  back = true,
  onBack,
  actions,
  children,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60',
        'px-3 py-2 md:px-4 md:py-3',
        className
      )}
      style={{ paddingTop: 'calc(var(--safe-area-top) + 0.5rem)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {back && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Volver"
            className="h-11 w-11 flex-shrink-0 -ml-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-base md:text-lg truncate leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-1">{actions}</div>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </header>
  );
}
