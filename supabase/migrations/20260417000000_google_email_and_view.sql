-- Agregar google_email a la tabla de tokens (para mostrar en Settings)
-- + view publica que el cliente puede leer (sin tokens, solo metadata)

alter table public.google_calendar_tokens
  add column if not exists google_email text;

-- Vista de solo lectura para el cliente: expone solo lo necesario
create or replace view public.google_calendar_status
with (security_invoker = true)
as
select
  user_id,
  google_email,
  calendar_id,
  expires_at,
  created_at
from public.google_calendar_tokens
where user_id = auth.uid();

grant select on public.google_calendar_status to authenticated;
