import type { LucideIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
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
}: EmptyStateProps) {
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
          onClick={
            onAction ||
            (() => {
              if (actionUrl) window.location.href = actionUrl;
            })
          }
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
