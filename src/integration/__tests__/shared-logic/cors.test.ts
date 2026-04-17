/**
 * Tests for CORS helpers used by all edge functions.
 * Source: supabase/functions/_shared/cors.ts
 */
import { describe, it, expect } from 'vitest';

// Replicate the pure logic from _shared/cors.ts (Deno module, can't import directly)
const ALLOWED_ORIGINS = ['https://pawfriend.cl', 'http://localhost:8080', 'http://localhost:5173'];

function getCorsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

describe('getCorsHeaders', () => {
  it('returns pawfriend.cl for production origin', () => {
    const headers = getCorsHeaders('https://pawfriend.cl');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://pawfriend.cl');
  });

  it('returns localhost:8080 for dev origin', () => {
    const headers = getCorsHeaders('http://localhost:8080');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:8080');
  });

  it('returns localhost:5173 for vite dev origin', () => {
    const headers = getCorsHeaders('http://localhost:5173');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
  });

  it('falls back to pawfriend.cl for unknown origin', () => {
    const headers = getCorsHeaders('https://evil-site.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://pawfriend.cl');
  });

  it('falls back to pawfriend.cl for empty origin', () => {
    const headers = getCorsHeaders('');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://pawfriend.cl');
  });

  it('includes required headers', () => {
    const headers = getCorsHeaders('https://pawfriend.cl');
    expect(headers['Access-Control-Allow-Headers']).toContain('authorization');
    expect(headers['Access-Control-Allow-Headers']).toContain('content-type');
    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
  });
});
