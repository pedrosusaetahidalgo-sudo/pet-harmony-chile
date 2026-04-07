-- Create shared walks table
CREATE TABLE IF NOT EXISTS public.shared_walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_point TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  max_participants INTEGER NOT NULL DEFAULT 5,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'lleno', 'completado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared walk participants table
CREATE TABLE IF NOT EXISTS public.shared_walk_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES public.shared_walks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pet_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(walk_id, user_id)
);

-- Enable RLS
ALTER TABLE public.shared_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_walk_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_walks
CREATE POLICY "Paseos compartidos visibles por todos"
  ON public.shared_walks
  FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear paseos compartidos"
  ON public.shared_walks
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizadores pueden actualizar sus paseos"
  ON public.shared_walks
  FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizadores pueden eliminar sus paseos"
  ON public.shared_walks
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- RLS Policies for shared_walk_participants
CREATE POLICY "Participantes visibles para organizador y participantes"
  ON public.shared_walk_participants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT organizer_id FROM public.shared_walks WHERE id = walk_id
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Usuarios pueden unirse a paseos"
  ON public.shared_walk_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden cancelar su participación"
  ON public.shared_walk_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su participación"
  ON public.shared_walk_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_shared_walks_organizer ON public.shared_walks(organizer_id);
CREATE INDEX IF NOT EXISTS idx_shared_walks_date ON public.shared_walks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_shared_walk_participants_walk ON public.shared_walk_participants(walk_id);
CREATE INDEX IF NOT EXISTS idx_shared_walk_participants_user ON public.shared_walk_participants(user_id);