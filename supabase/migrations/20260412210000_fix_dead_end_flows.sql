-- ============================================================
-- Fix dead-end flows: notificaciones de booking + tabla content_reports
-- 2026-04-12
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.
-- ============================================================

-- ============================================================
-- 1. TABLA content_reports (no existia, los reportes de posts iban a la nada)
-- ============================================================

CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  comment_id uuid,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver reportes (la admin UI ya chequea rol)
CREATE POLICY "Admins can manage reports"
  ON content_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Usuarios autenticados pueden crear reportes
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Un usuario no puede reportar el mismo post dos veces
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_report
  ON content_reports(reporter_id, post_id) WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_reports_status
  ON content_reports(status) WHERE status = 'pending';


-- ============================================================
-- 2. NOTIFICACIONES para walk_bookings
-- ============================================================

CREATE OR REPLACE FUNCTION notify_walker_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_walker_user_id uuid;
BEGIN
  IF NEW.walker_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- walker_id apunta a service_providers
  SELECT user_id INTO v_walker_user_id
  FROM service_providers
  WHERE id = NEW.walker_id;

  IF v_walker_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    v_walker_user_id,
    'booking_received',
    'Nueva solicitud de paseo',
    COALESCE(NEW.special_instructions, 'Un dueño quiere reservar un paseo contigo.'),
    '/provider/dashboard',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_walk_booking ON walk_bookings;
CREATE TRIGGER notify_on_walk_booking
  AFTER INSERT ON walk_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_walker_on_booking();


-- ============================================================
-- 3. NOTIFICACIONES para dogsitter_bookings
-- ============================================================

CREATE OR REPLACE FUNCTION notify_dogsitter_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sitter_user_id uuid;
BEGIN
  IF NEW.dogsitter_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_sitter_user_id
  FROM service_providers
  WHERE id = NEW.dogsitter_id;

  IF v_sitter_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    v_sitter_user_id,
    'booking_received',
    'Nueva solicitud de cuidado',
    COALESCE(NEW.special_instructions, 'Un dueño quiere reservar cuidado de mascota contigo.'),
    '/provider/dashboard',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_dogsitter_booking ON dogsitter_bookings;
CREATE TRIGGER notify_on_dogsitter_booking
  AFTER INSERT ON dogsitter_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_dogsitter_on_booking();


-- ============================================================
-- 4. NOTIFICACION al usuario cuando su verificacion es aprobada/rechazada
-- ============================================================

CREATE OR REPLACE FUNCTION notify_user_on_verification_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
      CASE WHEN NEW.status = 'approved'
        THEN '¡Tu solicitud fue aprobada!'
        ELSE 'Actualización sobre tu solicitud'
      END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Ya puedes ofrecer tus servicios como ' || NEW.requested_role || ' en Paw Friend.'
        ELSE 'Tu solicitud como ' || NEW.requested_role || ' no fue aprobada. Puedes volver a intentarlo completando tu perfil.'
      END,
      CASE WHEN NEW.status = 'approved' THEN '/provider/dashboard' ELSE '/profile' END,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_verification_decision ON verification_requests;
CREATE TRIGGER notify_on_verification_decision
  AFTER UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_verification_decision();


-- ============================================================
-- 5. NOTIFICACION al dueno cuando vet confirma/cancela booking
-- ============================================================

CREATE OR REPLACE FUNCTION notify_owner_on_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status = 'pendiente' AND NEW.status IN ('confirmado', 'cancelado') THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      CASE WHEN NEW.status = 'confirmado' THEN 'booking_confirmed' ELSE 'booking_cancelled' END,
      CASE WHEN NEW.status = 'confirmado'
        THEN '¡Tu reserva fue confirmada!'
        ELSE 'Tu reserva fue cancelada'
      END,
      CASE WHEN NEW.status = 'confirmado'
        THEN 'El veterinario confirmó tu cita. Revisa los detalles en Mis Reservas.'
        ELSE COALESCE('Motivo: ' || NEW.cancellation_reason, 'El veterinario canceló la reserva.')
      END,
      '/mis-reservas',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_vet_booking_update ON vet_bookings;
CREATE TRIGGER notify_on_vet_booking_update
  AFTER UPDATE ON vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_on_booking_update();
