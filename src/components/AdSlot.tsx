import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from '@/lib/icons';
import {
  useAdForPlacement,
  useTrackAdImpression,
  useTrackAdClick,
  type AdPlacement,
} from '@/hooks/useAdvertisements';
import { cn } from '@/lib/utils';

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
  /** Si es true, oculta el slot en lugar de mostrar placeholder vacío. */
  hideWhenEmpty?: boolean;
}

/**
 * Slot publicitario transparente. Muestra 1 ad activo para el placement.
 * Etiqueta obligatoria "Patrocinado" conforme SERNAC (Ley 19.496).
 * Trackea impresiones automaticamente al montar + clicks al interactuar.
 */
export function AdSlot({ placement, className, hideWhenEmpty = true }: AdSlotProps) {
  const { data, isLoading } = useAdForPlacement(placement);
  const trackImpression = useTrackAdImpression();
  const trackClick = useTrackAdClick();
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (data?.id && !impressionTracked.current) {
      impressionTracked.current = true;
      trackImpression.mutate(data.id);
    }
  }, [data?.id, trackImpression]);

  if (isLoading) {
    return hideWhenEmpty ? null : (
      <div className={cn('h-20 rounded-lg bg-muted/40 animate-pulse', className)} />
    );
  }

  if (!data) return hideWhenEmpty ? null : null;

  const handleClick = () => {
    trackClick.mutate(data.id);
  };

  return (
    <a
      href={data.target_url}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      onClick={handleClick}
      className={cn('block group', className)}
      aria-label={`Publicidad patrocinada: ${data.title}`}
    >
      <Card className="relative overflow-hidden border-muted-foreground/20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950/60 hover:shadow-md transition-shadow">
        <Badge
          variant="outline"
          className="absolute top-2 right-2 z-10 text-[9px] bg-white/80 dark:bg-slate-900/80 border-slate-300"
        >
          Patrocinado
        </Badge>
        <CardContent className="p-4 flex gap-3">
          {data.image_url ? (
            <img
              src={data.image_url}
              alt=""
              loading="lazy"
              className="h-14 w-14 rounded-md object-cover shrink-0 bg-muted"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-0.5">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:underline">
              {data.title}
            </h3>
            {data.description && (
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                {data.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
              <ExternalLink className="h-2.5 w-2.5" />
              <span>Visitar</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
