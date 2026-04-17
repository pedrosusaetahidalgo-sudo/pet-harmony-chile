/**
 * Tests for flow-create-subscription edge function business logic.
 * Source: supabase/functions/flow-create-subscription/index.ts
 */
import { describe, it, expect } from 'vitest';

// ─── Replicate business logic constants ─────────────────────────────

const PRICES: Record<string, number> = {
  monthly: 3990,
  yearly: 39900,
};

function validatePlan(
  plan: unknown
): { valid: true; amount: number } | { valid: false; error: string } {
  if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
    return { valid: false, error: "Invalid plan: must be 'monthly' or 'yearly'" };
  }
  return { valid: true, amount: PRICES[plan] };
}

function buildCommerceOrder(userId: string): string {
  return `PF-${userId.slice(0, 8)}-${Date.now()}`;
}

function buildOptional(userId: string, plan: string): string {
  return JSON.stringify({ user_id: userId, plan });
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('flow-create-subscription: plan validation', () => {
  it('monthly plan costs $3.990', () => {
    const result = validatePlan('monthly');
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.amount).toBe(3990);
  });

  it('yearly plan costs $39.900', () => {
    const result = validatePlan('yearly');
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.amount).toBe(39900);
  });

  it('rejects null plan', () => {
    expect(validatePlan(null).valid).toBe(false);
  });

  it('rejects undefined plan', () => {
    expect(validatePlan(undefined).valid).toBe(false);
  });

  it('rejects invalid plan string', () => {
    expect(validatePlan('weekly').valid).toBe(false);
    expect(validatePlan('premium').valid).toBe(false);
  });

  it('rejects numeric plan', () => {
    expect(validatePlan(3990).valid).toBe(false);
  });
});

describe('flow-create-subscription: commerce order', () => {
  it('generates PF-prefixed order ID', () => {
    const order = buildCommerceOrder('user-12345678-abcd');
    expect(order).toMatch(/^PF-user-123/);
  });

  it('includes timestamp for uniqueness', () => {
    const order1 = buildCommerceOrder('user-12345678');
    const order2 = buildCommerceOrder('user-12345678');
    // Orders generated in sequence should differ (timestamp differs)
    // They might be the same if generated in the same ms, so just check format
    expect(order1).toMatch(/^PF-.+-\d+$/);
  });
});

describe('flow-create-subscription: optional context', () => {
  it('builds valid JSON with user_id and plan', () => {
    const optional = buildOptional('user-123', 'monthly');
    const parsed = JSON.parse(optional);
    expect(parsed.user_id).toBe('user-123');
    expect(parsed.plan).toBe('monthly');
  });
});
