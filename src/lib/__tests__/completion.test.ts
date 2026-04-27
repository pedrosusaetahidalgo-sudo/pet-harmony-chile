/**
 * Tests para src/lib/completion.ts
 * Cubre logica pura del North Star §14.bis.6 owner-side.
 */
import { describe, it, expect } from 'vitest';
import {
  computeCompletionStatus,
  pickCompletionTone,
  COMPLETION_EVENT_TARGET,
  COMPLETION_CATEGORY_TARGET,
} from '../completion';

describe('computeCompletionStatus', () => {
  it('mascota recien creada (1 evento bienvenida) → ~10% progreso', () => {
    const status = computeCompletionStatus({
      eventCount: 1,
      categoryCount: 1,
      hasIdCard: false,
    });
    expect(status.isComplete).toBe(false);
    // (1/10 + 1/3 + 0) / 3 = 0.144 → 14%
    expect(status.progressPct).toBe(14);
    expect(status.missingEvents).toBe(9);
    expect(status.missingCategories).toBe(2);
  });

  it('mascota con bootstrap completo (4 eventos en 3 cats) → progreso medio', () => {
    const status = computeCompletionStatus({
      eventCount: 4,
      categoryCount: 3,
      hasIdCard: false,
    });
    expect(status.isComplete).toBe(false);
    // (4/10*100 + 3/3*100 + 0) / 3 = (40 + 100 + 0) / 3 = 47%
    expect(status.progressPct).toBe(47);
    expect(status.missingCategories).toBe(0);
  });

  it('mascota con todos los eventos pero sin Pet ID Card → no complete', () => {
    const status = computeCompletionStatus({
      eventCount: 15,
      categoryCount: 5,
      hasIdCard: false,
    });
    expect(status.isComplete).toBe(false);
    // Cap 100% por dimension: (100 + 100 + 0) / 3 = 67%
    expect(status.progressPct).toBe(67);
  });

  it('mascota con threshold exacto cumple → complete 100%', () => {
    const status = computeCompletionStatus({
      eventCount: 10,
      categoryCount: 3,
      hasIdCard: true,
    });
    expect(status.isComplete).toBe(true);
    expect(status.progressPct).toBe(100);
    expect(status.missingEvents).toBe(0);
    expect(status.missingCategories).toBe(0);
  });

  it('mascota con threshold superado → complete 100% (no >100%)', () => {
    const status = computeCompletionStatus({
      eventCount: 25,
      categoryCount: 8,
      hasIdCard: true,
    });
    expect(status.isComplete).toBe(true);
    expect(status.progressPct).toBe(100);
  });

  it('targets canonicos del plan §14.bis.6', () => {
    expect(COMPLETION_EVENT_TARGET).toBe(10);
    expect(COMPLETION_CATEGORY_TARGET).toBe(3);
  });
});

describe('pickCompletionTone', () => {
  it('is_complete=true → tone complete', () => {
    expect(pickCompletionTone(true, 100)).toBe('complete');
    expect(pickCompletionTone(true, 99)).toBe('complete'); // edge: complete prevalece
  });

  it('progreso >=80% pero no completo → tone near', () => {
    expect(pickCompletionTone(false, 80)).toBe('near');
    expect(pickCompletionTone(false, 95)).toBe('near');
  });

  it('progreso 30-79% → tone progress', () => {
    expect(pickCompletionTone(false, 30)).toBe('progress');
    expect(pickCompletionTone(false, 50)).toBe('progress');
    expect(pickCompletionTone(false, 79)).toBe('progress');
  });

  it('progreso <30% → tone starting', () => {
    expect(pickCompletionTone(false, 0)).toBe('starting');
    expect(pickCompletionTone(false, 14)).toBe('starting');
    expect(pickCompletionTone(false, 29)).toBe('starting');
  });

  it('boundaries del threshold §14.bis.6 (50% verde, 20% rojo)', () => {
    // El plan threshold proyecto: >=50% verde, 20-49% amarillo, <20% rojo.
    // El tone owner-side es similar pero con boundaries (80/30).
    // Esto es intencional: owner-side menos punitivo que el b2b admin view.
    expect(pickCompletionTone(false, 50)).toBe('progress'); // owner ve "progress"
    expect(pickCompletionTone(false, 20)).toBe('starting');
  });
});
