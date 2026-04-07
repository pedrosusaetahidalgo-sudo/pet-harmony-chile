-- Backend cleanup migration (2026-04-07 session)
-- 1) training_reviews: RLS habilitado pero sin policies → tabla inutilizable
-- 2) Buckets walk-photos y verification-docs: file_size_limit NULL → riesgo subida masiva

-- ============================================================================
-- 1. training_reviews policies
-- ============================================================================

-- Lectura pública (las reseñas son visibles para todos los users autenticados)
drop policy if exists "training_reviews_select_all" on public.training_reviews;
create policy "training_reviews_select_all"
  on public.training_reviews
  for select
  to authenticated
  using (true);

-- Insert: solo el autor puede crear su review
drop policy if exists "training_reviews_insert_own" on public.training_reviews;
create policy "training_reviews_insert_own"
  on public.training_reviews
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- Update: solo el autor puede editar su propia review
drop policy if exists "training_reviews_update_own" on public.training_reviews;
create policy "training_reviews_update_own"
  on public.training_reviews
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Delete: solo el autor puede borrar su propia review
drop policy if exists "training_reviews_delete_own" on public.training_reviews;
create policy "training_reviews_delete_own"
  on public.training_reviews
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ============================================================================
-- 2. Bucket size limits (5 MB)
-- ============================================================================

update storage.buckets
   set file_size_limit = 5242880
 where id in ('walk-photos', 'verification-docs')
   and (file_size_limit is null or file_size_limit > 5242880);
