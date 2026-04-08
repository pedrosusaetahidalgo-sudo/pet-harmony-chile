-- Premium B2C con Flow (sesión 2026-04-07)
-- Decisiones tomadas:
--   Precio: $2.990/mes y $24.990/año
--   Modelo: 1 plan multi-mascota (no per-pet)
--   Grandfathering: SOLO users con >= 2 pets al lanzar premium (early adopters)
--   Sin trial
-- Nota: la regla "primeros 50 users" fue eliminada el 2026-04-08 — todos por igual.
--
-- Schema preexistente:
--   profiles tiene is_premium, premium_plan, premium_end_date, premium_start_date
--   subscriptions tiene plan_type, status, start_date, end_date, payment_provider_id, payment_amount_clp, auto_renew

-- ============================================================================
-- 1. Grandfathering flag
-- ============================================================================

alter table public.profiles
  add column if not exists is_grandfathered boolean not null default false;

comment on column public.profiles.is_grandfathered is
  'Usuario libre del paywall premium (pioneros + early adopters con >= 2 pets al lanzar premium)';

-- ============================================================================
-- 2. Marcar grandfathered: solo users con >= 2 pets (early adopters)
-- ============================================================================

update public.profiles p
   set is_grandfathered = true
 where exists (
   select 1
     from public.pets
    where owner_id = p.id
   group by owner_id
   having count(*) >= 2
 );

-- ============================================================================
-- 3. RPC can_add_pet — fuente de verdad para el bloqueo del frontend
-- ============================================================================

create or replace function public.can_add_pet(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet_count int;
  v_is_grandfathered boolean;
  v_is_premium boolean;
  v_premium_end timestamptz;
begin
  -- Caller must be the user (or admin via service_role bypass)
  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object(
      'can', false,
      'reason', 'forbidden',
      'pet_count', 0
    );
  end if;

  select count(*) into v_pet_count
    from public.pets
   where owner_id = p_user_id;

  select coalesce(is_grandfathered, false),
         coalesce(is_premium, false),
         premium_end_date
    into v_is_grandfathered, v_is_premium, v_premium_end
    from public.profiles
   where id = p_user_id;

  -- Grandfathered: siempre puede
  if v_is_grandfathered then
    return jsonb_build_object('can', true, 'reason', 'grandfathered', 'pet_count', v_pet_count);
  end if;

  -- Premium activo: siempre puede
  if v_is_premium and (v_premium_end is null or v_premium_end > now()) then
    return jsonb_build_object('can', true, 'reason', 'premium', 'pet_count', v_pet_count);
  end if;

  -- Free: 1 mascota gratis
  if v_pet_count < 1 then
    return jsonb_build_object('can', true, 'reason', 'free_slot', 'pet_count', v_pet_count);
  end if;

  return jsonb_build_object('can', false, 'reason', 'premium_required', 'pet_count', v_pet_count);
end;
$$;

grant execute on function public.can_add_pet(uuid) to authenticated;

-- ============================================================================
-- 4. Helper: aplicar premium tras pago confirmado (llamado por flow-webhook)
-- ============================================================================

create or replace function public.apply_premium(
  p_user_id uuid,
  p_plan text,            -- 'monthly' | 'yearly'
  p_amount_clp int,
  p_provider_id text      -- flow token / subscription id
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz := now();
  v_end timestamptz;
begin
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
