/**
 * Tests for Flow.cl HMAC signing utility.
 * Source: supabase/functions/_shared/flow-utils.ts
 * Critical: payment integrity depends on correct signing.
 */
import { describe, it, expect } from 'vitest';

// Replicate pure logic from _shared/flow-utils.ts (uses Web Crypto API, available in Node 18+)
async function signFlowParams(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}${params[k]}`).join('');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(toSign));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('signFlowParams', () => {
  const TEST_SECRET = 'test-secret-key-12345';

  it('produces a 64-char hex string (SHA-256)', async () => {
    const sig = await signFlowParams({ apiKey: 'key1', amount: '3990' }, TEST_SECRET);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sorts params alphabetically before signing', async () => {
    const sig1 = await signFlowParams({ z: '1', a: '2' }, TEST_SECRET);
    const sig2 = await signFlowParams({ a: '2', z: '1' }, TEST_SECRET);
    expect(sig1).toBe(sig2);
  });

  it('different params produce different signatures', async () => {
    const sig1 = await signFlowParams({ amount: '3990' }, TEST_SECRET);
    const sig2 = await signFlowParams({ amount: '39900' }, TEST_SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it('different secrets produce different signatures', async () => {
    const sig1 = await signFlowParams({ amount: '3990' }, 'secret-a');
    const sig2 = await signFlowParams({ amount: '3990' }, 'secret-b');
    expect(sig1).not.toBe(sig2);
  });

  it('empty params produce a valid signature', async () => {
    const sig = await signFlowParams({}, TEST_SECRET);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic (same input = same output)', async () => {
    const params = { apiKey: 'ABC', commerceOrder: 'PF-123', amount: '3990' };
    const sig1 = await signFlowParams(params, TEST_SECRET);
    const sig2 = await signFlowParams(params, TEST_SECRET);
    expect(sig1).toBe(sig2);
  });

  it('handles special characters in values', async () => {
    const sig = await signFlowParams(
      { email: 'user@test.com', subject: 'Paw Friend Premium (mensual)' },
      TEST_SECRET
    );
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });
});
