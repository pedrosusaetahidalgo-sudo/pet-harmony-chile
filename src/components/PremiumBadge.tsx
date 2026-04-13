import { Crown } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  size?: 'xs' | 'sm';
  className?: string;
}

export function PremiumBadge({ size = 'xs', className }: PremiumBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-bold text-purple-600 bg-purple-100 rounded',
        size === 'xs' && 'text-[8px] px-1 py-px',
        size === 'sm' && 'text-[10px] px-1.5 py-0.5',
        className
      )}
    >
      <Crown className={cn(size === 'xs' ? 'h-2 w-2' : 'h-2.5 w-2.5')} />
      PRO
    </span>
  );
}
