-- ==========================================================================
-- Auditoría funcional 2026-04-07: agrega FKs faltantes hacia public.profiles
-- ==========================================================================
--
-- Contexto:
--   * post_comments.user_id tenía FK solo a auth.users(id). Supabase REST/PostgREST
--     no puede resolver embeds tipo `profiles(...)` cuando la FK apunta a un schema
--     no expuesto (auth). Frontend rompía con SelectQueryError en PostComments.tsx.
--   * service_reviews.reviewer_id no tenía ninguna FK declarada. Mismo síntoma en
--     ReviewsList.tsx.
--
-- Como public.profiles.id ya referencia auth.users(id), agregar una segunda FK
-- desde estas columnas hacia public.profiles(id) es seguro siempre y cuando
-- todos los user_id / reviewer_id existentes tengan profile. Las pre-checks
-- abajo abortan la migración si hay huérfanos, en cuyo caso hay que limpiar
-- los datos antes de re-correr.
-- ==========================================================================

do $$
declare
  orphan_comments  int;
  orphan_reviews   int;
begin
  select count(*) into orphan_comments
  from public.post_comments c
  left join public.profiles p on p.id = c.user_id
  where p.id is null;

  select count(*) into orphan_reviews
  from public.service_reviews r
  left join public.profiles p on p.id = r.reviewer_id
  where p.id is null;

  if orphan_comments > 0 then
    raise exception 'No se puede agregar FK: % post_comments tienen user_id sin profile. Limpiá primero.', orphan_comments;
  end if;

  if orphan_reviews > 0 then
    raise exception 'No se puede agregar FK: % service_reviews tienen reviewer_id sin profile. Limpiá primero.', orphan_reviews;
  end if;
end$$;

-- post_comments: nueva FK hacia profiles (la FK a auth.users se mantiene)
alter table public.post_comments
  add constraint post_comments_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- service_reviews: FK reviewer_id → profiles (no existía ninguna)
alter table public.service_reviews
  add constraint service_reviews_reviewer_id_profiles_fkey
  foreign key (reviewer_id) references public.profiles(id) on delete cascade;
