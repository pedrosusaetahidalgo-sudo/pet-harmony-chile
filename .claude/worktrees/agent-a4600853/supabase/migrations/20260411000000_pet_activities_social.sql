create table if not exists public.pet_activities (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'walk','vet_visit','vaccine','medication','grooming',
    'weight_check','achievement','streak_milestone'
  )),
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  cheers_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists pet_activities_created_at_idx on public.pet_activities (created_at desc);
create index if not exists pet_activities_owner_idx on public.pet_activities (owner_id);
create index if not exists pet_activities_pet_idx on public.pet_activities (pet_id);

alter table public.pet_activities enable row level security;

create policy "owners insert own activities"
  on public.pet_activities for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "anyone authenticated reads activities (v1)"
  on public.pet_activities for select
  to authenticated
  using (true);

create policy "owners delete own activities"
  on public.pet_activities for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Cheers (felicitaciones). Un user puede aplaudir una sola vez por activity.
create table if not exists public.pet_activity_cheers (
  activity_id uuid not null references public.pet_activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

alter table public.pet_activity_cheers enable row level security;

create policy "users insert own cheers"
  on public.pet_activity_cheers for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "anyone authenticated reads cheers"
  on public.pet_activity_cheers for select
  to authenticated
  using (true);

create policy "users delete own cheers"
  on public.pet_activity_cheers for delete
  to authenticated
  using (auth.uid() = user_id);

-- Trigger para mantener cheers_count sincronizado
create or replace function public.bump_pet_activity_cheers()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.pet_activities set cheers_count = cheers_count + 1 where id = new.activity_id;
  elsif tg_op = 'DELETE' then
    update public.pet_activities set cheers_count = greatest(0, cheers_count - 1) where id = old.activity_id;
  end if;
  return null;
end;
$$;

drop trigger if exists pet_activity_cheers_trg on public.pet_activity_cheers;
create trigger pet_activity_cheers_trg
  after insert or delete on public.pet_activity_cheers
  for each row execute function public.bump_pet_activity_cheers();
