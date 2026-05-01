import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from '../featureFlags';

describe('FEATURE_FLAGS', () => {
  it('USER_PREMIUM is disabled', () => {
    expect(FEATURE_FLAGS.USER_PREMIUM).toBe(false);
  });

  it('PAWGAME_SIDEBAR is enabled', () => {
    expect(FEATURE_FLAGS.PAWGAME_SIDEBAR).toBe(true);
  });

  it('MARKETPLACE is disabled', () => {
    expect(FEATURE_FLAGS.MARKETPLACE).toBe(false);
  });

  it('PRO_ANALYTICS is enabled', () => {
    expect(FEATURE_FLAGS.PRO_ANALYTICS).toBe(true);
  });
});

describe('isFeatureEnabled', () => {
  it('returns true for enabled flags', () => {
    expect(isFeatureEnabled('PAWGAME_SIDEBAR')).toBe(true);
    expect(isFeatureEnabled('PRO_ANALYTICS')).toBe(true);
  });

  it('returns false for disabled flags', () => {
    expect(isFeatureEnabled('USER_PREMIUM')).toBe(false);
    expect(isFeatureEnabled('MARKETPLACE')).toBe(false);
    expect(isFeatureEnabled('SHARED_WALKS')).toBe(false);
    expect(isFeatureEnabled('LOST_PETS_SECTION')).toBe(false);
  });
});

describe('Fase 2/3 flags (Refactor Maestro 2026-04-27 + Plan v5 2026-04-29)', () => {
  it('Fase 2 motors revenue: ON como DEMO con disclaimer (2026-04-29)', () => {
    // Pedro decision Plan v5 Checkpoint 1: motores ON con disclaimer
    // "proximamente" hasta firmar primer partner. Lead capture activo.
    expect(FEATURE_FLAGS.EMBEDDED_INSURANCE).toBe(true);
    expect(FEATURE_FLAGS.RETAIL_FULFILLMENT).toBe(true);
  });

  it('B2B API + Pharma Insights API esperan firmar partner (false)', () => {
    expect(FEATURE_FLAGS.PHARMA_INSIGHTS_API).toBe(false);
    expect(FEATURE_FLAGS.B2B_API).toBe(false);
  });

  it('LATAM expansion flags estan en false hasta Y2+', () => {
    expect(FEATURE_FLAGS.LATAM_MX).toBe(false);
    expect(FEATURE_FLAGS.LATAM_AR).toBe(false);
    expect(FEATURE_FLAGS.LATAM_CO).toBe(false);
    expect(FEATURE_FLAGS.LATAM_PE).toBe(false);
  });

  it('Cascadas activas (§2.8.3 ambient computing)', () => {
    expect(FEATURE_FLAGS.CASCADE_WEIGHT_ALERTS).toBe(true);
    expect(FEATURE_FLAGS.CASCADE_INACTIVITY_CHECK).toBe(true);
    expect(FEATURE_FLAGS.CASCADE_BIRTHDAY_AUTO).toBe(true);
  });

  it('Research consent flow esta on (Pharma deal pre-req §7.3)', () => {
    expect(FEATURE_FLAGS.RESEARCH_CONSENT_FLOW).toBe(true);
  });

  it('Cascadas Fase 2+ avanzadas (AI / GPS / scanner) en false', () => {
    expect(FEATURE_FLAGS.CASCADE_AI_SUGGESTIONS).toBe(false);
    expect(FEATURE_FLAGS.AI_PATTERN_DETECTION).toBe(false);
    expect(FEATURE_FLAGS.WALK_GPS_TRACKING).toBe(false);
    expect(FEATURE_FLAGS.PARTNER_SCANNER_API).toBe(false);
    expect(FEATURE_FLAGS.PASSIVE_DETECTION_GPS).toBe(false);
  });
});
