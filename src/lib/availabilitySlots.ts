/**
 * Compute available slots from provider_availability_rules, exceptions, and existing bookings.
 * Pure functions — no Supabase dependency.
 */

import { addMinutes, format, parse, isAfter, isBefore, isSameDay, getDay } from 'date-fns';

export interface AvailabilityRule {
  id: string;
  provider_id: string;
  day_of_week: number; // 0=sunday
  start_time: string; // "HH:mm"
  end_time: string;
  service_type: string | null;
  slot_duration_minutes: number;
  buffer_minutes: number;
  capacity: number;
  is_active: boolean;
}

export interface AvailabilityException {
  id: string;
  provider_id: string;
  exception_date: string; // "YYYY-MM-DD"
  exception_type: 'block' | 'override';
  start_time: string | null; // "HH:mm" or null (full day)
  end_time: string | null;
  reason: string | null;
}

export interface ExistingBooking {
  scheduled_date: string;
  start_time: string | null; // "HH:mm"
  end_time: string | null;
  status: string;
}

export interface ComputedSlot {
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  capacity: number;
  booked: number;
  available: boolean;
}

/**
 * Compute available slots for a single date.
 */
export function computeSlotsForDate(
  date: Date,
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  existingBookings: ExistingBooking[],
  serviceType?: string
): ComputedSlot[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = getDay(date); // 0=sunday

  // Check for full-day block exception
  const fullDayBlock = exceptions.find(
    (e) => e.exception_date === dateStr && e.exception_type === 'block' && !e.start_time
  );
  if (fullDayBlock) return [];

  // Get applicable rules for this day of week
  const applicableRules = rules.filter(
    (r) =>
      r.is_active &&
      r.day_of_week === dayOfWeek &&
      (!serviceType || !r.service_type || r.service_type === serviceType)
  );

  if (applicableRules.length === 0) return [];

  // Collect partial block exceptions for this date
  const partialBlocks = exceptions.filter(
    (e) => e.exception_date === dateStr && e.exception_type === 'block' && e.start_time
  );

  // Bookings for this date with active statuses
  const dateBookings = existingBookings.filter(
    (b) =>
      b.scheduled_date?.startsWith(dateStr) &&
      b.start_time &&
      !['cancelado', 'no_show'].includes(b.status)
  );

  const slots: ComputedSlot[] = [];

  for (const rule of applicableRules) {
    const ruleStart = parse(rule.start_time, 'HH:mm:ss', date);
    const ruleEnd = parse(rule.end_time, 'HH:mm:ss', date);
    const slotMinutes = rule.slot_duration_minutes;
    const bufferMinutes = rule.buffer_minutes;

    let cursor = ruleStart;

    while (true) {
      const slotEnd = addMinutes(cursor, slotMinutes);
      if (isAfter(slotEnd, ruleEnd)) break;

      const slotStartStr = format(cursor, 'HH:mm');
      const slotEndStr = format(slotEnd, 'HH:mm');

      // Check if slot is blocked by a partial exception
      const isBlocked = partialBlocks.some((block) => {
        if (!block.start_time || !block.end_time) return false;
        const blockStart = block.start_time.substring(0, 5);
        const blockEnd = block.end_time.substring(0, 5);
        return slotStartStr < blockEnd && slotEndStr > blockStart;
      });

      if (!isBlocked) {
        // Count bookings in this slot
        const bookedCount = dateBookings.filter((b) => {
          if (!b.start_time) return false;
          const bStart = b.start_time.substring(0, 5);
          return bStart === slotStartStr;
        }).length;

        slots.push({
          date: dateStr,
          start: slotStartStr,
          end: slotEndStr,
          capacity: rule.capacity,
          booked: bookedCount,
          available: bookedCount < rule.capacity,
        });
      }

      cursor = addMinutes(slotEnd, bufferMinutes);
    }
  }

  // Sort by start time and deduplicate
  return slots
    .sort((a, b) => a.start.localeCompare(b.start))
    .filter((slot, i, arr) => i === 0 || slot.start !== arr[i - 1].start);
}

/**
 * Compute slots for a date range.
 */
export function computeSlotsForRange(
  fromDate: Date,
  days: number,
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  existingBookings: ExistingBooking[],
  serviceType?: string
): { date: string; slots: ComputedSlot[] }[] {
  const result: { date: string; slots: ComputedSlot[] }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);

    const slots = computeSlotsForDate(date, rules, exceptions, existingBookings, serviceType);
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      slots,
    });
  }

  return result;
}

/**
 * Check if a specific slot is available (for booking creation).
 */
export function isSlotAvailable(
  date: string,
  startTime: string,
  rules: AvailabilityRule[],
  exceptions: AvailabilityException[],
  existingBookings: ExistingBooking[]
): boolean {
  const dateObj = new Date(date + 'T00:00:00');
  const slots = computeSlotsForDate(dateObj, rules, exceptions, existingBookings);
  const slot = slots.find((s) => s.start === startTime);
  return slot ? slot.available : false;
}

/**
 * Busca hasta `maxSuggestions` slots disponibles cercanos a un slot target.
 * Prioriza: (1) mismo dia con minima distancia horaria,
 *           (2) dias siguientes mismo horario aproximado,
 *           (3) cualquier slot disponible ordenado por cercania temporal.
 *
 * Retorna los slots sugeridos ordenados por cercania al target.
 * Se usa en colisiones de booking para ofrecer alternativas.
 */
export function findAlternativeSlots(
  targetDate: string, // "YYYY-MM-DD"
  targetStartTime: string, // "HH:mm"
  slotsByDate: { date: string; slots: ComputedSlot[] }[],
  maxSuggestions = 3
): ComputedSlot[] {
  const targetTimestamp = new Date(`${targetDate}T${targetStartTime}:00`).getTime();

  const flat: { slot: ComputedSlot; distance: number; sameDay: boolean }[] = [];
  for (const day of slotsByDate) {
    for (const slot of day.slots) {
      if (!slot.available) continue;
      // Skip the exact target slot (no point suggesting it back)
      if (slot.date === targetDate && slot.start === targetStartTime) continue;

      const slotTs = new Date(`${slot.date}T${slot.start}:00`).getTime();
      const distance = Math.abs(slotTs - targetTimestamp);
      flat.push({
        slot,
        distance,
        sameDay: slot.date === targetDate,
      });
    }
  }

  // Same-day alternatives ranked first, then chronologically closest
  flat.sort((a, b) => {
    if (a.sameDay !== b.sameDay) return a.sameDay ? -1 : 1;
    return a.distance - b.distance;
  });

  return flat.slice(0, maxSuggestions).map((e) => e.slot);
}
