import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  PawPrint,
  Stethoscope,
  Share2,
  Star,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from '@/lib/icons';
import { cn } from '@/lib/utils';

// ─── Queries ─────────────────────────────────────────────────────────────
interface OwnerMonthlyData {
  remindersCompleted: number;
  remindersUpcoming: number;
  bookingsConfirmed: number;
  fichasShared: number;
  newMedicalEvents: number;
  activePets: number;
  highlights: string[];
}

interface ProviderMonthlyData {
  bookingsReceived: number;
  bookingsCompleted: number;
  newPatients: number;
  consultationNotes: number;
  fichasReceived: number;
  reviewsReceived: number;
  avgRating: number | null;
  highlights: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

async function fetchOwnerMonthly(
  userId: string,
  monthStart: Date,
  monthEnd: Date
): Promise<OwnerMonthlyData> {
  const startIso = monthStart.toISOString();
  const endIso = monthEnd.toISOString();

  const [
    remindersCompletedRes,
    remindersUpcomingRes,
    bookingsV1Res,
    bookingsV2Res,
    sharesRes,
    petsRes,
    medicalEventsRes,
  ] = await Promise.all([
    sb
      .from('pet_reminders')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_completed', true)
      .gte('completed_at', startIso)
      .lte('completed_at', endIso),
    sb
      .from('pet_reminders')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_completed', false)
      .gte('due_date', startIso)
      .lte('due_date', endIso),
    sb
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('booked_at', startIso)
      .lte('booked_at', endIso),
    sb
      .from('vet_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .gte('scheduled_date', startIso)
      .lte('scheduled_date', endIso),
    sb
      .from('medical_share_tokens')
      // La columna real es owner_id (mig 20251223000000). created_by nunca existio.
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    sb
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('lifecycle_status', 'active'),
    // "Eventos medicos" = medical_records creados este mes para cualquier mascota del user.
    // Tabla es medical_records (no medical_events, que nunca existio) y se une via pets.owner_id.
    sb
      .from('medical_records')
      .select('id, pets!inner(owner_id)', { count: 'exact', head: true })
      .eq('pets.owner_id', userId)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
  ]);

  const remindersCompleted = remindersCompletedRes.count ?? 0;
  const remindersUpcoming = remindersUpcomingRes.count ?? 0;
  const bookingsConfirmed = (bookingsV1Res.count ?? 0) + (bookingsV2Res.count ?? 0);
  const fichasShared = sharesRes.count ?? 0;
  const activePets = petsRes.count ?? 0;
  const newMedicalEvents = medicalEventsRes.count ?? 0;

  const highlights: string[] = [];
  if (remindersCompleted > 0) {
    highlights.push(
      `Completaste ${remindersCompleted} ${remindersCompleted === 1 ? 'recordatorio' : 'recordatorios'} este mes.`
    );
  }
  if (bookingsConfirmed > 0) {
    highlights.push(
      `Tuviste ${bookingsConfirmed} ${bookingsConfirmed === 1 ? 'reserva' : 'reservas'} agendadas.`
    );
  }
  if (fichasShared > 0) {
    highlights.push(
      `Compartiste la ficha clínica ${fichasShared} ${fichasShared === 1 ? 'vez' : 'veces'}.`
    );
  }
  if (newMedicalEvents > 0) {
    highlights.push(
      `Registraste ${newMedicalEvents} ${newMedicalEvents === 1 ? 'evento médico' : 'eventos médicos'}.`
    );
  }
  if (remindersUpcoming > 0) {
    highlights.push(
      `Te quedan ${remindersUpcoming} ${remindersUpcoming === 1 ? 'recordatorio pendiente' : 'recordatorios pendientes'} este mes.`
    );
  }
  if (highlights.length === 0) {
    highlights.push(
      'Un mes tranquilo. Agenda una cita o registra un evento para activar tu ficha.'
    );
  }

  return {
    remindersCompleted,
    remindersUpcoming,
    bookingsConfirmed,
    fichasShared,
    newMedicalEvents,
    activePets,
    highlights,
  };
}

async function fetchProviderMonthly(
  userId: string,
  monthStart: Date,
  monthEnd: Date
): Promise<ProviderMonthlyData> {
  const startIso = monthStart.toISOString();
  const endIso = monthEnd.toISOString();

  // Obtener provider record
  const { data: provider } = await sb
    .from('service_providers')
    .select('id, avg_rating, total_reviews')
    .eq('user_id', userId)
    .maybeSingle();

  if (!provider?.id) {
    return {
      bookingsReceived: 0,
      bookingsCompleted: 0,
      newPatients: 0,
      consultationNotes: 0,
      fichasReceived: 0,
      reviewsReceived: 0,
      avgRating: null,
      highlights: ['Aún no tienes perfil de proveedor configurado.'],
    };
  }

  const [bookingsRes, patientsRes, notesRes, sharesRes, reviewsRes] = await Promise.all([
    sb
      .from('vet_bookings')
      .select('id, status', { count: 'exact' })
      .or(`service_provider_id.eq.${provider.id},vet_id.eq.${userId}`)
      .gte('scheduled_date', startIso)
      .lte('scheduled_date', endIso),
    sb
      .from('vet_clinical_notes')
      .select('pet_id')
      .eq('provider_id', provider.id)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    sb
      .from('vet_clinical_notes')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', provider.id)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    sb
      .from('medical_share_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('target_provider_id', provider.id)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    sb
      .from('service_reviews')
      .select('id, rating')
      .eq('provider_id', provider.id)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
  ]);

  const bookingsReceived = bookingsRes.count ?? 0;
  const bookingsCompleted = (bookingsRes.data ?? []).filter(
    (b: { status: string }) => b.status === 'completado'
  ).length;

  const uniquePatients = new Set((patientsRes.data ?? []).map((n: { pet_id: string }) => n.pet_id));
  const newPatients = uniquePatients.size;
  const consultationNotes = notesRes.count ?? 0;
  const fichasReceived = sharesRes.count ?? 0;
  const reviewsData = (reviewsRes.data ?? []) as Array<{ rating: number }>;
  const reviewsReceived = reviewsData.length;
  const avgRating =
    reviewsReceived > 0
      ? reviewsData.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewsReceived
      : null;

  const highlights: string[] = [];
  if (bookingsReceived > 0) {
    highlights.push(
      `Recibiste ${bookingsReceived} ${bookingsReceived === 1 ? 'reserva' : 'reservas'} (${bookingsCompleted} completadas).`
    );
  }
  if (newPatients > 0) {
    highlights.push(
      `Atendiste a ${newPatients} ${newPatients === 1 ? 'paciente' : 'pacientes'} distintos.`
    );
  }
  if (consultationNotes > 0) {
    highlights.push(
      `Registraste ${consultationNotes} ${consultationNotes === 1 ? 'nota clínica' : 'notas clínicas'}.`
    );
  }
  if (fichasReceived > 0) {
    highlights.push(
      `${fichasReceived} ${fichasReceived === 1 ? 'dueño compartió' : 'dueños compartieron'} ficha contigo.`
    );
  }
  if (reviewsReceived > 0) {
    highlights.push(
      `Te dejaron ${reviewsReceived} ${reviewsReceived === 1 ? 'reseña' : 'reseñas'}${
        avgRating ? ` (promedio ${avgRating.toFixed(1)})` : ''
      }.`
    );
  }
  if (highlights.length === 0) {
    highlights.push(
      'Mes tranquilo. Activa tu perfil público y comparte tu link para aumentar reservas.'
    );
  }

  return {
    bookingsReceived,
    bookingsCompleted,
    newPatients,
    consultationNotes,
    fichasReceived,
    reviewsReceived,
    avgRating,
    highlights,
  };
}

// ─── Component ───────────────────────────────────────────────────────────
export function LiveMonthlyReport() {
  const { user } = useAuth();
  const { role } = useActiveRole();
  const [monthOffset, setMonthOffset] = useState(0);

  const targetMonth = useMemo(
    () => (monthOffset === 0 ? new Date() : subMonths(new Date(), monthOffset)),
    [monthOffset]
  );
  const monthStart = useMemo(() => startOfMonth(targetMonth), [targetMonth]);
  const monthEnd = useMemo(() => endOfMonth(targetMonth), [targetMonth]);
  const isCurrentMonth = monthOffset === 0;

  const canGoForward = monthOffset > 0;
  const canGoBack = monthOffset < 11;

  const queryKey = ['live-monthly-report', role, user?.id, format(monthStart, 'yyyy-MM')] as const;

  const { data: ownerData, isLoading: loadingOwner } = useQuery({
    queryKey: ['owner', ...queryKey],
    queryFn: () => fetchOwnerMonthly(user!.id, monthStart, monthEnd),
    enabled: !!user?.id && role === 'owner',
    staleTime: 5 * 60 * 1000,
  });

  const { data: providerData, isLoading: loadingProvider } = useQuery({
    queryKey: ['provider', ...queryKey],
    queryFn: () => fetchProviderMonthly(user!.id, monthStart, monthEnd),
    enabled: !!user?.id && role === 'provider',
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = role === 'owner' ? loadingOwner : loadingProvider;
  const data = role === 'owner' ? ownerData : providerData;

  const monthLabel = format(targetMonth, "MMMM 'de' yyyy", { locale: es });
  const updatedLabel = isCurrentMonth ? 'Actualizado en vivo' : 'Cerrado';

  return (
    <Card className="border-purple-200/60 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 dark:from-purple-950/30 dark:via-slate-950 dark:to-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Este mes en tu red
            </CardTitle>
            <CardDescription className="capitalize mt-0.5">
              {monthLabel}{' '}
              <Badge
                variant="outline"
                className={cn(
                  'ml-1 text-[10px] px-1.5 py-0 align-middle',
                  isCurrentMonth
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                )}
              >
                {updatedLabel}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setMonthOffset((o) => o + 1)}
              disabled={!canGoBack}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() =>
                setMonthOffset((o) =>
                  isAfter(addMonths(targetMonth, 1), new Date()) ? o : Math.max(0, o - 1)
                )
              }
              disabled={!canGoForward}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-24 rounded-lg" />
          </div>
        ) : role === 'owner' && ownerData ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Tile
                label="Recordatorios hechos"
                value={ownerData.remindersCompleted}
                icon={CheckCircle2}
                tone="green"
              />
              <Tile
                label="Reservas"
                value={ownerData.bookingsConfirmed}
                icon={CalendarDays}
                tone="purple"
              />
              <Tile
                label="Fichas compartidas"
                value={ownerData.fichasShared}
                icon={Share2}
                tone="sky"
              />
              <Tile
                label="Eventos médicos"
                value={ownerData.newMedicalEvents}
                icon={FileText}
                tone="amber"
              />
            </div>
            <Highlights items={ownerData.highlights} />
            <FooterNote activePets={ownerData.activePets} />
          </>
        ) : role === 'provider' && providerData ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Tile
                label="Reservas recibidas"
                value={providerData.bookingsReceived}
                icon={CalendarDays}
                tone="purple"
              />
              <Tile
                label="Pacientes únicos"
                value={providerData.newPatients}
                icon={PawPrint}
                tone="amber"
              />
              <Tile
                label="Notas clínicas"
                value={providerData.consultationNotes}
                icon={Stethoscope}
                tone="sky"
              />
              <Tile
                label="Reseñas"
                value={providerData.reviewsReceived}
                extra={providerData.avgRating ? `${providerData.avgRating.toFixed(1)}★` : undefined}
                icon={Star}
                tone="green"
              />
            </div>
            <Highlights items={providerData.highlights} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin datos para este período.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────
function Tile({
  label,
  value,
  icon: Icon,
  tone,
  extra,
}: {
  label: string;
  value: number;
  icon: typeof TrendingUp;
  tone: 'purple' | 'green' | 'sky' | 'amber';
  extra?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-2.5 bg-white/70 dark:bg-slate-900/60',
        tone === 'purple' && 'border-purple-200/60',
        tone === 'green' && 'border-green-200/60',
        tone === 'sky' && 'border-sky-200/60',
        tone === 'amber' && 'border-amber-200/60'
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon
          className={cn(
            'h-3.5 w-3.5',
            tone === 'purple' && 'text-purple-500',
            tone === 'green' && 'text-green-500',
            tone === 'sky' && 'text-sky-500',
            tone === 'amber' && 'text-amber-500'
          )}
        />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium truncate">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold leading-tight">
        {value}
        {extra && <span className="ml-1 text-xs font-normal text-muted-foreground">· {extra}</span>}
      </p>
    </div>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg border border-purple-100/80 bg-white/80 dark:bg-slate-900/50 p-3">
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
        Lo que pasó
      </p>
      <ul className="space-y-1">
        {items.map((h, i) => (
          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
            <span className="text-purple-400 mt-0.5">•</span>
            <span className="flex-1">{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterNote({ activePets }: { activePets: number }) {
  return (
    <p className="text-[11px] text-muted-foreground text-center pt-1">
      Tienes {activePets} {activePets === 1 ? 'mascota activa' : 'mascotas activas'} en tu red ·
      datos actualizados al consultar
    </p>
  );
}
