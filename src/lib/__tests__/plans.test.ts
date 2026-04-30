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

  // Modelo v2.1 (2026-04-29 Plan v5 Opcion 3): freemium 3 tiers con caps reales.
  it('free plan permite 2 mascotas', () => {
    expect(PLANS.free.features.max_pets).toBe(2);
  });

  it('premium plan permite 4 mascotas', () => {
    expect(PLANS.premium.features.max_pets).toBe(4);
  });

  it('manada plan permite 5 mascotas', () => {
    expect(PLANS.paw_manada.features.max_pets).toBe(5);
  });

  it('free plan has PDF export enabled (joya de la corona disponible para todos)', () => {
    expect(PLANS.free.features.export_pdf).toBe(true);
  });

  // Reanalisis 2026-04-30: Paw Shield reposicionado a EXCLUSIVO Manada para
  // controlar COGS Petify USD 0.75/mascota/mes lineal.
  it('paw_shield is OFF en free y premium, solo ON en manada', () => {
    expect(PLANS.free.features.paw_shield).toBe(false);
    expect(PLANS.premium.features.paw_shield).toBe(false);
    expect(PLANS.paw_manada.features.paw_shield).toBe(true);
  });

  it('paw_passport sigue ON en premium y manada (sin COGS externo)', () => {
    expect(PLANS.premium.features.paw_passport).toBe(true);
    expect(PLANS.paw_manada.features.paw_passport).toBe(true);
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

  it('premium user puede tener hasta 4 mascotas', () => {
    const within = canAccess('premium', 'max_pets', 3);
    expect(within.allowed).toBe(true);
    if (FEATURE_FLAGS.USER_PREMIUM) {
      const atLimit = canAccess('premium', 'max_pets', 4);
      expect(atLimit.allowed).toBe(false);
      expect(atLimit.upgradeRequired).toBe('paw_manada');
    }
  });

  it('manada user puede tener hasta 5 mascotas', () => {
    const within = canAccess('paw_manada', 'max_pets', 4);
    expect(within.allowed).toBe(true);
  });

  // Reanalisis 2026-04-30: paw_shield bloqueado en premium, requiere paw_manada.
  it('paw_shield requiere upgrade a Manada (no Paw Member)', () => {
    if (FEATURE_FLAGS.USER_PREMIUM) {
      const free = canAccess('free', 'paw_shield');
      expect(free.allowed).toBe(false);
      expect(free.upgradeRequired).toBe('paw_manada');

      const premium = canAccess('premium', 'paw_shield');
      expect(premium.allowed).toBe(false);
      expect(premium.upgradeRequired).toBe('paw_manada');

      const manada = canAccess('paw_manada', 'paw_shield');
      expect(manada.allowed).toBe(true);
    }
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
  it('has 4 canonical tiers (2 tracks: individual + clinic)', () => {
    expect(Object.keys(PROVIDER_PLANS)).toHaveLength(4);
    expect(Object.keys(PROVIDER_PLANS).sort()).toEqual([
      'provider_clinic_starter',
      'provider_free',
      'provider_premium',
      'provider_pro_max',
    ]);
  });

  it('individual track: basica + premium (segment=individual)', () => {
    expect(PROVIDER_PLANS.provider_free.segment).toBe('individual');
    expect(PROVIDER_PLANS.provider_premium.segment).toBe('individual');
  });

  it('clinic track: clinic_starter + pro_max (segment=clinic)', () => {
    expect(PROVIDER_PLANS.provider_clinic_starter.segment).toBe('clinic');
    expect(PROVIDER_PLANS.provider_pro_max.segment).toBe('clinic');
  });

  it('basica tier shows label "Básica" (id provider_free)', () => {
    expect(PROVIDER_PLANS.provider_free.name).toBe('Básica');
  });

  it('clinic starter is the entry tier for veterinarias', () => {
    expect(PROVIDER_PLANS.provider_clinic_starter.name).toBe('Clínica');
    expect(PROVIDER_PLANS.provider_clinic_starter.monthlyPrice).toBe(19900);
    expect(PROVIDER_PLANS.provider_clinic_starter.features.max_vet_seats).toBe(3);
    expect(PROVIDER_PLANS.provider_clinic_starter.features.bulk_patient_import).toBe(true);
  });

  it('pro max has 0% commission and unlimited seats', () => {
    expect(PROVIDER_PLANS.provider_pro_max.commissionRate).toBe(0);
    expect(PROVIDER_PLANS.provider_pro_max.features.max_vet_seats).toBe(-1);
    expect(PROVIDER_PLANS.provider_pro_max.features.multiple_branches).toBe(true);
  });

  it('premium individual has 5% commission and 1 seat', () => {
    expect(PROVIDER_PLANS.provider_premium.commissionRate).toBe(5);
    expect(PROVIDER_PLANS.provider_premium.features.max_vet_seats).toBe(1);
  });

  it('basica provider plan has 10% commission and 5 pacientes', () => {
    expect(PROVIDER_PLANS.provider_free.commissionRate).toBe(10);
    expect(PROVIDER_PLANS.provider_free.features.max_clients).toBe(5);
    expect(PROVIDER_PLANS.provider_free.features.bulk_patient_import).toBe(false);
  });

  it('premium individual does not allow multiple_vets (single seat)', () => {
    expect(PROVIDER_PLANS.provider_premium.features.multiple_vets).toBe(false);
  });

  it('clinic tiers allow multiple_vets and bulk import', () => {
    expect(PROVIDER_PLANS.provider_clinic_starter.features.multiple_vets).toBe(true);
    expect(PROVIDER_PLANS.provider_clinic_starter.features.bulk_patient_import).toBe(true);
    expect(PROVIDER_PLANS.provider_pro_max.features.multiple_vets).toBe(true);
    expect(PROVIDER_PLANS.provider_pro_max.features.bulk_patient_import).toBe(true);
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

  it('maps legacy clinic_basic to clinic_starter (2026-04-19 rename)', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_clinic_basic')).toBe('provider_clinic_starter');
  });

  it('maps legacy clinic_pro to pro_max', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_clinic_pro')).toBe('provider_pro_max');
  });

  it('passes through canonical IDs', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId('provider_free')).toBe('provider_free');
    expect(normalizeProviderPlanId('provider_premium')).toBe('provider_premium');
    expect(normalizeProviderPlanId('provider_clinic_starter')).toBe('provider_clinic_starter');
    expect(normalizeProviderPlanId('provider_pro_max')).toBe('provider_pro_max');
  });

  it('defaults unknown IDs to provider_free', async () => {
    const { normalizeProviderPlanId } = await import('../plans');
    expect(normalizeProviderPlanId(null)).toBe('provider_free');
    expect(normalizeProviderPlanId('xxx')).toBe('provider_free');
  });
});
