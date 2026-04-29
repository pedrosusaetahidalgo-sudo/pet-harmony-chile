import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDonorBadge, type DonorTier } from '@/hooks/useDonorBadge';
import { cn } from '@/lib/utils';

interface DonorBadgeProps {
  userId: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

const TIER_STYLES: Record<DonorTier, { label: string; className: string; ring: string }> = {
  bronze: {
    label: 'Paw Angel',
    className:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200',
    ring: 'ring-amber-200/60',
  },
  silver: {
    label: 'Paw Angel · Silver',
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
    ring: 'ring-slate-200/60',
  },
  gold: {
    label: 'Paw Angel · Gold',
    className: 'bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900 border-amber-400',
    ring: 'ring-amber-300/70',
  },
};

export function DonorBadge({ userId, size = 'md', className }: DonorBadgeProps) {
  const { data } = useDonorBadge(userId);
  if (!data) return null;

  const tier = TIER_STYLES[data.tier];
  const sinceFmt = data.first_donation_at
    ? format(new Date(data.first_donation_at), 'MMMM yyyy', { locale: es })
    : null;

  const badgeEl = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 ring-1',
        tier.className,
        tier.ring,
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs',
        className
      )}
    >
      <Heart className={cn('fill-current', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {tier.label}
    </Badge>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{badgeEl}</span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-0.5">
            <div className="font-semibold">Sostiene Paw Friend 💛</div>
            {sinceFmt && <div className="text-muted-foreground">Aportante desde {sinceFmt}</div>}
            {data.donation_count > 1 && (
              <div className="text-muted-foreground">{data.donation_count} aportes</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
