/**
 * TabCuidados — calendario de intervenciones unificado.
 *
 * Refactor Maestro 2026-04-25 §FICHA_TABS_V2.
 *
 * Reemplaza los tabs Vacunas + Antiparasitarios + Historial + Habitos cuando
 * FICHA_TABS_V2 esta activo.
 *
 * Insight Pedro: "no pueden sentirse llenando formularios constantemente".
 * Solucion:
 *   - 1 sola lista cronologica con TODAS las intervenciones de salud/peso/comida
 *   - filtros por categoria (chips one-tap)
 *   - 1 solo boton "+ Registrar" que abre RegisterInterventionSheet con presets
 *   - reusa pet_timeline_events (10 categorias canonicas Fase 0)
 *
 * Vista mobile-first: lista vertical con cards compactas. No tabla.
 * Las proximas intervenciones (recordatorios futuros) van arriba con badge.
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO, isFuture, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  usePetHistoryTimeline,
  TIMELINE_CATEGORY_META,
  type TimelineCategory,
  type TimelineEvent,
} from '@/hooks/usePetHistoryTimeline';
import { RegisterInterventionSheet } from './RegisterInterventionSheet';
import { cn } from '@/lib/utils';

interface TabCuidadosProps {
  petId: string;
  petName: string;
}

// Categorias relevantes para "Cuidados". Hitos / legal / social no entran.
const CUIDADOS_CATEGORIES: TimelineCategory[] = [
  'health',
  'weight',
  'nutrition',
  'hygiene',
  'activity',
];

interface FilterChip {
  key: 'all' | TimelineCategory;
  label: string;
  emoji: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { key: 'all', label: 'Todos', emoji: '✨' },
  ...CUIDADOS_CATEGORIES.map((cat) => ({
    key: cat,
    label: TIMELINE_CATEGORY_META[cat].label,
    emoji: TIMELINE_CATEGORY_META[cat].emoji,
  })),
];

export function TabCuidados({ petId, petName }: TabCuidadosProps) {
  const [filter, setFilter] = useState<'all' | TimelineCategory>('all');
  const [registerOpen, setRegisterOpen] = useState(false);

  const { data: events = [], isLoading } = usePetHistoryTimeline(petId, {
    categories: CUIDADOS_CATEGORIES,
    limit: 100,
  });

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => e.category === filter);
  }, [events, filter]);

  // Separar próximas (futuras) de pasadas
  const { upcoming, past } = useMemo(() => {
    const upcoming: TimelineEvent[] = [];
    const past: TimelineEvent[] = [];
    for (const e of filteredEvents) {
      if (isFuture(parseISO(e.event_at))) {
        upcoming.push(e);
      } else {
        past.push(e);
      }
    }
    upcoming.sort((a, b) => parseISO(a.event_at).getTime() - parseISO(b.event_at).getTime());
    return { upcoming, past };
  }, [filteredEvents]);

  return (
    <div className="space-y-4 pb-20">
      {/* Filtros chips horizontales */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
              filter === chip.key
                ? 'bg-purple-100 border-purple-300 text-purple-800 font-medium'
                : 'bg-background border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <span>{chip.emoji}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && filteredEvents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <div className="text-4xl">
              {filter === 'all' ? '🐾' : FILTER_CHIPS.find((c) => c.key === filter)?.emoji}
            </div>
            <p className="text-sm text-muted-foreground">
              {filter === 'all'
                ? `Aún no hay intervenciones para ${petName}.`
                : `Sin entradas de "${FILTER_CHIPS.find((c) => c.key === filter)?.label}" aún.`}
            </p>
            <Button onClick={() => setRegisterOpen(true)} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Registrar la primera
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Próximas */}
      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            Próximas
          </h3>
          {upcoming.map((event) => (
            <InterventionCard key={event.id} event={event} isUpcoming />
          ))}
        </section>
      )}

      {/* Historial */}
      {past.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Historial
          </h3>
          {past.map((event) => (
            <InterventionCard key={event.id} event={event} />
          ))}
        </section>
      )}

      {/* FAB / botón persistente "+ Registrar" */}
      <div className="fixed bottom-20 right-4 z-30 sm:bottom-6">
        <Button
          onClick={() => setRegisterOpen(true)}
          size="lg"
          className="h-14 rounded-full shadow-lg gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-5 w-5" />
          Registrar
        </Button>
      </div>

      <RegisterInterventionSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        petId={petId}
        petName={petName}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// InterventionCard
// ──────────────────────────────────────────────────────────────────────────

function InterventionCard({
  event,
  isUpcoming = false,
}: {
  event: TimelineEvent;
  isUpcoming?: boolean;
}) {
  const meta = TIMELINE_CATEGORY_META[event.category];
  const date = parseISO(event.event_at);
  const dateLabel = isUpcoming
    ? `en ${differenceInDays(date, new Date()) + 1} día${differenceInDays(date, new Date()) === 0 ? '' : 's'}`
    : format(date, "d 'de' MMM yyyy", { locale: es });

  return (
    <Card className={cn('overflow-hidden', isUpcoming && 'border-amber-200 bg-amber-50/30')}>
      <CardContent className="p-3 flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 inline-flex h-10 w-10 rounded-full items-center justify-center text-lg',
            meta.bgColor
          )}
        >
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight">{event.title}</p>
            <span
              className={cn(
                'shrink-0 text-xs',
                isUpcoming ? 'text-amber-700 font-medium' : 'text-muted-foreground'
              )}
            >
              {dateLabel}
            </span>
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
