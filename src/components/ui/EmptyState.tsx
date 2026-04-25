import type { ReactNode } from 'react';
import { AlertCircle, Loader2, type LucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export interface EmptyStateProps {
  /** Requerido salvo para variants "loading" / "error", donde es opcional. */
  icon?: LucideIcon | React.ElementType;
  /**
   * Path absoluto a un SVG ilustrado del brand v2 (ej:
   * "/paw-friend-assets-v2/illustrations/empty-states/no_bookings.svg").
   * Si se pasa, reemplaza al icon. Recomendado para empty states de listas
   * principales (refactor 2026-04-25 con assets v2).
   */
  illustration?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Shorthand: render a button with this label */
  actionLabel?: string;
  /** If actionLabel + actionUrl: navigate to this URL */
  actionUrl?: string;
  /** If actionLabel + onAction: call this function */
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
  /**
   * Visual variant:
   * - "default" — simple centered text (original ui/EmptyState)
   * - "compact" — smaller text, icon in colored bg pill, fade-in animation
   * - "card"    — wrapped in a dashed-border Card
   * - "loading" — skeleton + spinner centrado (F.4 auditoría top-tier)
   * - "error"   — icono rojo + retry button (F.4 auditoría top-tier)
   */
  variant?: 'default' | 'compact' | 'card' | 'loading' | 'error';
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  actionLabel,
  actionUrl,
  onAction,
  className,
  children,
  variant = 'default',
}: EmptyStateProps) {
  const navigate = useNavigate();

  /** Renderiza el visual: SVG ilustrado (brand v2) si se pasa, sino el icon. */
  const Visual = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => {
    if (illustration) {
      const dim = size === 'sm' ? 'w-32 h-24' : 'w-48 h-36';
      return (
        <img src={illustration} alt="" aria-hidden="true" className={cn(dim, 'mx-auto mb-3')} />
      );
    }
    const Icon = icon ?? AlertCircle;
    if (size === 'sm') {
      return (
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
          <Icon className="h-7 w-7 text-primary/60" />
        </div>
      );
    }
    return <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />;
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionUrl) {
      navigate(actionUrl);
    }
  };

  // Loading: spinner centrado + mensaje.
  if (variant === 'loading') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in',
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-[300px] mt-1">{description}</p>
        )}
        {children}
      </div>
    );
  }

  // Error: destructive icon + retry button si onAction/actionLabel.
  if (variant === 'error') {
    const ErrIcon = icon ?? AlertCircle;
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in',
          className
        )}
        role="alert"
      >
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <ErrIcon className="h-7 w-7 text-destructive" />
        </div>
        <p className="font-semibold text-sm mb-1">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-[320px] mb-4">{description}</p>
        )}
        {action}
        {!action && actionLabel && (onAction || actionUrl) && (
          <Button size="sm" variant="outline" onClick={handleAction}>
            {actionLabel}
          </Button>
        )}
        {children}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Visual />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {description && <p className="text-muted-foreground text-sm max-w-md">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
          {children}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in',
          className
        )}
      >
        <Visual size="sm" />
        <p className="font-medium text-sm mb-1">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-[260px] mb-4">{description}</p>
        )}
        {actionLabel && (actionUrl || onAction) && (
          <Button size="sm" variant="outline" onClick={handleAction}>
            {actionLabel}
          </Button>
        )}
        {children}
      </div>
    );
  }

  // default variant
  return (
    <div className={cn('text-center py-12', className)}>
      <Visual />
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>
      )}
      {action}
      {!action && actionLabel && (actionUrl || onAction) && (
        <button
          onClick={handleAction}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}
