/**
 * EmptyStateIllustration — ilustraciones del brand kit v2 para estados
 * vacios. Renderiza un SVG de `public/paw-friend-assets-v2/illustrations/empty-states/`.
 *
 * Fallback: si la ilustracion no carga, renderiza solo el texto
 * (sin placeholder) — no queremos forzar iconos genericos en los
 * empty states porque romperian la estetica.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateKind =
  | 'appointments'
  | 'bookings'
  | 'conversations'
  | 'medical_records'
  | 'notifications'
  | 'paw_cards';

const ILLUSTRATION_PATH: Record<EmptyStateKind, string> = {
  appointments: '/paw-friend-assets-v2/illustrations/empty-states/no_appointments.svg',
  bookings: '/paw-friend-assets-v2/illustrations/empty-states/no_bookings.svg',
  conversations: '/paw-friend-assets-v2/illustrations/empty-states/no_conversations.svg',
  medical_records: '/paw-friend-assets-v2/illustrations/empty-states/no_medical_records.svg',
  notifications: '/paw-friend-assets-v2/illustrations/empty-states/no_notifications.svg',
  paw_cards: '/paw-friend-assets-v2/illustrations/empty-states/no_paw_cards.svg',
};

const DEFAULT_ALT: Record<EmptyStateKind, string> = {
  appointments: 'Sin citas agendadas',
  bookings: 'Sin reservas',
  conversations: 'Sin conversaciones',
  medical_records: 'Sin registros medicos',
  notifications: 'Sin notificaciones',
  paw_cards: 'Sin Paw Cards',
};

interface Props {
  kind: EmptyStateKind;
  className?: string;
  'aria-label'?: string;
}

export function EmptyStateIllustration({ kind, className, 'aria-label': ariaLabel }: Props) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- graceful fallback: ocultamos la ilustracion si el archivo no carga
    <img
      src={ILLUSTRATION_PATH[kind]}
      alt={ariaLabel || DEFAULT_ALT[kind]}
      className={cn('block mx-auto max-w-full h-auto', className)}
      onError={() => setBroken(true)}
      loading="lazy"
    />
  );
}
