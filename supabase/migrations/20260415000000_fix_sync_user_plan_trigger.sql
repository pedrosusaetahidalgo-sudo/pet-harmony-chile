-- Fix trigger sync_user_plan: usaba campos del schema viejo (plan_id,
-- plan_badge, plan_expires_at, current_period_end) que ya no existen.
-- El schema actual usa is_premium, premium_plan, premium_end_date.
--
-- Sintoma: insertar en subscriptions tiraba
--   "record new has no field plan_id"
-- Detectado durante el seed de 100 demos (sesion 2026-04-09).

create or replace function public.sync_user_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' or new.status = 'trial' then
    update public.profiles set
      is_premium = true,
      premium_plan = new.plan_type,
      premium_start_date = new.start_date,
      premium_end_date = new.end_date,
      updated_at = now()
    where id = new.user_id;
  elsif new.status in ('cancelled', 'expired', 'failed') then
    update public.profiles set
      is_premium = false,
      premium_plan = null,
      premium_end_date = null,
      updated_at = now()
    where id = new.user_id;
  end if;
  return new;
end;
$$;
