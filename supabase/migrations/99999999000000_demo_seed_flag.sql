-- Flag is_demo para identificar y limpiar usuarios/proveedores demo en bloque.
-- Migración idempotente con prefijo 99999999 para que siempre quede al final
-- (no interfiere con migraciones reales).
--
-- Cómo borrar todos los demos en bloque (cuando ya no se necesiten):
--   delete from auth.users where email like '%@demo.pawfriend.cl';
--   -- la cascada borra profiles, pets, medical_records, etc. vía FKs.

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

comment on column public.profiles.is_demo is
  'Usuario generado por scripts/seed-demo.ts. Excluir de métricas reales.';

create index if not exists idx_profiles_is_demo
  on public.profiles (is_demo) where is_demo = true;

-- service_providers también para poder filtrar el directorio público
alter table public.service_providers
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_service_providers_is_demo
  on public.service_providers (is_demo) where is_demo = true;
