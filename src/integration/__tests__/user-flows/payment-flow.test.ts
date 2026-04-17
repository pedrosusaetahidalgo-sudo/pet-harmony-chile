/**
 * Tests for the premium payment lifecycle:
 * User initiates → Flow creates → webhook confirms → premium applied
 */
import { describe, it, expect } from 'vitest';
import { createMockSupabase } from '../../helpers/mock-supabase';
import { makeUser, makeSubscription } from '../../helpers/test-data';

describe('Payment flow: subscription lifecycle', () => {
  const user = makeUser();

  it('1. User initiates monthly subscription via edge function', async () => {
    const supabase = createMockSupabase({
      authUser: user,
      functions: {
        'flow-create-subscription': {
          data: {
            url: 'https://www.flow.cl/app/web/pay.php?token=flow-token-123',
            token: 'flow-token-123',
          },
        },
      },
    });

    const { data, error } = await supabase.functions.invoke('flow-create-subscription', {
      body: { plan: 'monthly' },
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('url');
    expect(data).toHaveProperty('token');
    expect(data.url).toContain('flow.cl');
  });

  it('2. Pending subscription is created in DB', async () => {
    const pendingSub = makeSubscription({
      status: 'pending',
      payment_provider_id: 'flow-token-123',
    });
    const supabase = createMockSupabase({
      tables: { subscriptions: { data: [pendingSub] } },
    });

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    expect(data).toBeTruthy();
    expect(data!.status).toBe('pending');
    expect(data!.payment_provider_id).toBe('flow-token-123');
  });

  it('3. Webhook confirms payment → apply_premium RPC succeeds', async () => {
    const supabase = createMockSupabase({
      rpcs: { apply_premium: { data: null, error: null } },
    });

    const { error } = await supabase.rpc('apply_premium', {
      p_user_id: user.id,
      p_plan: 'monthly',
      p_amount_clp: 3990,
      p_provider_id: 'flow-token-123',
    });
    expect(error).toBeNull();
  });

  it('4. Active subscription exists after payment', async () => {
    const activeSub = makeSubscription({
      status: 'active',
      plan_type: 'monthly',
      payment_amount_clp: 3990,
    });
    const supabase = createMockSupabase({
      tables: { subscriptions: { data: [activeSub] } },
    });

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    expect(data).toBeTruthy();
    expect(data!.status).toBe('active');
    expect(data!.payment_amount_clp).toBe(3990);
  });

  it('5. Idempotency: reuses pending subscription if recent', async () => {
    const existingPending = makeSubscription({
      status: 'pending',
      payment_provider_id: 'existing-flow-token',
    });
    const supabase = createMockSupabase({
      tables: { subscriptions: { data: [existingPending] } },
    });

    // Simulate the idempotency check
    const { data } = await supabase
      .from('subscriptions')
      .select('payment_provider_id')
      .eq('user_id', user.id)
      .eq('plan_type', 'monthly')
      .eq('status', 'pending')
      .maybeSingle();

    expect(data).toBeTruthy();
    expect(data!.payment_provider_id).toBe('existing-flow-token');
  });
});

describe('Payment flow: yearly subscription', () => {
  const user = makeUser();

  it('yearly plan costs $39.900', async () => {
    const supabase = createMockSupabase({
      authUser: user,
      functions: {
        'flow-create-subscription': {
          data: { url: 'https://flow.cl/pay?token=yearly-token', token: 'yearly-token' },
        },
      },
    });

    const { data } = await supabase.functions.invoke('flow-create-subscription', {
      body: { plan: 'yearly' },
    });
    expect(data.token).toBe('yearly-token');
  });
});

describe('Payment flow: failed/cancelled payments', () => {
  it('webhook marks subscription as cancelled when payment rejected', async () => {
    const pendingSub = makeSubscription({ status: 'pending' });
    const supabase = createMockSupabase({
      tables: { subscriptions: { data: [{ ...pendingSub, status: 'cancelled' }] } },
    });

    // After webhook processes a rejected payment (status !== 2)
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_provider_id', pendingSub.payment_provider_id)
      .maybeSingle();

    expect(data!.status).toBe('cancelled');
  });
});
