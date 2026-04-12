import { describe, it, expect, vi } from 'vitest';
import { formatPrice, smartCapitalize, toTitleCase } from '../format';

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
    expect(toTitleCase('pedro susaeta')).toBe('Pedro Susaeta');
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
