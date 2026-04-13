import { describe, it, expect } from 'vitest';
import { PLANS, canAccess, formatCLP, PROVIDER_PLANS, canProviderAccess } from '../plans';

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

  it('blocks free user at pet limit', () => {
    const result = canAccess('free', 'max_pets', 2);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('premium');
  });

  it('allows premium user unlimited pets', () => {
    const result = canAccess('premium', 'max_pets', 100);
    expect(result.allowed).toBe(true);
  });

  it('blocks free user from PDF export', () => {
    const result = canAccess('free', 'export_pdf');
    expect(result.allowed).toBe(false);
  });

  it('allows premium user PDF export', () => {
    const result = canAccess('premium', 'export_pdf');
    expect(result.allowed).toBe(true);
  });

  it('allows free user share_clinical within quota (1 free use)', () => {
    const result = canAccess('free', 'share_clinical');
    expect(result.allowed).toBe(true);
  });

  it('blocks free user share_clinical when quota exhausted', () => {
    const result = canAccess('free', 'share_clinical', 1);
    expect(result.allowed).toBe(false);
  });

  it('allows free user ai_vet_assistant within quota (1 free use)', () => {
    const result = canAccess('free', 'ai_vet_assistant');
    expect(result.allowed).toBe(true);
  });

  it('blocks free user ai_vet_assistant when quota exhausted', () => {
    const result = canAccess('free', 'ai_vet_assistant', 1);
    expect(result.allowed).toBe(false);
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
  it('has 4 plans', () => {
    expect(Object.keys(PROVIDER_PLANS)).toHaveLength(4);
  });

  it('clinic pro has 0% commission', () => {
    expect(PROVIDER_PLANS.provider_clinic_pro.commissionRate).toBe(0);
  });

  it('free provider plan has 10% commission', () => {
    expect(PROVIDER_PLANS.provider_free.commissionRate).toBe(10);
  });
});

describe('canProviderAccess', () => {
  it('blocks free provider from featured_position', () => {
    const result = canProviderAccess('provider_free', 'featured_position');
    expect(result.allowed).toBe(false);
  });

  it('allows clinic_basic featured_position', () => {
    const result = canProviderAccess('provider_clinic_basic', 'featured_position');
    expect(result.allowed).toBe(true);
  });

  it('blocks free provider at client limit', () => {
    const result = canProviderAccess('provider_free', 'max_clients', 20);
    expect(result.allowed).toBe(false);
  });

  it('allows clinic_pro unlimited clients', () => {
    const result = canProviderAccess('provider_clinic_pro', 'max_clients', 9999);
    expect(result.allowed).toBe(true);
  });
});
