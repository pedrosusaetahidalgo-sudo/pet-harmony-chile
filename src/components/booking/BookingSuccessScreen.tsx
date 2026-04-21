import { CheckCircle2, Calendar, Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';

interface BookingSuccessScreenProps {
  /** status real del booking ('confirmado' vs 'pendiente' cambia copy). */
  status: 'confirmado' | 'pendiente';
  /** Fecha del booking ISO o "YYYY-MM-DD". */
  scheduledDate: string;
  /** "HH:mm" opcional. */
  startTime?: string;
  /** Nombre del proveedor / veterinario. */
  providerName: string;
  /** Nombre de la mascota. */
  petName?: string;
  /** Callback para cerrar el wizard/modal. */
  onClose?: () => void;
}

/**
 * CC-24 — pantalla de confirmación post-booking del wizard.
 *
 * Antes: el usuario solo veía un toast efímero y el drawer se cerraba.
 * Ahora: confirmación explícita con CTAs a /calendario y /mis-reservas
 * + recordatorio de que avisamos 24h antes.
 *
 * Si status='pendiente' el copy aclara que está esperando confirmación
 * del veterinario.
 */
export function BookingSuccessScreen({
  status,
  scheduledDate,
  startTime,
  providerName,
  petName,
  onClose,
}: BookingSuccessScreenProps) {
  const navigate = useNavigate();

  const isConfirmed = status === 'confirmado';
  const dateObj = scheduledDate.includes('T')
    ? new Date(scheduledDate)
    : new Date(scheduledDate + 'T12:00:00');
  const dateLabel = format(dateObj, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-5 py-4 text-center">
      {/* Icon hero */}
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
      </div>

      {/* Headline */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {isConfirmed ? '¡Cita agendada!' : 'Solicitud enviada'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isConfirmed
            ? 'Te vamos a avisar con un recordatorio 24 horas antes.'
            : 'El veterinario confirmará tu hora en los próximos minutos.'}
        </p>
      </div>

      {/* Resumen */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1 text-sm mx-2">
        {petName && (
          <p className="text-xs text-muted-foreground">
            Paciente: <span className="font-medium text-foreground">{petName}</span>
          </p>
        )}
        <p className="font-medium capitalize">{dateLabel}</p>
        {startTime && (
          <p className="text-xs text-muted-foreground">
            a las <span className="font-semibold text-foreground">{startTime}</span> · hora Chile
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Con <span className="font-medium text-foreground">{providerName}</span>
        </p>
      </div>

      {/* Sub-beneficios */}
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground px-4">
        <div className="flex items-center gap-2 justify-center">
          <Bell className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />
          Recordatorios automáticos en WhatsApp y push
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Calendar className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />
          Sincronizada con tu Google Calendar (si lo conectaste)
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2 px-2">
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            onClose?.();
            navigate(LINKS.bookingsTab());
          }}
        >
          Ver mis reservas
          <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onClose?.();
            navigate(LINKS.calendar());
          }}
        >
          Ir al calendario
        </Button>
        {onClose && (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
    </div>
  );
}
