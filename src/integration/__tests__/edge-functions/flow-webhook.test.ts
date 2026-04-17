/**
 * Tests for flow-webhook edge function business logic.
 * Source: supabase/functions/flow-webhook/index.ts
 */
import { describe, it, expect } from 'vitest';

// ─── Replicate webhook parsing logic ────────────────────────────────

function parseFlowOptional(optional: string | null | undefined): {
  userId: string | null;
  plan: string | null;
} {
  try {
    const parsed = JSON.parse(optional ?? '{}');
    return {
      userId: parsed.user_id ?? null,
      plan: parsed.plan ?? null,
    };
  } catch {
    return { userId: null, plan: null };
  }
}

function isValidPayment(statusJson: { status?: number; amount?: number; optional?: string }): {
  valid: boolean;
  error?: string;
  userId?: string;
  plan?: string;
  amount?: number;
} {
  // status: 1=pendiente, 2=pagada, 3=rechazada, 4=anulada
  if (statusJson.status !== 2) {
    return { valid: false, error: 'Payment not completed' };
  }

  const { userId, plan } = parseFlowOptional(statusJson.optional);
  if (!userId || !plan || (plan !== 'monthly' && plan !== 'yearly')) {
    return { valid: false, error: 'Invalid optional context' };
  }

  const amount = Number(statusJson.amount ?? 0);
  if (!amount || amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }

  return { valid: true, userId, plan, amount };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('flow-webhook: parseFlowOptional', () => {
  it('parses valid JSON with user_id and plan', () => {
    const result = parseFlowOptional('{"user_id":"abc","plan":"monthly"}');
    expect(result.userId).toBe('abc');
    expect(result.plan).toBe('monthly');
  });

  it('returns nulls for invalid JSON', () => {
    const result = parseFlowOptional('not-json');
    expect(result.userId).toBeNull();
    expect(result.plan).toBeNull();
  });

  it('returns nulls for null input', () => {
    const result = parseFlowOptional(null);
    expect(result.userId).toBeNull();
  });

  it('returns nulls for undefined input', () => {
    const result = parseFlowOptional(undefined);
    expect(result.userId).toBeNull();
  });
});

describe('flow-webhook: isValidPayment', () => {
  const validPayment = {
    status: 2,
    amount: 3990,
    optional: JSON.stringify({ user_id: 'user-123', plan: 'monthly' }),
  };

  it('accepts valid payment (status=2, valid optional, positive amount)', () => {
    const result = isValidPayment(validPayment);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-123');
    expect(result.plan).toBe('monthly');
    expect(result.amount).toBe(3990);
  });

  it('rejects pending payment (status=1)', () => {
    expect(isValidPayment({ ...validPayment, status: 1 }).valid).toBe(false);
  });

  it('rejects rejected payment (status=3)', () => {
    expect(isValidPayment({ ...validPayment, status: 3 }).valid).toBe(false);
  });

  it('rejects voided payment (status=4)', () => {
    expect(isValidPayment({ ...validPayment, status: 4 }).valid).toBe(false);
  });

  it('rejects missing user_id in optional', () => {
    const result = isValidPayment({
      ...validPayment,
      optional: JSON.stringify({ plan: 'monthly' }),
    });
    expect(result.valid).toBe(false);
  });

  it('rejects missing plan in optional', () => {
    const result = isValidPayment({
      ...validPayment,
      optional: JSON.stringify({ user_id: 'user-123' }),
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid plan value', () => {
    const result = isValidPayment({
      ...validPayment,
      optional: JSON.stringify({ user_id: 'user-123', plan: 'weekly' }),
    });
    expect(result.valid).toBe(false);
  });

  it('rejects zero amount', () => {
    expect(isValidPayment({ ...validPayment, amount: 0 }).valid).toBe(false);
  });

  it('rejects negative amount', () => {
    expect(isValidPayment({ ...validPayment, amount: -100 }).valid).toBe(false);
  });

  it('accepts yearly plan', () => {
    const result = isValidPayment({
      status: 2,
      amount: 39900,
      optional: JSON.stringify({ user_id: 'user-456', plan: 'yearly' }),
    });
    expect(result.valid).toBe(true);
    expect(result.plan).toBe('yearly');
  });
});
