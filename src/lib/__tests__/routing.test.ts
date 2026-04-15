import { describe, it, expect } from 'vitest';
import {
  isOwnerRoute,
  isProviderRoute,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ADMIN_ROUTES,
  OWNER_ONLY_ROUTES,
  PROVIDER_ONLY_ROUTES,
  AUTH_REDIRECTS,
} from '../routing';

describe('isOwnerRoute', () => {
  it('returns true for owner-only routes', () => {
    expect(isOwnerRoute('/paw-collection')).toBe(true);
    expect(isOwnerRoute('/misiones')).toBe(true);
    expect(isOwnerRoute('/paw-game')).toBe(true);
  });

  it('matches sub-paths (prefix match)', () => {
    expect(isOwnerRoute('/paw-game/level-2')).toBe(true);
    expect(isOwnerRoute('/misiones/detalle')).toBe(true);
  });

  it('returns false for non-owner routes', () => {
    expect(isOwnerRoute('/home')).toBe(false);
    expect(isOwnerRoute('/provider/dashboard')).toBe(false);
    expect(isOwnerRoute('/feed')).toBe(false);
    expect(isOwnerRoute('/')).toBe(false);
  });

  it('matches paths that start with owner route prefix', () => {
    // startsWith means '/paw-games' matches '/paw-game' prefix
    expect(isOwnerRoute('/paw-games')).toBe(true);
    expect(isOwnerRoute('/misiones-extra')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isOwnerRoute('')).toBe(false);
  });
});

describe('isProviderRoute', () => {
  it('returns true for provider-only routes', () => {
    expect(isProviderRoute('/provider/dashboard')).toBe(true);
    expect(isProviderRoute('/provider/pacientes')).toBe(true);
    expect(isProviderRoute('/provider/profile-edit')).toBe(true);
    expect(isProviderRoute('/panel-pro')).toBe(true);
  });

  it('matches sub-paths', () => {
    expect(isProviderRoute('/provider/dashboard/stats')).toBe(true);
  });

  it('returns false for non-provider routes', () => {
    expect(isProviderRoute('/home')).toBe(false);
    expect(isProviderRoute('/paw-game')).toBe(false);
    expect(isProviderRoute('/')).toBe(false);
  });

  it('returns false for partial prefix that is not a route', () => {
    expect(isProviderRoute('/providers')).toBe(false);
  });
});

describe('route constants', () => {
  it('PUBLIC_ROUTES includes landing and auth', () => {
    expect(PUBLIC_ROUTES).toContain('/');
    expect(PUBLIC_ROUTES).toContain('/auth');
  });

  it('PROTECTED_ROUTES includes home and feed', () => {
    expect(PROTECTED_ROUTES).toContain('/home');
    expect(PROTECTED_ROUTES).toContain('/feed');
  });

  it('ADMIN_ROUTES includes /admin', () => {
    expect(ADMIN_ROUTES).toContain('/admin');
  });

  it('OWNER_ONLY_ROUTES has 3 gamification routes', () => {
    expect(OWNER_ONLY_ROUTES).toHaveLength(3);
  });

  it('PROVIDER_ONLY_ROUTES has 4 routes', () => {
    expect(PROVIDER_ONLY_ROUTES).toHaveLength(4);
  });

  it('no overlap between OWNER_ONLY and PROVIDER_ONLY', () => {
    const overlap = OWNER_ONLY_ROUTES.filter((r) =>
      (PROVIDER_ONLY_ROUTES as readonly string[]).includes(r)
    );
    expect(overlap).toHaveLength(0);
  });
});

describe('AUTH_REDIRECTS', () => {
  it('has correct redirect targets', () => {
    expect(AUTH_REDIRECTS.loggedInOnLanding).toBe('/home');
    expect(AUTH_REDIRECTS.ownerWithPets).toBe('/home');
    expect(AUTH_REDIRECTS.ownerWithoutPets).toBe('/add-pet');
    expect(AUTH_REDIRECTS.provider).toBe('/provider/dashboard');
    expect(AUTH_REDIRECTS.afterLogout).toBe('/auth');
  });
});
