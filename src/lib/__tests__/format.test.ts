import { describe, it, expect, vi } from 'vitest';
import {
  formatPrice,
  smartCapitalize,
  toTitleCase,
  formatTime,
  formatTimeRange,
  formatBookingDate,
} from '../format';

describe('formatPrice', () => {
  it('formats 0 as Chilean pesos', () => {
    expect(formatPrice(0)).toContain('0');
  });

  it('formats 3990 with thousands separator', () => {
    const result = formatPrice(3990);
    expect(result).toContain('3.990');
  });

  it('formats large numbers correctly', () => {
    const result = formatPrice(59900);
    expect(result).toContain('59.900');
  });
});

describe('smartCapitalize', () => {
  it('capitalizes first letter', () => {
    expect(smartCapitalize('hola mundo')).toBe('Hola mundo');
  });

  it('capitalizes after period', () => {
    expect(smartCapitalize('hola. mundo')).toBe('Hola. Mundo');
  });

  it('returns empty string as-is', () => {
    expect(smartCapitalize('')).toBe('');
  });

  it('handles whitespace-only string', () => {
    expect(smartCapitalize('   ')).toBe('   ');
  });
});

describe('toTitleCase', () => {
  it('capitalizes each word', () => {
    expect(toTitleCase('maria lopez')).toBe('Maria Lopez');
  });

  it('keeps prepositions lowercase except at start', () => {
    expect(toTitleCase('maria del carmen')).toBe('Maria del Carmen');
  });

  it('lowercases common connectors', () => {
    expect(toTitleCase('perro de la calle')).toBe('Perro de la Calle');
  });

  it('handles extra spaces', () => {
    expect(toTitleCase('  hola   mundo  ')).toBe('Hola Mundo');
  });
});

describe('formatTime', () => {
  it('normaliza HH:mm:ss a HH:mm', () => {
    expect(formatTime('09:30:00')).toBe('09:30');
  });

  it('deja HH:mm igual', () => {
    expect(formatTime('14:15')).toBe('14:15');
  });

  it('retorna string vacio para null o undefined', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
  });
});

describe('formatTimeRange', () => {
  it('formatea rango completo con separador en-dash', () => {
    expect(formatTimeRange('09:00:00', '09:30:00')).toBe('09:00 – 09:30');
  });

  it('retorna solo start si no hay end', () => {
    expect(formatTimeRange('09:00', null)).toBe('09:00');
    expect(formatTimeRange('09:00', undefined)).toBe('09:00');
  });

  it('retorna string vacio si no hay start', () => {
    expect(formatTimeRange(null, '10:00')).toBe('');
    expect(formatTimeRange(undefined, undefined)).toBe('');
  });
});

describe('formatBookingDate', () => {
  it('formatea fecha ISO yyyy-MM-dd a dia + mes en espanol', () => {
    const result = formatBookingDate('2026-04-21');
    expect(result).toMatch(/martes/i); // 2026-04-21 es martes
    expect(result).toContain('21');
    expect(result).toMatch(/abril/i);
  });

  it('acepta Date object', () => {
    const d = new Date('2026-04-21T12:00:00');
    const result = formatBookingDate(d);
    expect(result).toMatch(/abril/i);
  });

  it('retorna string vacio con null o undefined', () => {
    expect(formatBookingDate(null)).toBe('');
    expect(formatBookingDate(undefined)).toBe('');
  });

  it('retorna string vacio con fecha invalida', () => {
    expect(formatBookingDate('not-a-date')).toBe('');
  });
});
