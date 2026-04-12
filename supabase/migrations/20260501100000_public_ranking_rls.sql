-- Fix: hacer el ranking público entre usuarios
-- Sin esta política, la RLS de user_guardian_progress solo permite ver tu propia fila,
-- lo que hace que el ranking muestre solo 1 persona.
-- NO aplicar automáticamente. El dueño aplica manualmente desde Supabase Dashboard > SQL Editor.

-- 1. Permitir que cualquier usuario autenticado lea el progreso de todos (para ranking)
CREATE POLICY "Anyone can view guardian progress for ranking"
  ON public.user_guardian_progress FOR SELECT
  USING (true);

-- La política anterior "Users can view their own progress" queda redundante pero no causa conflicto
-- (Postgres evalúa OR entre todas las políticas SELECT). Se puede eliminar opcionalmente:
-- DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_guardian_progress;
