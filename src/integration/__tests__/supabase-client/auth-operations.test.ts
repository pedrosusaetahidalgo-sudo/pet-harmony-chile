/**
 * Tests for Supabase auth operation patterns.
 * Validates the mock auth API matches usage in hooks and components.
 */
import { describe, it, expect } from 'vitest';
import { createMockSupabase } from '../../helpers/mock-supabase';
import { makeUser } from '../../helpers/test-data';

describe('Auth: getSession', () => {
  it('returns session for authenticated user', async () => {
    const user = makeUser();
    const supabase = createMockSupabase({ authUser: user });

    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeTruthy();
    expect(data.session!.user.id).toBe(user.id);
    expect(data.session!.access_token).toBe('mock-token');
  });

  it('returns null session for unauthenticated user', async () => {
    const supabase = createMockSupabase({ authUser: null });

    const { data } = await supabase.auth.getSession();
    expect(data.session).toBeNull();
  });
});

describe('Auth: getUser', () => {
  it('returns user data for valid token', async () => {
    const user = makeUser();
    const supabase = createMockSupabase({ authUser: user });

    const { data, error } = await supabase.auth.getUser();
    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
    expect(data.user!.id).toBe(user.id);
    expect(data.user!.email).toBe(user.email);
  });

  it('returns error for invalid token', async () => {
    const supabase = createMockSupabase({
      authUser: null,
      authError: { message: 'Invalid token' },
    });

    const { data, error } = await supabase.auth.getUser();
    expect(error).toBeTruthy();
    expect(data.user).toBeNull();
  });
});

describe('Auth: signInWithPassword', () => {
  it('returns user and session on success', async () => {
    const user = makeUser({ email: 'pedro@pawfriend.cl' });
    const supabase = createMockSupabase({ authUser: user });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'pedro@pawfriend.cl',
      password: 'test123',
    });
    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
  });

  it('returns error on invalid credentials', async () => {
    const supabase = createMockSupabase({
      authUser: null,
      authError: { message: 'Invalid login credentials' },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: 'wrong@email.com',
      password: 'wrong',
    });
    expect(error).toBeTruthy();
    expect(error!.message).toContain('Invalid');
  });
});

describe('Auth: signOut', () => {
  it('signs out without error', async () => {
    const supabase = createMockSupabase({ authUser: makeUser() });
    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();
  });
});

describe('Auth: admin operations', () => {
  it('generateLink returns action link', async () => {
    const supabase = createMockSupabase();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: 'new@user.com',
    });
    expect(error).toBeNull();
    expect(data.properties.action_link).toContain('pawfriend.cl');
  });

  it('inviteUserByEmail succeeds', async () => {
    const supabase = createMockSupabase();
    const { error } = await supabase.auth.admin.inviteUserByEmail('new@user.com', {
      redirectTo: 'https://pawfriend.cl/auth',
    });
    expect(error).toBeNull();
  });
});
