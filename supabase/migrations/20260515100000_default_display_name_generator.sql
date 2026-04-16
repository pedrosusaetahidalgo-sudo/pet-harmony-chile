-- Generate unique friendly display names for new users instead of falling back to email
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

-- Helper: generate a random friendly display name like "GatitoFeliz_3847"
CREATE OR REPLACE FUNCTION public.generate_default_display_name()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Feliz', 'Tierno', 'Valiente', 'Curioso', 'Jugueton',
    'Dormilon', 'Travieso', 'Peludo', 'Saltarin', 'Mimoso',
    'Alegre', 'Brillante', 'Suave', 'Rapido', 'Noble',
    'Fiel', 'Dulce', 'Manso', 'Audaz', 'Sereno'
  ];
  animals TEXT[] := ARRAY[
    'Gatito', 'Perrito', 'Conejito', 'Hamster', 'Pajarito',
    'Tortuga', 'Panda', 'Koala', 'Delfin', 'Zorro',
    'Lobo', 'Oso', 'Tigre', 'Leon', 'Halcon',
    'Colibri', 'Nutria', 'Foca', 'Buho', 'Ciervo'
  ];
  adj TEXT;
  animal TEXT;
  num INT;
BEGIN
  adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  animal := animals[1 + floor(random() * array_length(animals, 1))::int];
  num := 1000 + floor(random() * 9000)::int;
  RETURN animal || adj || '_' || num::text;
END;
$$;

-- Update handle_new_user to use generated names instead of email fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_name TEXT;
  final_name TEXT;
BEGIN
  raw_name := NEW.raw_user_meta_data->>'name';

  -- If no name provided or name looks like an email, generate a friendly one
  IF raw_name IS NULL OR raw_name = '' OR raw_name ~ '^[a-zA-Z0-9._%+-]+@' THEN
    final_name := generate_default_display_name();
  ELSE
    final_name := raw_name;
  END IF;

  INSERT INTO public.profiles (id, display_name, plan_id, is_premium, plan_expires_at)
  VALUES (
    NEW.id,
    final_name,
    'premium',
    true,
    now() + interval '14 days'
  );

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
