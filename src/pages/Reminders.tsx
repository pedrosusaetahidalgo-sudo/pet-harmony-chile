import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewTutorial, TUTORIALS } from '@/components/ViewTutorial';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/PageHeader';
import { useReminders } from '@/hooks/useReminders';
import { LINKS } from '@/lib/links';
import { REMINDER_TYPES } from '@/lib/reminderTypes';
import { cn } from '@/lib/utils';
import { PremiumNudge } from '@/components/PremiumNudge';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { usePlan } from '@/hooks/usePlan';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Pagina agregadora de recordatorios.
 *
 * Muestra todos los `pet_reminders` del usuario en 3 secciones:
 *  - Vencidos (urgente, rojo)
 *  - Hoy / proximos 24h (amber)
 *  - Proximos (mas adelante)
 *
 * No es feature nueva: solo UI sobre data que ya existe via `useReminders`.
 * Permite marcar como completado y navegar al detalle de la mascota.
 */
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

  // Dialog para agregar recordatorio
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newReminder, setNewReminder] = useState({
    pet_id: '',
    type: 'vaccine',
    title: '',
    due_date: '',
  });

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

  const grouped = useMemo(() => {
    const today: typeof reminders = [];
    const later: typeof reminders = [];
    upcomingReminders.forEach((r) => {
      const d = new Date(r.due_date);
      if (isToday(d) || isTomorrow(d)) today.push(r);
      else later.push(r);
    });
    return { today, later };
  }, [upcomingReminders]);

  const formatDue = (iso: string) => {
    const d = new Date(iso);
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    if (isPast(d)) return `Vencido · ${format(d, 'd MMM', { locale: es })}`;
    return format(d, 'EEEE d MMM', { locale: es });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Recordatorios"
        subtitle={
          reminders.length === 0
            ? undefined
            : `${overdueReminders.length} vencido${overdueReminders.length === 1 ? '' : 's'} · ${upcomingReminders.length} próximo${upcomingReminders.length === 1 ? '' : 's'}`
        }
        back
        actions={
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!reminderAccess.allowed}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        }
      />

      <main className="container max-w-5xl mx-auto px-3 py-4 space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-l-4 border-l-purple-600 bg-card p-3 flex items-center gap-3"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && reminders.length === 0 && (
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

        {overdueReminders.length > 0 && (
          <Section
            title="Vencidos"
            icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
            tone="rose"
            count={overdueReminders.length}
          >
            {overdueReminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
                onSnooze={(days) => snoozeReminder.mutate({ id: r.id, days })}
                dueLabel={formatDue(r.due_date)}
                tone="rose"
              />
            ))}
          </Section>
        )}

        {grouped.today.length > 0 && (
          <Section
            title="Hoy y mañana"
            icon={<Bell className="h-4 w-4 text-amber-600" />}
            tone="amber"
            count={grouped.today.length}
          >
            {grouped.today.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
                dueLabel={formatDue(r.due_date)}
                tone="amber"
              />
            ))}
          </Section>
        )}

        {grouped.later.length > 0 && (
          <Section
            title="Próximos"
            icon={<CalendarIcon className="h-4 w-4 text-purple-600" />}
            tone="purple"
            count={grouped.later.length}
          >
            {grouped.later.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(LINKS.petClinical(r.pet_id))}
                dueLabel={formatDue(r.due_date)}
                tone="purple"
              />
            ))}
          </Section>
        )}
      </main>
      <ViewTutorial {...TUTORIALS.reminders} />

      {/* Dialog para agregar recordatorio */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Recordatorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Mascota</Label>
              <Select
                value={newReminder.pet_id}
                onValueChange={(v) => setNewReminder((d) => ({ ...d, pet_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona mascota" />
                </SelectTrigger>
                <SelectContent>
                  {userPets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newReminder.type}
                onValueChange={(v) => setNewReminder((d) => ({ ...d, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={newReminder.title}
                onChange={(e) => setNewReminder((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ej: Vacuna antirrábica"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={newReminder.due_date}
                onChange={(e) => setNewReminder((d) => ({ ...d, due_date: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={!newReminder.pet_id || !newReminder.title || !newReminder.due_date}
              onClick={() => {
                addReminder.mutate({
                  pet_id: newReminder.pet_id,
                  type: newReminder.type,
                  title: newReminder.title,
                  due_date: newReminder.due_date,
                });
                setShowAddDialog(false);
                setNewReminder({ pet_id: '', type: 'vaccine', title: '', due_date: '' });
              }}
            >
              Crear recordatorio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: 'rose' | 'amber' | 'purple';
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge
          variant="secondary"
          className={cn(
            'ml-auto text-xs',
            tone === 'rose' && 'bg-rose-100 text-rose-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
            tone === 'purple' && 'bg-purple-100 text-purple-700'
          )}
        >
          {count}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

function ReminderCard({
  reminder,
  onComplete,
  onOpen,
  onSnooze,
  dueLabel,
  tone,
}: {
  reminder: {
    id: string;
    title: string;
    type: string;
    pets?: { name: string; species: string } | null;
  };
  onComplete: () => void;
  onOpen: () => void;
  onSnooze?: (days: number) => void;
  dueLabel: string;
  tone: 'rose' | 'amber' | 'purple';
}) {
  return (
    <Card
      className={cn(
        'border-l-4 transition hover:shadow-sm',
        tone === 'rose' && 'border-l-rose-500',
        tone === 'amber' && 'border-l-amber-500',
        tone === 'purple' && 'border-l-purple-600'
      )}
    >
      <CardContent className="py-3 px-3 flex items-center gap-3">
        <button
          onClick={onOpen}
          className="flex-1 text-left min-w-0"
          aria-label={`Abrir ficha de ${reminder.pets?.name || 'mascota'}`}
        >
          <p className="font-medium text-sm truncate">{reminder.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {reminder.pets?.name ? `${reminder.pets.name} · ` : ''}
            {dueLabel}
          </p>
        </button>
        {onSnooze && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Posponer recordatorio"
                className="h-11 w-11 flex-shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <Clock className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSnooze(1)}>Posponer 1 dia</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(7)}>Posponer 1 semana</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onComplete}
          aria-label="Marcar como hecho"
          className="h-11 w-11 flex-shrink-0 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
        >
          <CheckCircle2 className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
