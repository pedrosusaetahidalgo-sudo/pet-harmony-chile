import type { ReactNode } from 'react';
import type { LucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export interface EmptyStateProps {
  icon: LucideIcon | React.ElementType;
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
   * - "compact" — smaller text, icon in colored bg pill, fade-in animation (original components/EmptyState)
   * - "card" — wrapped in a dashed-border Card (original shared.tsx EmptyState)
   */
  variant?: 'default' | 'compact' | 'card';
}

export function EmptyState({
  icon: Icon,
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

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionUrl) {
      navigate(actionUrl);
    }
  };

  if (variant === 'card') {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="h-12 w-12 text-muted-foreground mb-4" />
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
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-primary/60" />
        </div>
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
      <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
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
