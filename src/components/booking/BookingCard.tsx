import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Stethoscope,
  Dog,
  Cat,
  PawPrint,
  AlertTriangle,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from './BookingStatusBadge';
import {
  getAvailableTransitions,
  type BookingStatus,
  type BookingType,
  type ActorRole,
} from '@/lib/bookingStateMachine';

export interface BookingCardData {
  id: string;
  booking_type: BookingType;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  service_type: string;
  status: BookingStatus;
  is_emergency: boolean;
  total_price: number | null;
  provider_name?: string | null;
  provider_avatar?: string | null;
  owner_name?: string | null;
  owner_avatar?: string | null;
  pet_name?: string | null;
  pet_species?: string | null;
  pet_photo?: string | null;
}

export type BookingAction =
  | 'confirm'
  | 'cancel'
  | 'reschedule'
  | 'start'
  | 'complete'
  | 'no_show'
  | 'review'
  | 'detail';

interface BookingCardProps {
  booking: BookingCardData;
  role: 'owner' | 'provider';
  onAction: (action: BookingAction, booking: BookingCardData) => void;
}

const PetIcon = ({ species }: { species?: string | null }) => {
  if (species === 'perro' || species === 'dog') return <Dog className="h-4 w-4" />;
  if (species === 'gato' || species === 'cat') return <Cat className="h-4 w-4" />;
  return <PawPrint className="h-4 w-4" />;
};

const serviceLabel = (type: string): string => {
  const labels: Record<string, string> = {
    consulta_general: 'Consulta general',
    vacunacion: 'Vacunacion',
    cirugia: 'Cirugia',
    emergencia: 'Emergencia',
    dental: 'Dental',
    walk: 'Paseo',
    dogsitter: 'Cuidado',
    training: 'Entrenamiento',
    grooming: 'Peluqueria',
  };
  return labels[type] || type;
};

export function BookingCard({ booking, role, onAction }: BookingCardProps) {
  const date = new Date(booking.scheduled_date);
  const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });
  const timeStr = booking.start_time
    ? `${booking.start_time.substring(0, 5)}${booking.end_time ? ' - ' + booking.end_time.substring(0, 5) : ''}`
    : 'Hora por confirmar';

  const contactName = role === 'owner' ? booking.provider_name : booking.owner_name;
  const contactAvatar = role === 'owner' ? booking.provider_avatar : booking.owner_avatar;

  const actorRole: ActorRole = role;
  const transitions = getAvailableTransitions(booking.status, actorRole);

  return (
    <Card
      className={`overflow-hidden ${booking.is_emergency ? 'border-red-300 bg-red-50/30' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header: status + emergency */}
            <div className="flex items-center gap-2 flex-wrap">
              <BookingStatusBadge status={booking.status} />
              {booking.is_emergency && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="h-3 w-3" /> Emergencia
                </span>
              )}
              <span className="text-xs text-muted-foreground capitalize">
                {serviceLabel(booking.service_type)}
              </span>
            </div>

            {/* Date & time */}
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="capitalize">{formattedDate}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {timeStr}
              </span>
            </div>

            {/* Contact + pet */}
            <div className="flex items-center gap-3 text-sm">
              {contactName && (
                <span className="inline-flex items-center gap-1.5">
                  {contactAvatar ? (
                    <img src={contactAvatar} className="h-5 w-5 rounded-full object-cover" alt="" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium truncate max-w-[150px]">{contactName}</span>
                </span>
              )}
              {booking.pet_name && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <PetIcon species={booking.pet_species} />
                  {booking.pet_name}
                </span>
              )}
            </div>

            {/* Price */}
            {booking.total_price != null && booking.total_price > 0 && (
              <p className="text-sm font-semibold">
                ${booking.total_price.toLocaleString('es-CL')}
              </p>
            )}
          </div>

          {/* Right: pet photo */}
          {booking.pet_photo && (
            <img
              src={booking.pet_photo}
              alt={booking.pet_name ?? ''}
              className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => onAction('detail', booking)}>
            Ver detalle
          </Button>

          {role === 'owner' && booking.status === 'completado' && (
            <Button variant="outline" size="sm" onClick={() => onAction('review', booking)}>
              Dejar resena
            </Button>
          )}

          {role === 'owner' && ['pendiente', 'confirmado'].includes(booking.status) && (
            <>
              <Button variant="outline" size="sm" onClick={() => onAction('reschedule', booking)}>
                Reprogramar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onAction('cancel', booking)}>
                Cancelar
              </Button>
            </>
          )}

          {role === 'provider' && booking.status === 'pendiente' && (
            <Button size="sm" onClick={() => onAction('confirm', booking)}>
              Confirmar
            </Button>
          )}

          {role === 'provider' && booking.status === 'confirmado' && (
            <>
              <Button size="sm" onClick={() => onAction('start', booking)}>
                Iniciar atencion
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction('no_show', booking)}>
                No se presento
              </Button>
            </>
          )}

          {role === 'provider' && booking.status === 'en_curso' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onAction('complete', booking)}
            >
              Completar
            </Button>
          )}

          {role === 'provider' && ['pendiente', 'confirmado'].includes(booking.status) && (
            <Button variant="destructive" size="sm" onClick={() => onAction('cancel', booking)}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
