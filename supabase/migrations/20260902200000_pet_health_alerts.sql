-- ══════════════════════════════════════════════════════════════════════════
-- Pet health alerts + weight loss cascade (Refactor Maestro §2.8.3)
-- ══════════════════════════════════════════════════════════════════════════
-- Implementa la primera cascada del principio §2.8 "Ambient Computing".
-- La app trabaja sola: si el peso de la mascota cae 10%+ en 30d sin
-- contexto medico, dispara alerta automatica visible en /home.
--
-- Por que importa:
--   - 10% de baja de peso en 30d es bandera roja clinica (deshidratacion,
--     cancer, parasitos, problema dental, depresion post-perdida)
--   - El dueño suele no detectarlo porque ve a la mascota todos los dias
--   - Detectarlo y sugerir vet 1-2 semanas antes salva vidas
--
-- Tabla nueva: public.pet_health_alerts
--   - Generica (alert_type ENUM-style, no solo weight_loss)
--   - Cada alerta tiene severity, message, metadata, y owner can dismiss
--   - RLS: solo el owner del pet puede leer/escribir
--
-- Trigger: pets_weight_loss_alert
--   - BEFORE UPDATE on pets
--   - Si NEW.weight es NOT NULL Y existe peso de hace 25-35d
--   - Y NEW.weight <= 0.9 * peso_anterior → inserta alerta
--   - Idempotente: una alerta abierta por pet a la vez (UNIQUE WHERE NOT dismissed)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Tabla de alertas
CREATE TABLE IF NOT EXISTS public.pet_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'weight_loss_30d',
    'vaccine_overdue',
    'no_activity_7d',
    'antiparasitic_overdue',
    'birthday_window'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pet_health_alerts IS
  'Alertas automaticas generadas por triggers de cascada (§2.8.3 Refactor Maestro). '
  'El dueño las ve en /home; al revisarlas, marca dismissed_at.';

-- Indices
CREATE INDEX IF NOT EXISTS idx_pet_health_alerts_pet
  ON public.pet_health_alerts(pet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pet_health_alerts_owner_active
  ON public.pet_health_alerts(owner_id, created_at DESC)
  WHERE dismissed_at IS NULL;

-- Idempotencia: una alerta no-dismissed por (pet, type) a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_health_alerts_unique_active
  ON public.pet_health_alerts(pet_id, alert_type)
  WHERE dismissed_at IS NULL;

-- RLS
ALTER TABLE public.pet_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_their_alerts"
  ON public.pet_health_alerts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "owners_dismiss_their_alerts"
  ON public.pet_health_alerts FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- INSERT solo por SECURITY DEFINER de los triggers (no policy para clients)

-- 2. Trigger: weight loss 10%+ en 30d
CREATE OR REPLACE FUNCTION public.detect_weight_loss_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_weight NUMERIC;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_pct_change NUMERIC;
BEGIN
  -- Solo si hay peso nuevo y distinto del anterior
  IF NEW.weight IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD IS NULL OR NEW.weight IS NOT DISTINCT FROM OLD.weight THEN
    RETURN NEW;
  END IF;

  -- Buscar el peso registrado hace 25-35 dias en weight_history
  v_window_start := NOW() - INTERVAL '35 days';
  v_window_end := NOW() - INTERVAL '25 days';

  SELECT (entry->>'weight')::NUMERIC INTO v_old_weight
  FROM jsonb_array_elements(COALESCE(NEW.weight_history, '[]'::jsonb)) AS entry
  WHERE (entry->>'date')::TIMESTAMPTZ BETWEEN v_window_start AND v_window_end
  ORDER BY (entry->>'date')::TIMESTAMPTZ DESC
  LIMIT 1;

  -- Si no hay peso previo en la ventana, no podemos calcular cambio
  IF v_old_weight IS NULL OR v_old_weight = 0 THEN
    RETURN NEW;
  END IF;

  -- Calcular % de cambio
  v_pct_change := ((NEW.weight - v_old_weight) / v_old_weight) * 100;

  -- Si bajo 10% o mas, crear alerta (idempotente: ON CONFLICT DO NOTHING)
  IF v_pct_change <= -10 THEN
    INSERT INTO public.pet_health_alerts (
      pet_id,
      owner_id,
      alert_type,
      severity,
      message,
      metadata
    )
    SELECT
      NEW.id,
      NEW.owner_id,
      'weight_loss_30d',
      CASE
        WHEN v_pct_change <= -20 THEN 'high'
        WHEN v_pct_change <= -15 THEN 'medium'
        ELSE 'low'
      END,
      FORMAT(
        '%s bajo %s%% de peso en el ultimo mes (%s kg → %s kg). Considera consultar al vet.',
        NEW.name,
        ROUND(ABS(v_pct_change), 1),
        ROUND(v_old_weight, 1),
        ROUND(NEW.weight, 1)
      ),
      jsonb_build_object(
        'pct_change', ROUND(v_pct_change, 2),
        'old_weight', v_old_weight,
        'new_weight', NEW.weight,
        'window_days', 30
      )
    WHERE NEW.owner_id IS NOT NULL
    -- Idempotencia: si ya hay una alerta abierta para este pet+tipo, no duplicar
    ON CONFLICT (pet_id, alert_type) WHERE dismissed_at IS NULL DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_pets_weight_loss_alert ON public.pets;
CREATE TRIGGER trigger_pets_weight_loss_alert
  AFTER UPDATE OF weight ON public.pets
  FOR EACH ROW
  WHEN (NEW.weight IS DISTINCT FROM OLD.weight AND NEW.weight IS NOT NULL)
  EXECUTE FUNCTION public.detect_weight_loss_alert();

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test: el trigger se crea sin sintax errors. No hacemos insert real
-- aqui porque requiere user real + history JSONB > 25 dias atras.
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  PERFORM 1
  FROM pg_trigger
  WHERE tgname = 'trigger_pets_weight_loss_alert';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trigger trigger_pets_weight_loss_alert no se creo';
  END IF;

  PERFORM 1
  FROM pg_proc WHERE proname = 'detect_weight_loss_alert';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcion detect_weight_loss_alert no se creo';
  END IF;

  PERFORM 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'pet_health_alerts';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tabla pet_health_alerts no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: pet_health_alerts + trigger weight_loss';
END $$;
