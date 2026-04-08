-- Backend hardening Premium B2C Flow (sesión 2026-04-08)
--
-- 1. Idempotencia del webhook: apply_premium ahora es no-op si ya existe una
--    subscription activa con el mismo payment_provider_id (Flow puede reintentar
--    el callback legítimamente y eso no debe duplicar rows ni renovar el end_date).
--
-- 2. Rate limit dedicado para flow-create-subscription (10 req/hora por user).
--    Tabla separada de ai_request_quota para no mezclar contadores.

-- ============================================================================
-- 1. apply_premium con guard de idempotencia
-- ============================================================================

create or replace function public.apply_premium(
  p_user_id uuid,
  p_plan text,            -- 'monthly' | 'yearly'
  p_amount_clp int,
  p_provider_id text      -- flow token
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz := now();
  v_end timestamptz;
  v_existing_id uuid;
begin
  -- Idempotencia: si ya hay una subscription activa con este provider_id, salir.
  -- Cubre el caso de retries del webhook de Flow.
  select id into v_existing_id
    from public.subscriptions
   where payment_provider_id = p_provider_id
     and status = 'active'
   limit 1;

  if v_existing_id is not null then
    return;
  end if;

  if p_plan = 'yearly' then
    v_end := v_start + interval '1 year';
  else
    v_end := v_start + interval '1 month';
  end if;

  update public.profiles
     set is_premium = true,
         premium_plan = p_plan,
         premium_start_date = v_start,
         premium_end_date = v_end,
         updated_at = now()
   where id = p_user_id;

  insert into public.subscriptions (
    user_id, plan_type, status, start_date, end_date,
    payment_amount_clp, payment_provider_id, auto_renew
  )
  values (
    p_user_id, p_plan, 'active', v_start, v_end,
    p_amount_clp, p_provider_id, true
  );
end;
$$;

grant execute on function public.apply_premium(uuid, text, int, text) to service_role;

-- ============================================================================
-- 2. Rate limit para flow-create-subscription (10/h por user)
-- ============================================================================

create table if not exists public.payment_request_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_request_quota enable row level security;

create policy "payment_quota service role only"
  on public.payment_request_quota
  for all
  to service_role
  using (true) with check (true);

create or replace function public.check_and_increment_payment_quota(
  p_user_id uuid,
  p_limit integer default 10,
  p_window_seconds integer default 3600
)
returns table (allowed boolean, remaining integer, reset_in_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.payment_request_quota;
  v_now timestamptz := now();
begin
  insert into public.payment_request_quota (user_id, count, window_start, updated_at)
  values (p_user_id, 0, v_now, v_now)
  on conflict (user_id) do nothing;

  select * into v_row from public.payment_request_quota where user_id = p_user_id for update;

  if extract(epoch from (v_now - v_row.window_start)) >= p_window_seconds then
    update public.payment_request_quota
       set count = 1, window_start = v_now, updated_at = v_now
     where user_id = p_user_id
     returning * into v_row;
    return query select true, p_limit - 1, p_window_seconds;
    return;
  end if;

  if v_row.count >= p_limit then
    return query select
      false,
      0,
      greatest(0, p_window_seconds - extract(epoch from (v_now - v_row.window_start))::integer);
    return;
  end if;

  update public.payment_request_quota
     set count = count + 1, updated_at = v_now
   where user_id = p_user_id
   returning * into v_row;

  return query select
    true,
    p_limit - v_row.count,
    greatest(0, p_window_seconds - extract(epoch from (v_now - v_row.window_start))::integer);
end;
$$;

revoke all on function public.check_and_increment_payment_quota(uuid, integer, integer) from public;
grant execute on function public.check_and_increment_payment_quota(uuid, integer, integer) to service_role;
