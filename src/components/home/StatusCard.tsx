import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusCardAccent = 'default' | 'success' | 'warning' | 'danger';

interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  cta?: string;
  accent?: StatusCardAccent;
  onClick?: () => void;
  'aria-label'?: string;
}

const ACCENT_STYLES: Record<
  StatusCardAccent,
  { iconBg: string; iconText: string; valueText: string }
> = {
  default: {
    iconBg: 'bg-muted',
    iconText: 'text-foreground',
    valueText: 'text-foreground',
  },
  success: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-700',
    valueText: 'text-purple-800',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    valueText: 'text-amber-800',
  },
  danger: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-700',
    valueText: 'text-red-800',
  },
};

/**
 * Compact status card used in the Home dashboard.
 * Mobile-first: 2x2 grid; expands to 4x1 on desktop via parent grid classes.
 */
export function StatusCard({
  icon: Icon,
  title,
  value,
  cta,
  accent = 'default',
  onClick,
  'aria-label': ariaLabel,
}: StatusCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border',
        onClick ? 'active:scale-[0.98]' : ''
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-lg p-1.5 flex-shrink-0', styles.iconBg)}>
            <Icon className={cn('h-4 w-4', styles.iconText)} />
          </div>
          <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
        </div>
        <p className={cn('text-sm font-semibold leading-tight truncate', styles.valueText)}>
          {value}
        </p>
        {cta && <p className="text-[10px] font-medium text-primary mt-0.5">{cta} →</p>}
      </CardContent>
    </Card>
  );
}

export default StatusCard;
