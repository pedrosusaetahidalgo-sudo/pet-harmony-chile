/**
 * Tests for booking lifecycle using the state machine.
 * Source: src/lib/bookingStateMachine.ts
 */
import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getAvailableTransitions,
  statusToEventType,
  getStatusLabel,
  getBookingTable,
  getProviderColumn,
} from '@/lib/bookingStateMachine';
import type { BookingStatus, ActorRole } from '@/lib/bookingStateMachine';

describe('Booking state machine: valid transitions', () => {
  // Happy path: pendiente → confirmado → en_curso → completado
  it('provider can confirm a pending booking', () => {
    expect(canTransition('pendiente', 'confirmado', 'provider')).toBe(true);
  });

  it('system can auto-confirm a pending booking', () => {
    expect(canTransition('pendiente', 'confirmado', 'system')).toBe(true);
  });

  it('provider can start a confirmed booking', () => {
    expect(canTransition('confirmado', 'en_curso', 'provider')).toBe(true);
  });

  it('provider can complete an in-progress booking', () => {
    expect(canTransition('en_curso', 'completado', 'provider')).toBe(true);
  });

  // En camino flow
  it('provider can mark as en_camino from confirmado', () => {
    expect(canTransition('confirmado', 'en_camino', 'provider')).toBe(true);
  });

  it('provider can start from en_camino', () => {
    expect(canTransition('en_camino', 'en_curso', 'provider')).toBe(true);
  });
});

describe('Booking state machine: cancellation', () => {
  it('owner can cancel a pending booking', () => {
    expect(canTransition('pendiente', 'cancelado', 'owner')).toBe(true);
  });

  it('owner can cancel a confirmed booking', () => {
    expect(canTransition('confirmado', 'cancelado', 'owner')).toBe(true);
  });

  it('provider can cancel a confirmed booking', () => {
    expect(canTransition('confirmado', 'cancelado', 'provider')).toBe(true);
  });

  it('admin can cancel from any cancellable state', () => {
    expect(canTransition('pendiente', 'cancelado', 'admin')).toBe(true);
    expect(canTransition('confirmado', 'cancelado', 'admin')).toBe(true);
    expect(canTransition('en_camino', 'cancelado', 'admin')).toBe(true);
  });
});

describe('Booking state machine: invalid transitions', () => {
  it('owner cannot confirm (only provider/system)', () => {
    expect(canTransition('pendiente', 'confirmado', 'owner')).toBe(false);
  });

  it('owner cannot start a booking', () => {
    expect(canTransition('confirmado', 'en_curso', 'owner')).toBe(false);
  });

  it('completed bookings cannot transition', () => {
    expect(canTransition('completado', 'cancelado', 'admin')).toBe(false);
    expect(canTransition('completado', 'pendiente', 'provider')).toBe(false);
  });

  it('cancelled bookings cannot transition', () => {
    expect(canTransition('cancelado', 'pendiente', 'admin')).toBe(false);
  });

  it('cannot skip states (pendiente → completado)', () => {
    expect(canTransition('pendiente', 'completado', 'provider')).toBe(false);
  });

  it('cannot go backwards (en_curso → confirmado)', () => {
    expect(canTransition('en_curso', 'confirmado', 'provider')).toBe(false);
  });
});

describe('Booking state machine: no_show', () => {
  it('provider can mark no_show from confirmado', () => {
    expect(canTransition('confirmado', 'no_show', 'provider')).toBe(true);
  });

  it('admin can mark no_show', () => {
    expect(canTransition('confirmado', 'no_show', 'admin')).toBe(true);
  });

  it('owner cannot mark no_show', () => {
    expect(canTransition('confirmado', 'no_show', 'owner')).toBe(false);
  });
});

describe('getAvailableTransitions', () => {
  it('provider sees confirm + cancel + en_camino + en_curso + no_show from confirmado', () => {
    const transitions = getAvailableTransitions('confirmado', 'provider');
    expect(transitions).toContain('en_camino');
    expect(transitions).toContain('en_curso');
    expect(transitions).toContain('cancelado');
    expect(transitions).toContain('no_show');
  });

  it('owner only sees cancel from confirmado', () => {
    const transitions = getAvailableTransitions('confirmado', 'owner');
    expect(transitions).toEqual(['cancelado']);
  });

  it('no transitions from completado', () => {
    expect(getAvailableTransitions('completado', 'admin')).toEqual([]);
  });
});

describe('statusToEventType', () => {
  it('maps confirmado → confirmed', () => {
    expect(statusToEventType('confirmado', 'provider')).toBe('confirmed');
  });

  it('maps cancelado by owner → cancelled_by_owner', () => {
    expect(statusToEventType('cancelado', 'owner')).toBe('cancelled_by_owner');
  });

  it('maps cancelado by provider → cancelled_by_provider', () => {
    expect(statusToEventType('cancelado', 'provider')).toBe('cancelled_by_provider');
  });

  it('maps completado → completed', () => {
    expect(statusToEventType('completado', 'provider')).toBe('completed');
  });

  it('maps no_show → no_show', () => {
    expect(statusToEventType('no_show', 'provider')).toBe('no_show');
  });
});

describe('getStatusLabel', () => {
  it('returns Spanish labels', () => {
    expect(getStatusLabel('pendiente')).toBe('Pendiente');
    expect(getStatusLabel('confirmado')).toBe('Confirmado');
    expect(getStatusLabel('en_camino')).toBe('En camino');
    expect(getStatusLabel('en_curso')).toBe('En curso');
    expect(getStatusLabel('completado')).toBe('Completado');
    expect(getStatusLabel('cancelado')).toBe('Cancelado');
    expect(getStatusLabel('no_show')).toBe('No se presento');
  });
});

describe('getBookingTable', () => {
  it('maps booking types to table names', () => {
    expect(getBookingTable('vet')).toBe('vet_bookings');
    expect(getBookingTable('walk')).toBe('walk_bookings');
    expect(getBookingTable('dogsitter')).toBe('dogsitter_bookings');
    expect(getBookingTable('training')).toBe('training_bookings');
    expect(getBookingTable('generic')).toBe('bookings');
  });
});

describe('getProviderColumn', () => {
  it('maps booking types to provider columns', () => {
    expect(getProviderColumn('vet')).toBe('service_provider_id');
    expect(getProviderColumn('walk')).toBe('walker_id');
    expect(getProviderColumn('dogsitter')).toBe('dogsitter_id');
    expect(getProviderColumn('training')).toBe('trainer_id');
    expect(getProviderColumn('generic')).toBe('provider_id');
  });
});
