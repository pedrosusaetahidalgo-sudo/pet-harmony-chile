/**
 * HistoriaTimelineView — timeline visual de la vida de la mascota
 *
 * Pilar 3 de la Trinidad del Corazon (Refactor Maestro 2026-04-23 §2.4.3).
 * Vista default del tab "Historia" en la ficha clinica cuando el flag
 * FICHA_HISTORIA_TAB esta activo.
 *
 * Feed cronologico con:
 * - Chips de filtro por 10 categorias canonicas
 * - Eventos agrupados por mes
 * - Iconos por categoria con color codificado
 * - Hitos destacados visualmente
 * - Empty state + fallback claro
 */
import { useMemo, useState } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, CalendarDays, Filter } from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  usePetHistoryTimeline,
  TIMELINE_CATEGORY_META,
  type TimelineCategory,
  type TimelineEvent,
} from '@/hooks/usePetHistoryTimeline';

interface HistoriaTimelineViewProps {
  petId: string;
  petName?: string;
  onAddEvent?: () => void;
  className?: string;
}

const ALL_CATEGORIES = Object.keys(TIMELINE_CATEGORY_META) as TimelineCategory[];

export function HistoriaTimelineView({
  petId,
  petName,
  onAddEvent,
  className,
}: HistoriaTimelineViewProps) {
  const [selectedCategories, setSelectedCategories] = useState<TimelineCategory[]>([]);
  const { data: events = [], isLoading } = usePetHistoryTimeline(petId, {
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
  });

  // Agrupar eventos por mes
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const monthKey = format(startOfMonth(parseISO(event.event_at)), 'yyyy-MM');
      if (!groups.has(monthKey)) groups.set(monthKey, []);
      groups.get(monthKey)!.push(event);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  const toggleCategory = (cat: TimelineCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => setSelectedCategories([]);

  const hasFilters = selectedCategories.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filtros por categoria */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por categoría</span>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
              Limpiar ({selectedCategories.length})
            </Button>
          )}
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1.5 pb-1">
            {ALL_CATEGORIES.map((cat) => {
              const meta = TIMELINE_CATEGORY_META[cat];
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all',
                    active
                      ? `${meta.bgColor} ${meta.color} border-current`
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  )}
                  aria-pressed={active}
                >
                  <span className="text-sm">{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {hasFilters
              ? 'No hay eventos con estos filtros'
              : `La historia de ${petName || 'tu mascota'} empieza aquí`}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4 max-w-xs mx-auto">
            {hasFilters
              ? 'Probá con otra categoría o limpiá los filtros.'
              : 'Registrá vacunas, paseos, baños, consultas. Cada evento queda en la historia.'}
          </p>
          {onAddEvent && !hasFilters && (
            <Button onClick={onAddEvent} variant="default" size="sm" className="gap-1.5">
              <Heart className="h-4 w-4" />
              Agregar primer evento
            </Button>
          )}
        </Card>
      )}

      {/* Eventos agrupados por mes */}
      {!isLoading && events.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([monthKey, monthEvents]) => {
            const monthDate = parseISO(`${monthKey}-01`);
            const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: es });
            return (
              <div key={monthKey} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-background/95 backdrop-blur-sm py-1 -mx-1 px-1">
                  {monthLabel}
                </h3>
                <div className="space-y-2 border-l-2 border-border pl-4 ml-2 relative">
                  {monthEvents.map((event) => (
                    <TimelineEventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA agregar en footer si ya hay eventos */}
      {!isLoading && events.length > 0 && onAddEvent && (
        <div className="pt-2 flex justify-center">
          <Button onClick={onAddEvent} variant="outline" size="sm" className="gap-1.5">
            <Heart className="h-4 w-4" />
            Agregar evento a la historia
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card individual de evento
// ─────────────────────────────────────────────────────────────────────────────

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const meta = TIMELINE_CATEGORY_META[event.category];
  const date = parseISO(event.event_at);

  return (
    <div className="relative group">
      {/* Punto en la linea */}
      <div
        className={cn(
          'absolute -left-[22px] top-3 w-3 h-3 rounded-full border-2 border-background transition-transform',
          event.is_milestone ? 'bg-pink-500 ring-2 ring-pink-200' : 'bg-border',
          'group-hover:scale-125'
        )}
      />

      <Card
        className={cn(
          'p-3 border transition-colors hover:shadow-sm',
          event.is_milestone ? 'ring-1 ring-pink-200 bg-pink-50/30' : meta.bgColor
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="text-xl shrink-0 mt-0.5" aria-hidden>
            {meta.emoji}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className={cn('text-sm font-semibold truncate', meta.color)}>{event.title}</p>
              {event.is_milestone && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 h-4 bg-pink-100 text-pink-700 border-pink-200 shrink-0"
                >
                  Hito
                </Badge>
              )}
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span>{format(date, "d 'de' MMM", { locale: es })}</span>
              <span>·</span>
              <span className="uppercase tracking-wide">{meta.label}</span>
              {!event.is_user_reported && (
                <>
                  <span>·</span>
                  <span className="text-blue-600">Verificado vet</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
