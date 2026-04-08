-- WhatsApp notifications + Google Calendar sync (sesion 2026-04-09)
--
-- 1. profiles.whatsapp_number: telefono opt-in para recordatorios
-- 2. profiles.whatsapp_opted_in: flag explicito de consentimiento
-- 3. whatsapp_message_log: bitacora de mensajes enviados (debug + rate limit)
-- 4. google_calendar_tokens: refresh tokens por usuario (ENCRIPTADOS via Vault)
-- 5. external_calendar_events: mapping pet_reminder/appointment <-> google event id
--    para sync bidireccional sin duplicar.

-- ============================================================================
-- 1. WhatsApp opt-in en profiles
-- ============================================================================

alter table public.profiles
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_opted_in boolean not null default false,
  add column if not exists whatsapp_opted_in_at timestamptz;

comment on column public.profiles.whatsapp_number is
  'Numero E.164 (+569XXXXXXXX) para enviar recordatorios via Meta Cloud API';

-- ============================================================================
-- 2. Bitacora de mensajes WhatsApp enviados
-- ============================================================================

create table if not exists public.whatsapp_message_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_name text not null,
  recipient_phone text not null,
  status text not null check (status in ('sent', 'failed', 'delivered', 'read')),
  meta_message_id text,
  error_message text,
  related_reminder_id uuid references public.pet_reminders(id) on delete set null,
  related_appointment_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_log_user on public.whatsapp_message_log (user_id, created_at desc);
create index if not exists idx_whatsapp_log_reminder on public.whatsapp_message_log (related_reminder_id);

alter table public.whatsapp_message_log enable row level security;

create policy "users read own whatsapp log"
  on public.whatsapp_message_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "service role full access whatsapp log"
  on public.whatsapp_message_log for all
  to service_role
  using (true) with check (true);

-- ============================================================================
-- 3. Google Calendar tokens (refresh + access)
-- ============================================================================

create table if not exists public.google_calendar_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  calendar_id text, -- el "Paw Friend" calendar dentro del Google del user
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_tokens enable row level security;

-- Solo service role lee/escribe (las edge functions con SERVICE_ROLE_KEY).
-- El user nunca toca esta tabla directamente.
create policy "service role only google tokens"
  on public.google_calendar_tokens for all
  to service_role
  using (true) with check (true);

comment on table public.google_calendar_tokens is
  'OAuth tokens de Google Calendar por user. NO accesible desde el cliente.';

-- ============================================================================
-- 4. Mapping entre reminders/appointments locales y eventos de Google Calendar
-- ============================================================================

create table if not exists public.external_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('pet_reminder', 'appointment')),
  source_id uuid not null,
  google_event_id text not null,
  google_calendar_id text not null,
  last_synced_at timestamptz not null default now(),
  unique (source_type, source_id)
);

create index if not exists idx_ext_cal_user on public.external_calendar_events (user_id);
create index if not exists idx_ext_cal_google on public.external_calendar_events (google_event_id);

alter table public.external_calendar_events enable row level security;

create policy "users read own calendar mappings"
  on public.external_calendar_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "service role full access calendar mappings"
  on public.external_calendar_events for all
  to service_role
  using (true) with check (true);

-- ============================================================================
-- 5. Indices utiles para el cron de recordatorios
-- ============================================================================

create index if not exists idx_pet_reminders_due_active
  on public.pet_reminders (due_date)
  where is_completed = false;
