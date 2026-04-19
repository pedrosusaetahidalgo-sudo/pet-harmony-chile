import { describe, expect, it } from 'vitest';
import {
  canTransition,
  getAvailableTransitions,
  statusToEventType,
  getBookingTable,
  getProviderColumn,
  getStatusColor,
  getStatusLabel,
  type BookingStatus,
  type ActorRole,
} from '../bookingStateMachine';

describe('bookingStateMachine / canTransition', () => {
  it('permite pendiente -> confirmado solo a provider o system', () => {
    expect(canTransition('pendiente', 'confirmado', 'provider')).toBe(true);
    expect(canTransition('pendiente', 'confirmado', 'system')).toBe(true);
    expect(canTransition('pendiente', 'confirmado', 'owner')).toBe(false);
    expect(canTransition('pendiente', 'confirmado', 'admin')).toBe(false);
  });

  it('permite pendiente -> cancelado a todos los actores principales', () => {
    expect(canTransition('pendiente', 'cancelado', 'owner')).toBe(true);
    expect(canTransition('pendiente', 'cancelado', 'provider')).toBe(true);
    expect(canTransition('pendiente', 'cancelado', 'admin')).toBe(true);
    expect(canTransition('pendiente', 'cancelado', 'system')).toBe(true);
  });

  it('permite confirmado -> en_curso solo a provider', () => {
    expect(canTransition('confirmado', 'en_curso', 'provider')).toBe(true);
    expect(canTransition('confirmado', 'en_curso', 'owner')).toBe(false);
    expect(canTransition('confirmado', 'en_curso', 'admin')).toBe(false);
  });

  it('permite confirmado -> no_show solo a provider o admin', () => {
    expect(canTransition('confirmado', 'no_show', 'provider')).toBe(true);
    expect(canTransition('confirmado', 'no_show', 'admin')).toBe(true);
    expect(canTransition('confirmado', 'no_show', 'owner')).toBe(false);
    expect(canTransition('confirmado', 'no_show', 'system')).toBe(false);
  });

  it('permite en_curso -> completado solo a provider', () => {
    expect(canTransition('en_curso', 'completado', 'provider')).toBe(true);
    expect(canTransition('en_curso', 'completado', 'owner')).toBe(false);
    expect(canTransition('en_curso', 'completado', 'admin')).toBe(false);
  });

  it('rechaza transiciones desde estados terminales', () => {
    const terminals: BookingStatus[] = ['completado', 'cancelado', 'no_show'];
    const actors: ActorRole[] = ['owner', 'provider', 'admin', 'system'];
    for (const status of terminals) {
      for (const actor of actors) {
        expect(canTransition(status, 'pendiente', actor)).toBe(false);
        expect(canTransition(status, 'confirmado', actor)).toBe(false);
      }
    }
  });

  it('rechaza saltos ilegales (pendiente -> completado)', () => {
    expect(canTransition('pendiente', 'completado', 'provider')).toBe(false);
    expect(canTransition('pendiente', 'en_curso', 'provider')).toBe(false);
  });

  it('permite en_camino -> en_curso para provider', () => {
    expect(canTransition('en_camino', 'en_curso', 'provider')).toBe(true);
    expect(canTransition('en_camino', 'en_curso', 'owner')).toBe(false);
  });
});

describe('bookingStateMachine / getAvailableTransitions', () => {
  it('retorna transiciones correctas para provider desde confirmado', () => {
    const result = getAvailableTransitions('confirmado', 'provider');
    expect(result).toEqual(
      expect.arrayContaining(['en_camino', 'en_curso', 'cancelado', 'no_show'])
    );
    expect(result).not.toContain('pendiente');
    expect(result).not.toContain('completado');
  });

  it('retorna solo cancelar para owner desde confirmado', () => {
    const result = getAvailableTransitions('confirmado', 'owner');
    expect(result).toEqual(['cancelado']);
  });

  it('retorna lista vacia desde completado', () => {
    expect(getAvailableTransitions('completado', 'provider')).toEqual([]);
    expect(getAvailableTransitions('completado', 'owner')).toEqual([]);
    expect(getAvailableTransitions('completado', 'admin')).toEqual([]);
  });
});

describe('bookingStateMachine / statusToEventType', () => {
  it('mapea cancelado a cancelled_by_owner si actor es owner', () => {
    expect(statusToEventType('cancelado', 'owner')).toBe('cancelled_by_owner');
  });

  it('mapea cancelado a cancelled_by_provider si actor es provider', () => {
    expect(statusToEventType('cancelado', 'provider')).toBe('cancelled_by_provider');
  });

  it('mapea cancelado a cancelled_by_provider si actor es admin o system', () => {
    expect(statusToEventType('cancelado', 'admin')).toBe('cancelled_by_provider');
    expect(statusToEventType('cancelado', 'system')).toBe('cancelled_by_provider');
  });

  it('mapea estados terminales al evento correcto', () => {
    expect(statusToEventType('confirmado', 'provider')).toBe('confirmed');
    expect(statusToEventType('en_camino', 'provider')).toBe('en_camino');
    expect(statusToEventType('en_curso', 'provider')).toBe('in_progress');
    expect(statusToEventType('completado', 'provider')).toBe('completed');
    expect(statusToEventType('no_show', 'provider')).toBe('no_show');
  });
});

describe('bookingStateMachine / getBookingTable', () => {
  it('retorna la tabla correcta para cada tipo', () => {
    expect(getBookingTable('vet')).toBe('vet_bookings');
    expect(getBookingTable('walk')).toBe('walk_bookings');
    expect(getBookingTable('dogsitter')).toBe('dogsitter_bookings');
    expect(getBookingTable('training')).toBe('training_bookings');
    expect(getBookingTable('generic')).toBe('bookings');
  });
});

describe('bookingStateMachine / getProviderColumn', () => {
  it('retorna el nombre de columna de provider por tipo', () => {
    expect(getProviderColumn('vet')).toBe('service_provider_id');
    expect(getProviderColumn('walk')).toBe('walker_id');
    expect(getProviderColumn('dogsitter')).toBe('dogsitter_id');
    expect(getProviderColumn('training')).toBe('trainer_id');
    expect(getProviderColumn('generic')).toBe('provider_id');
  });
});

describe('bookingStateMachine / getStatusColor y getStatusLabel', () => {
  it('retorna clases WCAG (bg + text + border) para todos los estados', () => {
    const statuses: BookingStatus[] = [
      'pendiente',
      'confirmado',
      'en_camino',
      'en_curso',
      'completado',
      'cancelado',
      'no_show',
    ];
    for (const status of statuses) {
      const cls = getStatusColor(status);
      expect(cls).toMatch(/bg-\w+-\d+/);
      expect(cls).toMatch(/text-\w+-\d+/);
      expect(cls).toMatch(/border/);
    }
  });

  it('retorna labels en espanol para todos los estados', () => {
    expect(getStatusLabel('pendiente')).toBe('Pendiente');
    expect(getStatusLabel('confirmado')).toBe('Confirmado');
    expect(getStatusLabel('en_camino')).toBe('En camino');
    expect(getStatusLabel('en_curso')).toBe('En curso');
    expect(getStatusLabel('completado')).toBe('Completado');
    expect(getStatusLabel('cancelado')).toBe('Cancelado');
    expect(getStatusLabel('no_show')).toBe('No se presento');
  });
});
