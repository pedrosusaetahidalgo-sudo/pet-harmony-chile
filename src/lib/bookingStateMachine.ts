/**
 * Booking state machine — define valid transitions and helpers.
 */

export type BookingStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_camino'
  | 'en_curso'
  | 'completado'
  | 'cancelado'
  | 'no_show';

export type BookingType = 'vet' | 'walk' | 'dogsitter' | 'training' | 'generic';

export type ActorRole = 'owner' | 'provider' | 'admin' | 'system';

export type BookingEventType =
  | 'created'
  | 'confirmed'
  | 'cancelled_by_owner'
  | 'cancelled_by_provider'
  | 'rescheduled'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'reviewed'
  | 'payment_received'
  | 'payment_refunded'
  | 'reminder_sent'
  | 'en_camino';

const VALID_TRANSITIONS: Record<BookingStatus, { to: BookingStatus; actors: ActorRole[] }[]> = {
  pendiente: [
    { to: 'confirmado', actors: ['provider', 'system'] },
    { to: 'cancelado', actors: ['owner', 'provider', 'admin', 'system'] },
  ],
  confirmado: [
    { to: 'en_camino', actors: ['provider'] },
    { to: 'en_curso', actors: ['provider'] },
    { to: 'cancelado', actors: ['owner', 'provider', 'admin'] },
    { to: 'no_show', actors: ['provider', 'admin'] },
  ],
  en_camino: [
    { to: 'en_curso', actors: ['provider'] },
    { to: 'cancelado', actors: ['owner', 'provider', 'admin'] },
  ],
  en_curso: [{ to: 'completado', actors: ['provider'] }],
  completado: [],
  cancelado: [],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus, actor: ActorRole): boolean {
  const transitions = VALID_TRANSITIONS[from];
  if (!transitions) return false;
  return transitions.some((t) => t.to === to && t.actors.includes(actor));
}

export function getAvailableTransitions(
  currentStatus: BookingStatus,
  actor: ActorRole
): BookingStatus[] {
  const transitions = VALID_TRANSITIONS[currentStatus] || [];
  return transitions.filter((t) => t.actors.includes(actor)).map((t) => t.to);
}

export function statusToEventType(newStatus: BookingStatus, actor: ActorRole): BookingEventType {
  switch (newStatus) {
    case 'confirmado':
      return 'confirmed';
    case 'en_camino':
      return 'en_camino';
    case 'en_curso':
      return 'in_progress';
    case 'completado':
      return 'completed';
    case 'no_show':
      return 'no_show';
    case 'cancelado':
      return actor === 'owner' ? 'cancelled_by_owner' : 'cancelled_by_provider';
    default:
      return 'confirmed';
  }
}

export function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-800';
    case 'confirmado':
      return 'bg-blue-100 text-blue-800';
    case 'en_camino':
      return 'bg-indigo-100 text-indigo-800';
    case 'en_curso':
      return 'bg-green-100 text-green-800';
    case 'completado':
      return 'bg-emerald-100 text-emerald-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    case 'no_show':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'pendiente':
      return 'Pendiente';
    case 'confirmado':
      return 'Confirmado';
    case 'en_camino':
      return 'En camino';
    case 'en_curso':
      return 'En curso';
    case 'completado':
      return 'Completado';
    case 'cancelado':
      return 'Cancelado';
    case 'no_show':
      return 'No se presento';
    default:
      return status;
  }
}

/** Table name for each booking type */
export function getBookingTable(type: BookingType): string {
  switch (type) {
    case 'vet':
      return 'vet_bookings';
    case 'walk':
      return 'walk_bookings';
    case 'dogsitter':
      return 'dogsitter_bookings';
    case 'training':
      return 'training_bookings';
    case 'generic':
      return 'bookings';
  }
}

/** Provider column name varies by booking table */
export function getProviderColumn(type: BookingType): string {
  switch (type) {
    case 'vet':
      return 'service_provider_id';
    case 'walk':
      return 'walker_id';
    case 'dogsitter':
      return 'dogsitter_id';
    case 'training':
      return 'trainer_id';
    case 'generic':
      return 'provider_id';
  }
}
