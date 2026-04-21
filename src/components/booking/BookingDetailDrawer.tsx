import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  PawPrint,
  User,
  CheckCircle2,
  Play,
  ArrowRight,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBookingDetail } from '@/hooks/useBookingDetail';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingTimeline } from './BookingTimeline';
import { BookingToMedicalRecordCTA } from './BookingToMedicalRecordCTA';
import { BookingPrivateNotes } from './BookingPrivateNotes';
import { PatientBriefing } from '@/components/provider/PatientBriefing';
import type { BookingType } from '@/lib/bookingStateMachine';
import { formatCLP, formatBookingDate, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';

interface BookingDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | undefined;
  bookingType: BookingType;
  /**
   * Rol desde el que se ve el detalle. Define qué secciones privadas
   * se muestran (ej: private_notes solo para provider/admin).
   * Default 'owner' por seguridad.
   */
  viewerRole?: 'owner' | 'provider' | 'admin';
}

export function BookingDetailDrawer({
  open,
  onOpenChange,
  bookingId,
  bookingType,
  viewerRole = 'owner',
}: BookingDetailDrawerProps) {
  const { data, isLoading } = useBookingDetail(bookingId, bookingType);
  const isVetViewer = viewerRole === 'provider' || viewerRole === 'admin';
  // CC-08: en mobile se abre como bottom-sheet (ergonomia thumb).
  // En desktop se mantiene como drawer derecho.
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'h-[92vh] max-h-[92vh] rounded-t-2xl overflow-y-auto'
            : 'w-full sm:max-w-lg overflow-y-auto'
        }
      >
        <SheetHeader>
          <SheetTitle>Detalle de la reserva</SheetTitle>
          <SheetDescription>
            Información completa y timeline de eventos de esta reserva.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No se pudo cargar la reserva.
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <BookingStatusBadge status={data.status} />
              {data.is_emergency && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Emergencia
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">#{data.id.slice(0, 8)}</span>
            </div>

            {/* Pet + Owner */}
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={data.pet_photo ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <PawPrint className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {data.pet_name ?? 'Sin mascota'}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {data.pet_species ?? '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-dashed">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={data.owner_avatar ?? undefined} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Dueño</div>
                  <div className="text-sm font-medium truncate">
                    {data.owner_name ?? 'Sin nombre'}
                  </div>
                </div>
              </div>
            </div>

            {/* Date + service */}
            <div className="grid grid-cols-2 gap-3">
              <InfoTile
                icon={<CalendarDays className="h-4 w-4" />}
                label="Fecha"
                value={formatBookingDate(data.scheduled_date) || '—'}
              />
              <InfoTile
                icon={<Clock className="h-4 w-4" />}
                label="Horario"
                value={formatTimeRange(data.start_time, data.end_time) || '—'}
              />
              <InfoTile label="Servicio" value={data.service_type || '—'} className="col-span-2" />
              {data.total_price != null && (
                <InfoTile
                  label="Precio"
                  value={formatCLP(data.total_price)}
                  className="col-span-2"
                />
              )}
            </div>

            {/* Metadata extendida (timestamps + follow-up link) */}
            <BookingMetaStrip
              confirmedAt={data.confirmed_at}
              startedAt={data.started_at}
              completedAt={data.status === 'completado' ? (data.canceled_at ?? null) : null}
              followUpBookingId={data.follow_up_booking_id}
              bookingType={data.booking_type}
            />

            {/* CC-29: PatientBriefing solo para vet/admin viendo bookings vet. */}
            {isVetViewer && data.booking_type === 'vet' && data.pet_id && (
              <PatientBriefing petId={data.pet_id} />
            )}

            {/* Cita completada -> crear/ver nota clinica */}
            {data.status === 'completado' && data.pet_id && (
              <BookingToMedicalRecordCTA
                bookingId={data.id}
                petId={data.pet_id}
                existingMedicalRecordId={
                  data.linked_vet_clinical_note_id ?? data.linked_medical_record_id ?? null
                }
              />
            )}

            {/* Notas privadas del vet (solo visible para provider/admin) */}
            {isVetViewer && data.booking_type === 'vet' && (
              <BookingPrivateNotes
                bookingId={data.id}
                bookingType="vet"
                initialValue={data.private_notes}
              />
            )}

            {/* Sintomas / razon cancelacion */}
            {data.symptoms && (
              <div className="rounded-lg border p-3 space-y-1 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Síntomas reportados
                </div>
                <p className="text-sm text-foreground/80">{data.symptoms}</p>
              </div>
            )}
            {data.cancellation_reason && (
              <div className="rounded-lg border p-3 space-y-1 bg-red-50/60 dark:bg-red-950/20 border-red-200/60">
                <div className="text-xs font-semibold text-red-800 dark:text-red-200">
                  Motivo de cancelación
                </div>
                <p className="text-sm text-foreground/80">{data.cancellation_reason}</p>
              </div>
            )}

            {/* Timeline */}
            <BookingTimeline events={data.events} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoTile({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border p-2.5 space-y-0.5 bg-background', className)}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function BookingMetaStrip({
  confirmedAt,
  startedAt,
  followUpBookingId,
  bookingType,
}: {
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  followUpBookingId: string | null;
  bookingType: BookingType;
}) {
  const items: Array<{ icon: React.ReactNode; label: string; value: string }> = [];

  if (confirmedAt) {
    items.push({
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-700" aria-hidden="true" />,
      label: 'Confirmada',
      value: format(new Date(confirmedAt), 'd MMM · HH:mm', { locale: es }),
    });
  }
  if (startedAt) {
    items.push({
      icon: <Play className="h-3 w-3 text-indigo-700" aria-hidden="true" />,
      label: 'Iniciada',
      value: format(new Date(startedAt), 'd MMM · HH:mm', { locale: es }),
    });
  }

  if (items.length === 0 && !followUpBookingId) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2 space-y-1.5">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-slate-700">
              {item.icon}
              <span className="font-medium">{item.label}:</span>
              <span className="text-slate-600">{item.value}</span>
            </span>
          ))}
        </div>
      )}
      {followUpBookingId && bookingType === 'vet' && (
        <Link
          to={`/provider/dashboard?booking=${followUpBookingId}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
        >
          Ver cita de seguimiento
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
