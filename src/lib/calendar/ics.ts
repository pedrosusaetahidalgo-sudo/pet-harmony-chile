/**
 * CC-32 (Booking V3 Master Plan §20 + §28 TICKET-29) — generador de
 * archivos ICS (iCalendar, RFC 5545) para que el tutor pueda
 * importar sus reservas a Apple Calendar, Outlook u otros clientes
 * que no sean Google Calendar.
 *
 * Feature-gated con FEATURE_FLAGS.ICS_EXPORT.
 *
 * Referencias:
 *   - RFC 5545 §3.6.1 VEVENT component
 *   - CRLF (\r\n) obligatorio entre líneas
 *   - Líneas > 75 bytes deben plegarse (folding) — no implementamos
 *     folding hoy porque los clientes modernos toleran líneas largas
 *     para los campos que usamos (SUMMARY/DESCRIPTION cortos).
 */

export interface IcsEvent {
  /** ID único y estable entre exports. Formato: "<kind>-<uuid>@pawfriend.cl". */
  uid: string;
  /** Fecha/hora inicio en UTC (ISO 8601) o local sin tz. */
  startsAt: string;
  /** Fecha/hora fin. Si no está, se infiere +30 min. */
  endsAt?: string;
  summary: string;
  description?: string;
  location?: string;
  /** URL al booking en la app (deep link). */
  url?: string;
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
}

function icsDate(iso: string): string {
  // "2026-08-14T14:00:00Z" → "20260814T140000Z"
  // Postgres TIMESTAMPTZ por default llega como ISO con Z; si viene sin Z,
  // asumimos local y lo tratamos como "floating time" (sin Z).
  const clean = iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
  return clean;
}

function escapeIcsText(s: string): string {
  // RFC 5545 §3.3.11: escapar backslash, comma, semicolon, newline.
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/**
 * Genera un archivo .ics válido con uno o más VEVENT.
 * Retorna el contenido como string (listo para Blob + download).
 */
export function buildIcs(events: IcsEvent[], calendarName = 'Paw Friend'): string {
  const now = icsDate(new Date().toISOString());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paw Friend//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:America/Santiago',
  ];

  for (const ev of events) {
    const dtStart = icsDate(ev.startsAt);
    const dtEnd = ev.endsAt
      ? icsDate(ev.endsAt)
      : icsDate(new Date(new Date(ev.startsAt).getTime() + 30 * 60_000).toISOString());

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(ev.summary)}`
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    lines.push(`STATUS:${ev.status ?? 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Dispara descarga de un archivo .ics en el navegador. SSR-safe.
 */
export function downloadIcs(content: string, filename = 'paw-friend.ics'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Helper para el caso común del tutor: convierte un booking de v_all_bookings
 * a IcsEvent.
 */
export function bookingToIcsEvent(booking: {
  id: string;
  kind?: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  service_type: string;
  status: string;
  pet_name?: string | null;
  provider_name?: string | null;
  provider_address?: string | null;
}): IcsEvent {
  const date = booking.scheduled_date.split('T')[0];

  // Combinar date + time. Si no hay start_time, usar el scheduled_date tal cual.
  const startsAt = booking.start_time
    ? `${date}T${booking.start_time.length === 5 ? booking.start_time + ':00' : booking.start_time}-03:00`
    : booking.scheduled_date;

  const endsAt = booking.end_time
    ? `${date}T${booking.end_time.length === 5 ? booking.end_time + ':00' : booking.end_time}-03:00`
    : undefined;

  const summary = `🐾 ${booking.service_type}${booking.pet_name ? ` — ${booking.pet_name}` : ''}`;

  const description = [
    booking.provider_name ? `Con: ${booking.provider_name}` : null,
    `Reserva de Paw Friend (ID ${booking.id.slice(0, 8)})`,
  ]
    .filter(Boolean)
    .join('\n');

  const statusMap: Record<string, IcsEvent['status']> = {
    pendiente: 'TENTATIVE',
    confirmado: 'CONFIRMED',
    en_curso: 'CONFIRMED',
    en_camino: 'CONFIRMED',
    completado: 'CONFIRMED',
    cancelado: 'CANCELLED',
    no_show: 'CANCELLED',
  };

  return {
    uid: `${booking.kind ?? 'booking'}-${booking.id}@pawfriend.cl`,
    startsAt,
    endsAt,
    summary,
    description,
    location: booking.provider_address ?? undefined,
    url: `https://pawfriend.cl/mis-reservas?highlight=${booking.id}`,
    status: statusMap[booking.status] ?? 'CONFIRMED',
  };
}
