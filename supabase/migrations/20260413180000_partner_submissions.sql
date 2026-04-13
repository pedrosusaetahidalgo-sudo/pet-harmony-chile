-- Partner submissions: formulario publico de captacion de partners
-- Pedro revisa manualmente y carga al directorio correspondiente

CREATE TABLE IF NOT EXISTS partner_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Categoria del partner
  categoria TEXT NOT NULL CHECK (categoria IN (
    'veterinaria','tienda','peluqueria','paseador','cuidador',
    'entrenador','refugio','seguro','crematorio','transporte','alimento','otro'
  )),

  -- Datos de contacto
  nombre_negocio TEXT NOT NULL,
  nombre_contacto TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  website TEXT,
  instagram TEXT,

  -- Ubicacion
  direccion TEXT,
  comuna TEXT,
  ciudad TEXT,

  -- Perfil
  descripcion TEXT,
  servicios_ofrecidos TEXT[] DEFAULT '{}',
  horario TEXT,

  -- Estado interno (solo admin)
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente','contactado','aprobado','rechazado')),
  notas_admin TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_partner_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partner_submissions_updated_at
  BEFORE UPDATE ON partner_submissions
  FOR EACH ROW EXECUTE FUNCTION update_partner_submissions_updated_at();

-- RLS
ALTER TABLE partner_submissions ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante (anon o auth) puede enviar solicitud
CREATE POLICY "anon_insert_partner_submission"
  ON partner_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo admin puede leer
CREATE POLICY "admin_select_partner_submissions"
  ON partner_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo admin puede actualizar (cambiar status, agregar notas)
CREATE POLICY "admin_update_partner_submissions"
  ON partner_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Indice para admin
CREATE INDEX idx_partner_submissions_status ON partner_submissions(status);
CREATE INDEX idx_partner_submissions_categoria ON partner_submissions(categoria);
