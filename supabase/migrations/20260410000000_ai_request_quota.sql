-- Rate limiting de llamadas a edge functions de IA por usuario
create table if not exists public.ai_request_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_request_quota enable row level security;

-- Solo el service role puede leer/escribir esta tabla. El user no debe poder
-- manipularla directamente — solo las edge functions con service_role key.
create policy "ai_quota service role only"
  on public.ai_request_quota
  for all
  to service_role
  using (true) with check (true);

-- Función atómica que incrementa el contador y devuelve si está dentro del límite.
-- Window: 1 hora rodante. Límite: 30 requests/hora por usuario.
create or replace function public.check_and_increment_ai_quota(
  p_user_id uuid,
  p_limit integer default 30,
  p_window_seconds integer default 3600
)
returns table (allowed boolean, remaining integer, reset_in_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ai_request_quota;
  v_now timestamptz := now();
begin
  insert into public.ai_request_quota (user_id, count, window_start, updated_at)
  values (p_user_id, 0, v_now, v_now)
  on conflict (user_id) do nothing;

  select * into v_row from public.ai_request_quota where user_id = p_user_id for update;

  -- Reset si la ventana expiró
  if extract(epoch from (v_now - v_row.window_start)) >= p_window_seconds then
    update public.ai_request_quota
       set count = 1, window_start = v_now, updated_at = v_now
     where user_id = p_user_id
     returning * into v_row;
    return query select true, p_limit - 1, p_window_seconds;
    return;
  end if;

  -- Dentro de la ventana, ya en el límite → denegar
  if v_row.count >= p_limit then
    return query select
      false,
      0,
      greatest(0, p_window_seconds - extract(epoch from (v_now - v_row.window_start))::integer);
    return;
  end if;

  -- Incrementar
  update public.ai_request_quota
     set count = count + 1, updated_at = v_now
   where user_id = p_user_id
   returning * into v_row;

  return query select
    true,
    p_limit - v_row.count,
    greatest(0, p_window_seconds - extract(epoch from (v_now - v_row.window_start))::integer);
end;
$$;

revoke all on function public.check_and_increment_ai_quota(uuid, integer, integer) from public;
grant execute on function public.check_and_increment_ai_quota(uuid, integer, integer) to service_role;
