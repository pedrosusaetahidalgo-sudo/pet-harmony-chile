import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, PawPrint, Quote } from '@/lib/icons';
import { formatRelative, formatCLPCompact } from '@/lib/format';
import { usePublicDonations } from '@/hooks/usePublicDonations';
import { cn } from '@/lib/utils';

interface PawVoicesWallProps {
  limit?: number;
  className?: string;
}

export function PawVoicesWall({ limit = 24, className }: PawVoicesWallProps) {
  const { data, isLoading, isError } = usePublicDonations(limit);

  if (isError) return null;

  if (isLoading) {
    return (
      <section className={cn('space-y-3', className)} aria-label="Muralla de Paw Voices">
        <header className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-300">
            <PawPrint className="h-3.5 w-3.5" />
            Paw Voices
          </div>
          <Skeleton className="h-6 w-48 mx-auto" />
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className={cn('space-y-4', className)} aria-label="Muralla de Paw Voices">
      <header className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 rounded-full">
          <PawPrint className="h-3.5 w-3.5" />
          Paw Voices · muralla de apoyos
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Palabras de{' '}
          <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            quienes nos sostienen
          </span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Cada donación pública es una voz peluda que deja escrito por qué Paw Friend merece seguir
          acá. Sin ellos, esto no avanza.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((voice) => (
          <Card
            key={voice.id}
            className="relative overflow-hidden border-violet-100 dark:border-violet-950/50 bg-gradient-to-br from-white via-white to-violet-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 hover:shadow-md transition-shadow"
          >
            <Quote
              className="absolute -top-1 -right-1 h-10 w-10 text-violet-100 dark:text-violet-900/40 pointer-events-none"
              aria-hidden
            />
            <CardContent className="p-4 space-y-3 relative">
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-5">
                {voice.message}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-violet-100 dark:border-violet-950/50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shrink-0">
                    <Heart className="h-3 w-3 text-white fill-white" />
                  </div>
                  <span className="text-xs font-medium truncate">{voice.donor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                  <span className="font-semibold text-violet-600 dark:text-violet-300">
                    {formatCLPCompact(voice.amount_clp)}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{formatRelative(voice.paid_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground italic">
        ¿Querés aparecer aquí? Marca "quiero que mi mensaje sea público" al donar.
      </p>
    </section>
  );
}
