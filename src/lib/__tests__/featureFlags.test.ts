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
