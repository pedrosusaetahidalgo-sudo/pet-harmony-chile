/**
 * Tests de logica pura del modulo analytics (Sprint 1 P1 SEC-014, 2026-04-28).
 *
 * Replicamos las funciones internas (`scrubTokenizedUrl`, `normalizeAnalyticsPath`)
 * porque no estan exportadas. Mantener sincronizado con `src/lib/analytics.ts`.
 *
 * No testeamos `track()` / `identify()` aqui — esos requieren mock de PostHog
 * + Firebase + Meta Pixel y dependen de import.meta.env. Cubierto por E2E.
 */
import { describe, it, expect } from 'vitest';

const TOKEN_ROUTE_PATTERNS: Array<{ re: RegExp; replace: string }> = [
  { re: /\/qr\/[^/?#]+/g, replace: '/qr/[redacted]' },
  { re: /\/medical-share\/[^/?#]+/g, replace: '/medical-share/[redacted]' },
  { re: /\/paw-card\/[^/?#]+/g, replace: '/paw-card/[redacted]' },
  { re: /\/resena\/[^/?#]+/g, replace: '/resena/[redacted]' },
];

function scrubTokenizedUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  let out = value;
  for (const { re, replace } of TOKEN_ROUTE_PATTERNS) {
    out = out.replace(re, replace);
  }
  return out;
}

function normalizeAnalyticsPath(pathname: string): string {
  if (pathname === '/reminders') return '/calendario#recordatorios';
  if (pathname === '/rutinas') return '/calendario#rutinas';
  if (pathname === '/mis-reservas') return '/calendario#reservas';
  if (/^\/mascota\/[^/]+\/timeline$/.test(pathname)) return '/ficha#historial';
  if (/^\/mascota\/[^/]+\/rutinas$/.test(pathname)) return '/calendario#rutinas';
  return pathname;
}

describe('scrubTokenizedUrl (privacy: no leak de tokens a PostHog)', () => {
  it('redacta /qr/:token', () => {
    expect(scrubTokenizedUrl('/qr/abc123xyz')).toBe('/qr/[redacted]');
  });

  it('redacta /medical-share/:token', () => {
    expect(scrubTokenizedUrl('/medical-share/eyJhbGciOi.JWT.token')).toBe(
      '/medical-share/[redacted]'
    );
  });

  it('redacta /paw-card/:id', () => {
    expect(scrubTokenizedUrl('/paw-card/uuid-1234-5678')).toBe('/paw-card/[redacted]');
  });

  it('redacta /resena/:token', () => {
    expect(scrubTokenizedUrl('/resena/abc-def-123')).toBe('/resena/[redacted]');
  });

  it('redacta multiples ocurrencias en el mismo string', () => {
    // El regex [^/?#]+ no excluye espacios, asi que prosa suelta entre tokens
    // se consume tambien — over-redact > under-redact para privacy.
    expect(scrubTokenizedUrl('Url1: /qr/A /paw-card/B /resena/C')).toBe(
      'Url1: /qr/[redacted]/paw-card/[redacted]/resena/[redacted]'
    );
  });

  it('preserva URLs sin tokens', () => {
    expect(scrubTokenizedUrl('/home')).toBe('/home');
    expect(scrubTokenizedUrl('/profile/edit')).toBe('/profile/edit');
  });

  it('no redacta /qr (sin token)', () => {
    // Ojo: regex requiere al menos 1 char despues de /qr/, asi que /qr no matchea.
    expect(scrubTokenizedUrl('/qr')).toBe('/qr');
  });

  it('preserva query strings', () => {
    expect(scrubTokenizedUrl('/qr/abc?source=fb')).toBe('/qr/[redacted]?source=fb');
  });

  it('preserva fragmentos hash', () => {
    expect(scrubTokenizedUrl('/medical-share/tok#section')).toBe(
      '/medical-share/[redacted]#section'
    );
  });

  it('passes-through valores no string sin tocarlos', () => {
    expect(scrubTokenizedUrl(123)).toBe(123);
    expect(scrubTokenizedUrl(null)).toBe(null);
    expect(scrubTokenizedUrl(undefined)).toBe(undefined);
    expect(scrubTokenizedUrl({ url: '/qr/x' })).toEqual({ url: '/qr/x' });
  });
});

describe('normalizeAnalyticsPath (agrupacion logica de tabs)', () => {
  it('mapea /reminders a /calendario#recordatorios', () => {
    expect(normalizeAnalyticsPath('/reminders')).toBe('/calendario#recordatorios');
  });

  it('mapea /rutinas a /calendario#rutinas', () => {
    expect(normalizeAnalyticsPath('/rutinas')).toBe('/calendario#rutinas');
  });

  it('mapea /mis-reservas a /calendario#reservas', () => {
    expect(normalizeAnalyticsPath('/mis-reservas')).toBe('/calendario#reservas');
  });

  it('mapea /mascota/:id/timeline a /ficha#historial', () => {
    expect(normalizeAnalyticsPath('/mascota/abc-123/timeline')).toBe('/ficha#historial');
    expect(normalizeAnalyticsPath('/mascota/uuid-456/timeline')).toBe('/ficha#historial');
  });

  it('mapea /mascota/:id/rutinas a /calendario#rutinas', () => {
    expect(normalizeAnalyticsPath('/mascota/xyz/rutinas')).toBe('/calendario#rutinas');
  });

  it('preserva paths no mapeados', () => {
    expect(normalizeAnalyticsPath('/home')).toBe('/home');
    expect(normalizeAnalyticsPath('/feed')).toBe('/feed');
    expect(normalizeAnalyticsPath('/ficha/abc')).toBe('/ficha/abc');
  });

  it('NO mapea /mascota/:id/ficha-clinica (ya redirige a /ficha en App.tsx)', () => {
    expect(normalizeAnalyticsPath('/mascota/abc/ficha-clinica')).toBe('/mascota/abc/ficha-clinica');
  });

  it('NO matchea paths con segmentos extra despues de timeline/rutinas', () => {
    expect(normalizeAnalyticsPath('/mascota/abc/timeline/extra')).toBe(
      '/mascota/abc/timeline/extra'
    );
  });
});
