import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsPawMember } from '@/hooks/useIsPawMember';
import { cn } from '@/lib/utils';

interface PawMemberBadgeProps {
  userId: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge "Paw Member" para usuarios con membresia voluntaria activa.
 * No desbloquea nada — solo reconocimiento publico en el perfil.
 */
export function PawMemberBadge({ userId, size = 'md', className }: PawMemberBadgeProps) {
  const { data } = useIsPawMember(userId);
  if (!data || !data.is_member) return null;

  const since = data.member_since
    ? format(new Date(data.member_since), 'MMMM yyyy', { locale: es })
    : null;

  const badgeEl = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 bg-gradient-to-r from-violet-100 via-fuchsia-100 to-amber-100 text-violet-900 border-violet-300 ring-1 ring-violet-200/60',
        'dark:from-violet-950/60 dark:via-fuchsia-950/50 dark:to-amber-950/40 dark:text-violet-200 dark:border-violet-800',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs',
        className
      )}
    >
      <Sparkles className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      Paw Member
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
            <div className="font-semibold">Miembro voluntario de Paw Friend 💛</div>
            {since && <div className="text-muted-foreground">Desde {since}</div>}
            <div className="text-[10px] text-muted-foreground italic">
              Sin beneficios exclusivos — todo Paw Friend sigue gratis.
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
