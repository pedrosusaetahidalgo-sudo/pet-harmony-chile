import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewTutorial, TUTORIALS } from '@/components/ViewTutorial';
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isThisWeek,
  isThisMonth,
  addDays,
  differenceInDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  Syringe,
  Pill,
  Scissors,
  Stethoscope,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/PageHeader';
import { useReminders } from '@/hooks/useReminders';
import { LINKS } from '@/lib/links';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { cn } from '@/lib/utils';
import { PremiumNudge } from '@/components/PremiumNudge';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { usePlan } from '@/hooks/usePlan';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Tone = 'rose' | 'amber' | 'sky' | 'purple' | 'slate';

const TYPE_META: Record<string, { icon: typeof Bell; label: string }> = {
  vaccine: { icon: Syringe, label: 'Vacuna' },
  medication: { icon: Pill, label: 'Medicamento' },
  grooming: { icon: Scissors, label: 'Aseo' },
  checkup: { icon: Stethoscope, label: 'Control' },
  appointment: { icon: CalendarIcon, label: 'Cita' },
};

export default function Reminders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    reminders,
    overdueReminders,
    upcomingReminders,
    isLoading,
    completeReminder,
    snoozeReminder,
    addReminder,
  } = useReminders();
  const { isPremium, checkAccess } = usePlan();
  const activeCount = reminders.filter((r) => !r.is_completed).length;
  const reminderAccess = checkAccess('max_reminders', activeCount);
  const showUsageBar = isFeatureEnabled('USER_PREMIUM') && !isPremium;

  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: userPets = [] } = useQuery({
    queryKey: ['user-pets-reminders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('name');
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Agrupar cronologicamente: esta semana, proxima semana, este mes, mas adelante
  const grouped = useMemo(() => {
    const thisWeek: typeof reminders = [];
    const nextWeek: typeof reminders = [];
    const thisMonth: typeof reminders = [];
    const later: typeof reminders = [];

    const nextWeekStart = addDays(new Date(), 7);
    const nextWeekEnd = addDays(new Date(), 14);

    upcomingReminders.forEach((r) => {
      const d = new Date(r.due_date);
      if (isThisWeek(d, { weekStartsOn: 1 }) || isToday(d) || isTomorrow(d)) {
        thisWeek.push(r);
      } else if (d >= nextWeekStart && d <= nextWeekEnd) {
        nextWeek.push(r);
      } else if (isThisMonth(d)) {
        thisMonth.push(r);
      } else {
        later.push(r);
      }
    });

    // Sort ascending inside each group
    [thisWeek, nextWeek, thisMonth, later].forEach((arr) =>
      arr.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    );
    overdueReminders
      .slice()
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    return { thisWeek, nextWeek, thisMonth, later };
  }, [upcomingReminders, overdueReminders]);

  const sortedOverdue = useMemo(
    () =>
      overdueReminders
        .slice()
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
    [overdueReminders]
  );

  const formatDue = (iso: string) => {
    const d = new Date(iso);
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    if (isPast(d)) {
      const days = Math.abs(differenceInDays(d, new Date()));
      return `Vencido hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    const days = differenceInDays(d, new Date());
    if (days <= 7) return `En ${days} ${days === 1 ? 'día' : 'días'}`;
    return format(d, "EEEE d 'de' MMM", { locale: es });
  };

  const hasAnyReminder = sortedOverdue.length > 0 || upcomingReminders.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Recordatorios"
        subtitle={
          reminders.length === 0
            ? undefined
            : `${sortedOverdue.length} vencido${sortedOverdue.length === 1 ? '' : 's'} · ${upcomingReminders.length} próximo${upcomingReminders.length === 1 ? '' : 's'}`
        }
        back
        actions={
          <Button
            size="sm"
            onClick={() =>
              userPets.length > 0 ? setShowAddDialog(true) : navigate(LINKS.myPets())
            }
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!reminderAccess.allowed}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        }
      />

      <main className="container max-w-4xl mx-auto px-3 py-4 space-y-6 pb-24">
        {showUsageBar && (
          <PremiumNudge
            feature="max_reminders"
            title={reminderAccess.allowed ? 'Plan gratuito' : 'Límite alcanzado'}
            description={
              reminderAccess.allowed
                ? 'Tienes un número limitado de recordatorios activos. Con Premium son ilimitados.'
                : 'Llegaste al límite de recordatorios de tu plan. Mejora a Premium para agregar más.'
            }
            usage={{ current: activeCount, max: 3 }}
            variant="inline"
          />
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && !hasAnyReminder && (
          <EmptyState
            icon={Bell}
            title="Aún no tienes recordatorios"
            description="Crea tu primer recordatorio para no olvidar vacunas, controles ni citas."
            action={
              <Button
                onClick={() =>
                  userPets.length > 0 ? setShowAddDialog(true) : navigate(LINKS.myPets())
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                {userPets.length > 0 ? 'Crear recordatorio' : 'Agregar mascota primero'}
              </Button>
            }
          />
        )}

        {sortedOverdue.length > 0 && (
          <TimelineSection
            title="Vencidos"
            icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
            tone="rose"
            count={sortedOverdue.length}
            description="Estos recordatorios ya pasaron. Marca como hecho o pospón."
          >
            {sortedOverdue.map((r) => (
              <TimelineRow
                key={r.id}
                reminder={r}
                dueLabel={formatDue(r.due_date)}
                tone="rose"
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
                onSnooze={(days) => snoozeReminder.mutate({ id: r.id, days })}
              />
            ))}
          </TimelineSection>
        )}

        {grouped.thisWeek.length > 0 && (
          <TimelineSection
            title="Esta semana"
            icon={<Bell className="h-4 w-4 text-amber-600" />}
            tone="amber"
            count={grouped.thisWeek.length}
          >
            {grouped.thisWeek.map((r) => (
              <TimelineRow
                key={r.id}
                reminder={r}
                dueLabel={formatDue(r.due_date)}
                tone="amber"
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
              />
            ))}
          </TimelineSection>
        )}

        {grouped.nextWeek.length > 0 && (
          <TimelineSection
            title="Próxima semana"
            icon={<CalendarIcon className="h-4 w-4 text-sky-600" />}
            tone="sky"
            count={grouped.nextWeek.length}
          >
            {grouped.nextWeek.map((r) => (
              <TimelineRow
                key={r.id}
                reminder={r}
                dueLabel={formatDue(r.due_date)}
                tone="sky"
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
              />
            ))}
          </TimelineSection>
        )}

        {grouped.thisMonth.length > 0 && (
          <TimelineSection
            title="Más adelante este mes"
            icon={<CalendarIcon className="h-4 w-4 text-purple-600" />}
            tone="purple"
            count={grouped.thisMonth.length}
          >
            {grouped.thisMonth.map((r) => (
              <TimelineRow
                key={r.id}
                reminder={r}
                dueLabel={formatDue(r.due_date)}
                tone="purple"
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
              />
            ))}
          </TimelineSection>
        )}

        {grouped.later.length > 0 && (
          <TimelineSection
            title="En el futuro"
            icon={<CalendarIcon className="h-4 w-4 text-slate-500" />}
            tone="slate"
            count={grouped.later.length}
          >
            {grouped.later.map((r) => (
              <TimelineRow
                key={r.id}
                reminder={r}
                dueLabel={formatDue(r.due_date)}
                tone="slate"
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
              />
            ))}
          </TimelineSection>
        )}
      </main>

      {/* FAB mobile para agregar recordatorio (solo si ya hay alguno) */}
      {hasAnyReminder && (
        <Button
          onClick={() => (userPets.length > 0 ? setShowAddDialog(true) : navigate(LINKS.myPets()))}
          size="lg"
          disabled={!reminderAccess.allowed}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg p-0"
          aria-label="Agregar recordatorio"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <ViewTutorial {...TUTORIALS.reminders} />

      <AddReminderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        pets={userPets}
        onSubmit={(data) => addReminder.mutate(data)}
      />
    </div>
  );
}

function TimelineSection({
  title,
  icon,
  count,
  tone,
  description,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: Tone;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start gap-2 mb-3 px-1">
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <h2 className="text-sm font-semibold">{title}</h2>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              tone === 'rose' && 'bg-rose-100 text-rose-700',
              tone === 'amber' && 'bg-amber-100 text-amber-700',
              tone === 'sky' && 'bg-sky-100 text-sky-700',
              tone === 'purple' && 'bg-purple-100 text-purple-700',
              tone === 'slate' && 'bg-slate-100 text-slate-700'
            )}
          >
            {count}
          </Badge>
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground px-1 mb-2">{description}</p>}
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function TimelineRow({
  reminder,
  dueLabel,
  tone,
  onComplete,
  onOpen,
  onSnooze,
}: {
  reminder: {
    id: string;
    title: string;
    type: string;
    due_date: string;
    pets?: { name: string; species: string } | null;
  };
  dueLabel: string;
  tone: Tone;
  onComplete: () => void;
  onOpen: () => void;
  onSnooze?: (days: number) => void;
}) {
  const meta = TYPE_META[reminder.type] || { icon: Bell, label: '' };
  const Icon = meta.icon;
  const d = new Date(reminder.due_date);
  const day = format(d, 'd');
  const month = format(d, 'MMM', { locale: es });

  return (
    <Card
      className={cn(
        'border-l-4 transition hover:shadow-sm',
        tone === 'rose' && 'border-l-rose-500',
        tone === 'amber' && 'border-l-amber-500',
        tone === 'sky' && 'border-l-sky-500',
        tone === 'purple' && 'border-l-purple-600',
        tone === 'slate' && 'border-l-slate-400'
      )}
    >
      <CardContent className="p-3 flex items-center gap-3">
        {/* Columna de fecha (cronologia visual) */}
        <div
          className={cn(
            'flex flex-col items-center justify-center shrink-0 w-12 h-12 rounded-lg',
            tone === 'rose' && 'bg-rose-50 text-rose-700',
            tone === 'amber' && 'bg-amber-50 text-amber-700',
            tone === 'sky' && 'bg-sky-50 text-sky-700',
            tone === 'purple' && 'bg-purple-50 text-purple-700',
            tone === 'slate' && 'bg-slate-100 text-slate-600'
          )}
        >
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-[10px] uppercase font-medium leading-none mt-0.5">{month}</span>
        </div>

        {/* Contenido */}
        <button
          onClick={onOpen}
          className="flex-1 text-left min-w-0"
          aria-label={`Abrir ficha de ${reminder.pets?.name || 'mascota'}`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="font-medium text-sm truncate">{reminder.title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {reminder.pets?.name ? (
              <>
                <span className="font-medium text-foreground/70">{reminder.pets.name}</span>
                <span className="mx-1">·</span>
              </>
            ) : null}
            <span>{dueLabel}</span>
          </p>
        </button>

        {/* Acciones */}
        {onSnooze && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Posponer recordatorio"
                className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSnooze(1)}>Posponer 1 día</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(3)}>Posponer 3 días</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(7)}>Posponer 1 semana</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onComplete}
          aria-label="Marcar como hecho"
          className="h-10 w-10 flex-shrink-0 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
        >
          <CheckCircle2 className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
