/**
 * Tests del helper Sprint 1 P1 SEC-007 (2026-04-28).
 *
 * Source: supabase/functions/_shared/cron-auth.ts (Deno module, no se puede
 * importar directo). Replicamos la lógica pura aquí para testear comportamiento
 * con timing-safe equality + headers.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// Replicamos la lógica del helper (mantener idéntico al edge fn original).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) dummy |= 1;
    void dummy;
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function isValidSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected || expected.length < 16) return false;
  return timingSafeEqual(provided, expected);
}

interface MockEnv {
  PAWFRIEND_CRON_SECRET?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

function requireCronAuth(req: Request, env: MockEnv): Response | null {
  const cronSecretHeader = req.headers.get('X-Cron-Secret');
  if (env.PAWFRIEND_CRON_SECRET && isValidSecret(cronSecretHeader, env.PAWFRIEND_CRON_SECRET)) {
    return null;
  }
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (env.SUPABASE_SERVICE_ROLE_KEY && isValidSecret(token, env.SUPABASE_SERVICE_ROLE_KEY)) {
      return null;
    }
  }
  return new Response(JSON.stringify({ error: 'cron auth required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

const VALID_CRON_SECRET = 'a'.repeat(32);
const VALID_SERVICE_ROLE = 'eyJ' + 'b'.repeat(60);

describe('requireCronAuth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rechaza request sin headers', () => {
    const req = new Request('https://x.com/cron', { method: 'POST' });
    const env: MockEnv = {
      PAWFRIEND_CRON_SECRET: VALID_CRON_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: VALID_SERVICE_ROLE,
    };
    const res = requireCronAuth(req, env);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('acepta X-Cron-Secret válido', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { 'X-Cron-Secret': VALID_CRON_SECRET },
    });
    const env: MockEnv = { PAWFRIEND_CRON_SECRET: VALID_CRON_SECRET };
    const res = requireCronAuth(req, env);
    expect(res).toBeNull();
  });

  it('rechaza X-Cron-Secret incorrecto', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { 'X-Cron-Secret': 'wrong' + 'a'.repeat(28) },
    });
    const env: MockEnv = { PAWFRIEND_CRON_SECRET: VALID_CRON_SECRET };
    const res = requireCronAuth(req, env);
    expect(res!.status).toBe(401);
  });

  it('acepta Authorization Bearer service_role válido', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VALID_SERVICE_ROLE}` },
    });
    const env: MockEnv = { SUPABASE_SERVICE_ROLE_KEY: VALID_SERVICE_ROLE };
    const res = requireCronAuth(req, env);
    expect(res).toBeNull();
  });

  it('rechaza Bearer con token incorrecto', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-token' },
    });
    const env: MockEnv = { SUPABASE_SERVICE_ROLE_KEY: VALID_SERVICE_ROLE };
    const res = requireCronAuth(req, env);
    expect(res!.status).toBe(401);
  });

  it('rechaza si secret env es muy corto (<16 chars)', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { 'X-Cron-Secret': 'short' },
    });
    const env: MockEnv = { PAWFRIEND_CRON_SECRET: 'short' };
    const res = requireCronAuth(req, env);
    expect(res!.status).toBe(401);
  });

  it('rechaza Bearer sin "Bearer " prefix', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { Authorization: VALID_SERVICE_ROLE },
    });
    const env: MockEnv = { SUPABASE_SERVICE_ROLE_KEY: VALID_SERVICE_ROLE };
    const res = requireCronAuth(req, env);
    expect(res!.status).toBe(401);
  });

  it('case-insensitive en "bearer " prefix', () => {
    const req = new Request('https://x.com/cron', {
      method: 'POST',
      headers: { Authorization: `bearer ${VALID_SERVICE_ROLE}` },
    });
    const env: MockEnv = { SUPABASE_SERVICE_ROLE_KEY: VALID_SERVICE_ROLE };
    const res = requireCronAuth(req, env);
    expect(res).toBeNull();
  });
});

describe('timingSafeEqual', () => {
  it('returns true for equal strings', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });
});
