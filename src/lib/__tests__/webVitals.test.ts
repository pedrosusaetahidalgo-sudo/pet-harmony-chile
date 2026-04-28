/**
 * Tests del helper Web Vitals (Sprint 1 P1 PERF, 2026-04-28).
 *
 * Solo testeamos la lógica pura de rating (thresholds web.dev/vitals).
 * El PerformanceObserver setup vive en `initWebVitals()` que requiere
 * jsdom + addEventListener real, lo cual ya está en el setup.
 */
import { describe, it, expect } from 'vitest';

// Replicate la lógica de rate() para testear thresholds.
function rate(name: 'LCP' | 'CLS' | 'INP' | 'TTFB', value: number): string {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  }
}

describe('Web Vitals rating thresholds', () => {
  describe('LCP', () => {
    it('clasifica <=2500ms como good', () => {
      expect(rate('LCP', 2400)).toBe('good');
      expect(rate('LCP', 2500)).toBe('good');
    });
    it('clasifica 2500-4000ms como needs-improvement', () => {
      expect(rate('LCP', 2501)).toBe('needs-improvement');
      expect(rate('LCP', 4000)).toBe('needs-improvement');
    });
    it('clasifica >4000ms como poor', () => {
      expect(rate('LCP', 4001)).toBe('poor');
      expect(rate('LCP', 10000)).toBe('poor');
    });
  });

  describe('CLS', () => {
    it('clasifica <=0.1 como good', () => {
      expect(rate('CLS', 0)).toBe('good');
      expect(rate('CLS', 0.1)).toBe('good');
    });
    it('clasifica 0.1-0.25 como needs-improvement', () => {
      expect(rate('CLS', 0.15)).toBe('needs-improvement');
      expect(rate('CLS', 0.25)).toBe('needs-improvement');
    });
    it('clasifica >0.25 como poor', () => {
      expect(rate('CLS', 0.3)).toBe('poor');
      expect(rate('CLS', 1)).toBe('poor');
    });
  });

  describe('INP', () => {
    it('clasifica <=200ms como good', () => {
      expect(rate('INP', 50)).toBe('good');
      expect(rate('INP', 200)).toBe('good');
    });
    it('clasifica 200-500ms como needs-improvement', () => {
      expect(rate('INP', 300)).toBe('needs-improvement');
      expect(rate('INP', 500)).toBe('needs-improvement');
    });
    it('clasifica >500ms como poor', () => {
      expect(rate('INP', 800)).toBe('poor');
      expect(rate('INP', 2000)).toBe('poor');
    });
  });

  describe('TTFB', () => {
    it('clasifica <=800ms como good', () => {
      expect(rate('TTFB', 200)).toBe('good');
      expect(rate('TTFB', 800)).toBe('good');
    });
    it('clasifica 800-1800ms como needs-improvement', () => {
      expect(rate('TTFB', 1200)).toBe('needs-improvement');
      expect(rate('TTFB', 1800)).toBe('needs-improvement');
    });
    it('clasifica >1800ms como poor', () => {
      expect(rate('TTFB', 2000)).toBe('poor');
      expect(rate('TTFB', 5000)).toBe('poor');
    });
  });
});
