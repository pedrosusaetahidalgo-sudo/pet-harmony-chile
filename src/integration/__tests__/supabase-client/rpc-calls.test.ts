/**
 * Tests for Supabase RPC call patterns.
 * Validates the contract between frontend hooks and database RPCs.
 */
import { describe, it, expect } from 'vitest';
import { createMockSupabase } from '../../helpers/mock-supabase';

describe('RPC: claim_pet_by_invitation', () => {
  it('returns success with pet details on valid token', async () => {
    const supabase = createMockSupabase({
      rpcs: {
        claim_pet_by_invitation: {
          data: { success: true, pet_name: 'Luna', vet_linked: true },
        },
      },
    });

    const { data, error } = await supabase.rpc('claim_pet_by_invitation', {
      p_token: 'valid-token-uuid',
    });
    expect(error).toBeNull();
    expect(data).toEqual({ success: true, pet_name: 'Luna', vet_linked: true });
  });

  it('returns error on invalid token', async () => {
    const supabase = createMockSupabase({
      rpcs: {
        claim_pet_by_invitation: {
          data: null,
          error: { message: 'Invalid or expired invitation token' },
        },
      },
    });

    const { error } = await supabase.rpc('claim_pet_by_invitation', {
      p_token: 'bad-token',
    });
    expect(error).toBeTruthy();
    expect(error!.message).toContain('Invalid');
  });
});

describe('RPC: check_and_increment_ai_quota', () => {
  it('returns allowed=true with remaining count', async () => {
    const supabase = createMockSupabase({
      rpcs: {
        check_and_increment_ai_quota: {
          data: [{ allowed: true, remaining: 4, reset_in_seconds: 3200 }],
        },
      },
    });

    const { data } = await supabase.rpc('check_and_increment_ai_quota', {
      p_user_id: 'user-123',
      p_limit: 5,
      p_window_seconds: 3600,
    });
    expect(data).toBeTruthy();
    const row = Array.isArray(data) ? data[0] : data;
    expect(row.allowed).toBe(true);
    expect(row.remaining).toBe(4);
  });

  it('returns allowed=false when quota exceeded', async () => {
    const supabase = createMockSupabase({
      rpcs: {
        check_and_increment_ai_quota: {
          data: [{ allowed: false, remaining: 0, reset_in_seconds: 1800 }],
        },
      },
    });

    const { data } = await supabase.rpc('check_and_increment_ai_quota', {
      p_user_id: 'user-123',
      p_limit: 5,
      p_window_seconds: 3600,
    });
    const row = Array.isArray(data) ? data[0] : data;
    expect(row.allowed).toBe(false);
    expect(row.remaining).toBe(0);
  });
});

describe('RPC: apply_premium', () => {
  it('succeeds with valid params', async () => {
    const supabase = createMockSupabase({
      rpcs: { apply_premium: { data: null, error: null } },
    });

    const { error } = await supabase.rpc('apply_premium', {
      p_user_id: 'user-123',
      p_plan: 'monthly',
      p_amount_clp: 3990,
      p_provider_id: 'flow-token',
    });
    expect(error).toBeNull();
  });

  it('returns error on invalid user', async () => {
    const supabase = createMockSupabase({
      rpcs: { apply_premium: { error: { message: 'User not found' } } },
    });

    const { error } = await supabase.rpc('apply_premium', {
      p_user_id: 'nonexistent',
      p_plan: 'monthly',
      p_amount_clp: 3990,
      p_provider_id: 'flow-token',
    });
    expect(error).toBeTruthy();
  });
});

describe('RPC: get_user_id_by_email', () => {
  it('returns user ID for existing email', async () => {
    const supabase = createMockSupabase({
      rpcs: { get_user_id_by_email: { data: 'user-uuid-123' } },
    });

    const { data } = await supabase.rpc('get_user_id_by_email', { p_email: 'test@example.com' });
    expect(data).toBe('user-uuid-123');
  });

  it('returns null for unregistered email', async () => {
    const supabase = createMockSupabase({
      rpcs: { get_user_id_by_email: { data: null } },
    });

    const { data } = await supabase.rpc('get_user_id_by_email', { p_email: 'new@example.com' });
    expect(data).toBeNull();
  });
});
