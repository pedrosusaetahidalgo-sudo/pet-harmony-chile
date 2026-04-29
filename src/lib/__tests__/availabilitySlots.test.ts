/**
 * Tests de availabilitySlots (Sprint 1 P1, 2026-04-28).
 *
 * Logica pura del slot computation. Critica para el flujo de reserva
 * (CC-17 Booking V3): si esta logica genera slots erroneos, todo el
 * funnel de booking se rompe. Estos tests congelan el contrato.
 */
import { describe, it, expect } from 'vitest';
import {
  computeSlotsForDate,
  computeSlotsForRange,
  type AvailabilityRule,
  type AvailabilityException,
  type ExistingBooking,
} from '../availabilitySlots';

const PROVIDER_ID = 'test-provider';

function rule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return {
    id: 'r1',
    provider_id: PROVIDER_ID,
    day_of_week: 1, // Monday
    start_time: '09:00:00',
    end_time: '12:00:00',
    service_type: null,
    slot_duration_minutes: 30,
    buffer_minutes: 0,
    capacity: 1,
    is_active: true,
    ...overrides,
  };
}

// Lunes 2026-05-04 (day_of_week = 1)
const MONDAY = new Date('2026-05-04T12:00:00Z');

describe('computeSlotsForDate', () => {
  it('genera slots de 30 min entre 9-12 → 6 slots', () => {
    const slots = computeSlotsForDate(MONDAY, [rule()], [], []);
    expect(slots.length).toBe(6); // 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
    expect(slots[0].start).toBe('09:00');
    expect(slots[0].end).toBe('09:30');
    expect(slots[5].start).toBe('11:30');
    expect(slots[5].end).toBe('12:00');
  });

  it('respeta buffer_minutes entre slots', () => {
    const slots = computeSlotsForDate(MONDAY, [rule({ buffer_minutes: 15 })], [], []);
    // 30min slot + 15min buffer = 45min total per slot
    // 9:00-9:30 → buffer → 9:45-10:15 → buffer → 10:30-11:00 → buffer → 11:15-11:45
    expect(slots.length).toBe(4);
    expect(slots[1].start).toBe('09:45');
  });

  it('si rule no esta activa, no genera slots', () => {
    const slots = computeSlotsForDate(MONDAY, [rule({ is_active: false })], [], []);
    expect(slots).toEqual([]);
  });

  it('si day_of_week no matchea, no genera slots', () => {
    const slots = computeSlotsForDate(MONDAY, [rule({ day_of_week: 2 })], [], []);
    expect(slots).toEqual([]);
  });

  it('full-day block exception cancela todo', () => {
    const exception: AvailabilityException = {
      id: 'e1',
      provider_id: PROVIDER_ID,
      exception_date: '2026-05-04',
      exception_type: 'block',
      start_time: null, // full day
      end_time: null,
      reason: 'Vacaciones',
    };
    const slots = computeSlotsForDate(MONDAY, [rule()], [exception], []);
    expect(slots).toEqual([]);
  });

  it('partial block remueve slots que solapan', () => {
    const exception: AvailabilityException = {
      id: 'e1',
      provider_id: PROVIDER_ID,
      exception_date: '2026-05-04',
      exception_type: 'block',
      start_time: '10:00',
      end_time: '11:00',
      reason: 'Reunion',
    };
    const slots = computeSlotsForDate(MONDAY, [rule()], [exception], []);
    // Bloquea 10:00-11:00 → quedan 9:00, 9:30, 11:00, 11:30
    expect(slots.length).toBe(4);
    expect(slots.map((s) => s.start)).toEqual(['09:00', '09:30', '11:00', '11:30']);
  });

  it('booking ocupa slot (capacity 1) → marca available=false', () => {
    const booking: ExistingBooking = {
      scheduled_date: '2026-05-04',
      start_time: '10:00:00',
      end_time: '10:30:00',
      status: 'confirmado',
    };
    const slots = computeSlotsForDate(MONDAY, [rule()], [], [booking]);
    const slot10 = slots.find((s) => s.start === '10:00');
    expect(slot10?.booked).toBe(1);
    expect(slot10?.available).toBe(false);
  });

  it('booking cancelado NO ocupa el slot', () => {
    const booking: ExistingBooking = {
      scheduled_date: '2026-05-04',
      start_time: '10:00:00',
      end_time: '10:30:00',
      status: 'cancelado',
    };
    const slots = computeSlotsForDate(MONDAY, [rule()], [], [booking]);
    const slot10 = slots.find((s) => s.start === '10:00');
    expect(slot10?.booked).toBe(0);
    expect(slot10?.available).toBe(true);
  });

  it('no_show NO ocupa el slot (sigue libre para rebook)', () => {
    const booking: ExistingBooking = {
      scheduled_date: '2026-05-04',
      start_time: '10:00:00',
      end_time: '10:30:00',
      status: 'no_show',
    };
    const slots = computeSlotsForDate(MONDAY, [rule()], [], [booking]);
    const slot10 = slots.find((s) => s.start === '10:00');
    expect(slot10?.available).toBe(true);
  });

  it('capacity 2 con 1 booking → sigue available', () => {
    const booking: ExistingBooking = {
      scheduled_date: '2026-05-04',
      start_time: '10:00:00',
      end_time: '10:30:00',
      status: 'confirmado',
    };
    const slots = computeSlotsForDate(MONDAY, [rule({ capacity: 2 })], [], [booking]);
    const slot10 = slots.find((s) => s.start === '10:00');
    expect(slot10?.booked).toBe(1);
    expect(slot10?.available).toBe(true);
  });

  it('serviceType filtra rules con service_type !== null', () => {
    const rules = [
      rule({ id: 'r1', service_type: 'consulta' }),
      rule({ id: 'r2', service_type: 'vacuna', start_time: '14:00:00', end_time: '15:00:00' }),
    ];
    const slots = computeSlotsForDate(MONDAY, rules, [], [], 'consulta');
    expect(slots.every((s) => s.start < '14:00')).toBe(true);
  });

  it('rule sin service_type acepta cualquier serviceType filtrado', () => {
    const rules = [
      rule({ service_type: null }), // catchall
      rule({ id: 'r2', service_type: 'vacuna', start_time: '14:00:00', end_time: '15:00:00' }),
    ];
    const slotsConsulta = computeSlotsForDate(MONDAY, rules, [], [], 'consulta');
    // Solo el catchall matchea, vacuna no matchea consulta.
    expect(slotsConsulta.length).toBe(6);
  });

  it('varias rules en mismo dia se mergean y dedup por start time', () => {
    const rules = [
      rule({ id: 'r1', start_time: '09:00:00', end_time: '11:00:00' }),
      rule({ id: 'r2', start_time: '10:00:00', end_time: '12:00:00' }),
    ];
    const slots = computeSlotsForDate(MONDAY, rules, [], []);
    // Sin dedup: r1 produce 9:00, 9:30, 10:00, 10:30; r2 produce 10:00, 10:30, 11:00, 11:30
    // Con dedup por start: 9:00, 9:30, 10:00, 10:30, 11:00, 11:30 (6 slots).
    expect(slots.length).toBe(6);
  });
});

describe('computeSlotsForRange', () => {
  it('genera array de fechas con slots por dia', () => {
    const result = computeSlotsForRange(MONDAY, 7, [rule()], [], []);
    expect(result.length).toBe(7);
    expect(result[0].date).toBe('2026-05-04'); // lunes
    expect(result[0].slots.length).toBe(6);
    expect(result[1].date).toBe('2026-05-05'); // martes (no hay rule day_of_week=2)
    expect(result[1].slots).toEqual([]);
  });

  it('solo incluye dias con slots o vacios? — confirma estructura', () => {
    const result = computeSlotsForRange(MONDAY, 3, [rule()], [], []);
    expect(result.every((d) => typeof d.date === 'string')).toBe(true);
    expect(result.every((d) => Array.isArray(d.slots))).toBe(true);
  });

  it('exception cubre solo el dia especifico', () => {
    const exception: AvailabilityException = {
      id: 'e1',
      provider_id: PROVIDER_ID,
      exception_date: '2026-05-04',
      exception_type: 'block',
      start_time: null,
      end_time: null,
      reason: null,
    };
    // Si pongo dos lunes en el rango (4 y 11 mayo), solo el 4 esta bloqueado.
    const result = computeSlotsForRange(MONDAY, 8, [rule()], [exception], []);
    const may4 = result.find((d) => d.date === '2026-05-04');
    const may11 = result.find((d) => d.date === '2026-05-11');
    expect(may4?.slots).toEqual([]);
    expect(may11?.slots.length).toBe(6); // sigue disponible
  });
});
