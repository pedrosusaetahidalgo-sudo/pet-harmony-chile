import { describe, it, expect, vi, afterEach } from 'vitest';
import { isOpenNow, getTodayHours } from '../openingHours';

describe('isOpenNow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for null/undefined', () => {
    expect(isOpenNow(null)).toBe(false);
    expect(isOpenNow(undefined)).toBe(false);
  });

  it('returns false when today is closed', () => {
    // Monday
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T10:00:00')); // Monday
    expect(isOpenNow({ lun: null })).toBe(false);
  });

  it('returns true when within opening hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T10:00:00')); // Monday 10:00
    expect(isOpenNow({ lun: { open: '09:00', close: '18:00' } })).toBe(true);
  });

  it('returns false before opening', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T07:00:00')); // Monday 07:00
    expect(isOpenNow({ lun: { open: '09:00', close: '18:00' } })).toBe(false);
  });

  it('returns false at closing time (exclusive)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T18:00:00')); // Monday 18:00
    expect(isOpenNow({ lun: { open: '09:00', close: '18:00' } })).toBe(false);
  });
});

describe('getTodayHours', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Sin horario" for null', () => {
    expect(getTodayHours(null)).toBe('Sin horario');
  });

  it('returns "Cerrado hoy" when day is null', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T10:00:00')); // Monday
    expect(getTodayHours({ lun: null })).toBe('Cerrado hoy');
  });

  it('returns formatted hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T10:00:00')); // Monday
    expect(getTodayHours({ lun: { open: '09:00', close: '18:00' } })).toBe('09:00 - 18:00');
  });
});
