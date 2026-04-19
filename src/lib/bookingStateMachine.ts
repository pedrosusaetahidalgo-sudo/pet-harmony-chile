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

/**
 * Paleta WCAG AA para badges de estado.
 * Contraste verificado en bg-*-50 + text-*-900 (+ border-*-200 para refuerzo).
 */
export function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'pendiente':
      return 'bg-amber-50 text-amber-900 border border-amber-200';
    case 'confirmado':
      return 'bg-emerald-50 text-emerald-900 border border-emerald-200';
    case 'en_camino':
      return 'bg-sky-50 text-sky-900 border border-sky-200';
    case 'en_curso':
      return 'bg-indigo-50 text-indigo-900 border border-indigo-200';
    case 'completado':
      return 'bg-green-50 text-green-900 border border-green-300';
    case 'cancelado':
      return 'bg-slate-50 text-slate-700 border border-slate-200';
    case 'no_show':
      return 'bg-red-50 text-red-900 border border-red-200';
    default:
      return 'bg-gray-50 text-gray-900 border border-gray-200';
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
