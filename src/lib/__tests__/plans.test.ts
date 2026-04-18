import { describe, it, expect } from 'vitest';
import { PLANS, canAccess, formatCLP, PROVIDER_PLANS, canProviderAccess } from '../plans';
import { FEATURE_FLAGS } from '../featureFlags';

describe('PLANS', () => {
  it('has free and premium plans', () => {
    expect(PLANS.free).toBeDefined();
    expect(PLANS.premium).toBeDefined();
  });

  it('free plan costs $0', () => {
    expect(PLANS.free.monthlyPrice).toBe(0);
    expect(PLANS.free.yearlyPrice).toBe(0);
  });

  it('premium plan costs $3.990/month', () => {
    expect(PLANS.premium.monthlyPrice).toBe(3990);
  });

  it('premium plan has unlimited pets (-1)', () => {
    expect(PLANS.premium.features.max_pets).toBe(-1);
  });

  it('free plan limits to 2 pets', () => {
    expect(PLANS.free.features.max_pets).toBe(2);
  });
});

describe('canAccess', () => {
  it('allows free user to access basic features', () => {
    const result = canAccess('free', 'max_pets', 1);
    expect(result.allowed).toBe(true);
  });

  it('blocks free user at pet limit (when premium enabled)', () => {
    const result = canAccess('free', 'max_pets', 2);
    if (FEATURE_FLAGS.USER_PREMIUM) {
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe('premium');
    } else {
      // USER_PREMIUM=false → everything unlocked
      expect(result.allowed).toBe(true);
    }
  });

  it('allows premium user unlimited pets', () => {
    const result = canAccess('premium', 'max_pets', 100);
    expect(result.allowed).toBe(true);
  });

  it('blocks free user from PDF export (when premium enabled)', () => {
    const result = canAccess('free', 'export_pdf');
    if (FEATURE_FLAGS.USER_PREMIUM) {
      expect(result.allowed).toBe(false);
    } else {
      expect(result.allowed).toBe(true);
    }
  });

  it('allows premium user PDF export', () => {
    const result = canAccess('premium', 'export_pdf');
    expect(result.allowed).toBe(true);
  });

  it('allows free user share_clinical within quota (1 free use)', () => {
    const result = canAccess('free', 'share_clinical');
    expect(result.allowed).toBe(true);
  });

  it('blocks free user share_clinical when quota exhausted (when premium enabled)', () => {
    const result = canAccess('free', 'share_clinical', 1);
    if (FEATURE_FLAGS.USER_PREMIUM) {
      expect(result.allowed).toBe(false);
    } else {
      expect(result.allowed).toBe(true);
    }
  });

  it('allows free user ai_vet_assistant within quota (1 free use)', () => {
    const result = canAccess('free', 'ai_vet_assistant');
    expect(result.allowed).toBe(true);
  });

  it('blocks free user ai_vet_assistant when quota exhausted (when premium enabled)', () => {
    const result = canAccess('free', 'ai_vet_assistant', 1);
    if (FEATURE_FLAGS.USER_PREMIUM) {
      expect(result.allowed).toBe(false);
    } else {
      expect(result.allowed).toBe(true);
    }
  });

  it('returns allowed for string features', () => {
    const result = canAccess('free', 'medical_history');
    expect(result.allowed).toBe(true);
  });
});

describe('formatCLP', () => {
  it('formats 0', () => {
    expect(formatCLP(0)).toContain('0');
  });

  it('formats 3990 with thousands separator', () => {
    expect(formatCLP(3990)).toContain('3.990');
  });
});

describe('PROVIDER_PLANS', () => {
  it('has 3 canonical tiers (basica=provider_free, premium, pro_max)', () => {
    expect(Object.keys(PROVIDER_PLANS)).toHaveLength(3);
    expect(Object.keys(PROVIDER_PLANS).sort()).toEqual([
      'provider_free',
      'provider_premium',
      'provider_pro_max',
    ]);
  });

  it('basica tier shows label "Básica" (id provider_free)', () => {
    expect(PROVIDER_PLANS.provider_free.name).toBe('Básica');
  });

  it('pro max has 0% commission', () => {
    expect(PROVIDER_PLANS.provider_pro_max.commissionRate).toBe(0);
  });

  it('premium has 5% commission', () => {
    expect(PROVIDER_PLANS.provider_premium.commissionRate).toBe(5);
  });

  it('basica provider plan has 10% commission', () => {
    expect(PROVIDER_PLANS.provider_free.commissionRate).toBe(10);
  });

  it('basica provider plan has 5 pacientes limit', () => {
    expect(PROVIDER_PLANS.provider_free.features.max_clients).toBe(5);
  });

  it('premium and pro_max have unlimited clients', () => {
    expect(PROVIDER_PLANS.provider_premium.features.max_clients).toBe(-1);
    expect(PROVIDER_PLANS.provider_pro_max.features.max_clients).toBe(-1);
  });
});

describe('canProviderAccess', () => {
  it('blocks free provider from featured_position', () => {
    const result = canProviderAccess('provider_free', 'featured_position');
    expect(result.allowed).toBe(false);
  });

  it('allows premium featured_position', () => {
    const result = canProviderAccess('provider_premium', 'featured_position');
    expect(result.allowed).toBe(true);
  });

  it('blocks free provider at client limit (5)', () => {
    const result = canProviderAccess('provider_free', 'max_clients', 5);
    expect(result.allowed).toBe(false);
  });

  it('allows pro_max unlimited clients', () => {
    const result = canProviderAccess('provider_pro_max', 'max_clients', 9999);
    expect(result.allowed).toBe(true);
  });

  it('pro_max has multiple_branches enabled, premium does not', () => {
    expect(PROVIDER_PLANS.provider_pro_max.features.multiple_branches).toBe(true);
    expect(PROVIDER_PLANS.provider_premium.features.multiple_branches).toBe(false);
  });
});

describe('normalizeProviderPlanId', () => {
  it('maps legacy individual to premium', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_individual')).toBe('provider_premium');
  });

  it('maps legacy clinic_basic to premium', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_clinic_basic')).toBe('provider_premium');
  });

  it('maps legacy clinic_pro to pro_max', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_clinic_pro')).toBe('provider_pro_max');
  });

  it('passes through canonical IDs', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_free')).toBe('provider_free');
    expect(normalizeProviderPlanId('provider_premium')).toBe('provider_premium');
    expect(normalizeProviderPlanId('provider_pro_max')).toBe('provider_pro_max');
  });

  it('defaults unknown IDs to provider_free', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId(null)).toBe('provider_free');
    expect(normalizeProviderPlanId('xxx')).toBe('provider_free');
  });
});
