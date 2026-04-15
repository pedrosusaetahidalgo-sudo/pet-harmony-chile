import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeHealthScore } from '../health-score';

const baseInput = {
  overdueCount: 0,
  upcomingCount: 0,
  vaccinesUpToDate: true,
  lastVetVisit: new Date().toISOString(),
  hasWeight: true,
  hasPhoto: true,
  hasMicrochip: true,
};

describe('computeHealthScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Perfect score ---
  it('returns 100 and "good" when everything is perfect', () => {
    const result = computeHealthScore({ ...baseInput, lastVetVisit: '2026-04-01' });
    expect(result.score).toBe(100);
    expect(result.status).toBe('good');
    expect(result.label).toBe('Al día');
    expect(result.issues).toHaveLength(0);
  });

  // --- Overdue reminders ---
  it('penalizes 15 per overdue reminder', () => {
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      overdueCount: 1,
    });
    expect(result.score).toBe(85);
    expect(result.issues).toContain('1 recordatorio vencido');
  });

  it('caps overdue penalty at 45 (3 reminders)', () => {
    const r3 = computeHealthScore({ ...baseInput, lastVetVisit: '2026-04-01', overdueCount: 3 });
    expect(r3.score).toBe(55);

    const r5 = computeHealthScore({ ...baseInput, lastVetVisit: '2026-04-01', overdueCount: 5 });
    expect(r5.score).toBe(55); // still capped at 45 penalty
  });

  it('pluralizes overdue message correctly', () => {
    const single = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      overdueCount: 1,
    });
    expect(single.issues[0]).toBe('1 recordatorio vencido');

    const plural = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      overdueCount: 2,
    });
    expect(plural.issues[0]).toBe('2 recordatorios vencidos');
  });

  // --- Vaccines ---
  it('penalizes 20 for vaccines not up to date', () => {
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      vaccinesUpToDate: false,
    });
    expect(result.score).toBe(80);
    expect(result.issues).toContain('Vacunas pendientes');
  });

  // --- Vet visit ---
  it('penalizes 10 when no vet visit recorded', () => {
    const result = computeHealthScore({ ...baseInput, lastVetVisit: null });
    expect(result.score).toBe(90);
    expect(result.issues).toContain('Sin registro de visita veterinaria');
  });

  it('penalizes 5 for vet visit 7 months ago', () => {
    const result = computeHealthScore({ ...baseInput, lastVetVisit: '2025-09-01' });
    expect(result.score).toBe(95);
  });

  it('penalizes 15 for vet visit over 12 months ago', () => {
    const result = computeHealthScore({ ...baseInput, lastVetVisit: '2025-01-01' });
    expect(result.score).toBe(85);
    expect(result.issues).toContain('Sin control veterinario en más de 1 año');
  });

  // --- Profile completeness ---
  it('penalizes 5 for missing weight', () => {
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      hasWeight: false,
    });
    expect(result.score).toBe(95);
  });

  it('penalizes 3 for missing photo', () => {
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      hasPhoto: false,
    });
    expect(result.score).toBe(97);
  });

  it('penalizes 2 for missing microchip', () => {
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      hasMicrochip: false,
    });
    expect(result.score).toBe(98);
  });

  // --- Status thresholds ---
  it('returns "good" for score >= 80', () => {
    // vaccines not up to date = -20 → score 80
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      vaccinesUpToDate: false,
    });
    expect(result.score).toBe(80);
    expect(result.status).toBe('good');
  });

  it('returns "pending" for score 50-79', () => {
    // vaccines -20 + 1 overdue -15 + no weight -5 → 60
    const result = computeHealthScore({
      ...baseInput,
      lastVetVisit: '2026-04-01',
      vaccinesUpToDate: false,
      overdueCount: 1,
      hasWeight: false,
    });
    expect(result.score).toBe(60);
    expect(result.status).toBe('pending');
    expect(result.label).toBe('Con pendientes');
  });

  it('returns "critical" for score < 50', () => {
    const result = computeHealthScore({
      overdueCount: 4,
      upcomingCount: 0,
      vaccinesUpToDate: false,
      lastVetVisit: null,
      hasWeight: false,
      hasPhoto: false,
      hasMicrochip: false,
    });
    expect(result.score).toBeLessThan(50);
    expect(result.status).toBe('critical');
    expect(result.label).toBe('Requiere atención');
  });

  // --- Floor at 0 ---
  it('clamps score to minimum 0', () => {
    // Max penalties: overdue capped at -45, vaccines -20, no vet -10, weight -5, photo -3, chip -2 = -85
    // 100 - 85 = 15 (critical but not zero — penalty caps prevent reaching 0 normally)
    const result = computeHealthScore({
      overdueCount: 100,
      upcomingCount: 0,
      vaccinesUpToDate: false,
      lastVetVisit: null,
      hasWeight: false,
      hasPhoto: false,
      hasMicrochip: false,
    });
    expect(result.score).toBe(15);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.status).toBe('critical');
  });
});
