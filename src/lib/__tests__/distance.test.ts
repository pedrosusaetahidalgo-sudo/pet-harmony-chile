import { describe, it, expect } from 'vitest';
import { calculateDistance } from '../distance';

describe('calculateDistance', () => {
  it('returns 0 for same point', () => {
    expect(calculateDistance(-33.45, -70.66, -33.45, -70.66)).toBe(0);
  });

  it('calculates Santiago to Valparaiso ~100km', () => {
    const dist = calculateDistance(-33.4489, -70.6693, -33.0472, -71.6127);
    expect(dist).toBeGreaterThan(90);
    expect(dist).toBeLessThan(120);
  });

  it('returns a positive number', () => {
    const dist = calculateDistance(-33.45, -70.66, -33.5, -70.7);
    expect(dist).toBeGreaterThan(0);
  });

  it('returns distance with 1 decimal', () => {
    const dist = calculateDistance(-33.45, -70.66, -33.5, -70.7);
    const decimals = (dist.toString().split('.')[1] || '').length;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});
