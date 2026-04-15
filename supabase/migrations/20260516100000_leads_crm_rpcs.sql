-- =====================================================
-- Leads CRM: RPCs para acceder al schema 'leads' desde el frontend.
-- El frontend usa supabase.rpc() que opera en public; estas RPCs
-- hacen bridge al schema leads de forma segura (solo admin).
--
-- PRERREQUISITO: aplicar sql/001_schema.sql del proyecto vets-leads-db
-- que crea el schema leads y las tablas vet_profesionales + vet_capturas_raw.
-- =====================================================

-- 1. Extender la tabla para campos CRM (si ya existe el schema leads)
DO $$
BEGIN
  -- Agregar columnas CRM si no existen
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'leads' AND table_name = 'vet_profesionales') THEN
    BEGIN
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS fecha_primer_contacto TIMESTAMPTZ;
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS fecha_ultimo_contacto TIMESTAMPTZ;
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS intentos_contacto INTEGER DEFAULT 0;
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS canal_contacto_preferido TEXT;
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS notas_seguimiento TEXT;
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS asignado_a TEXT;
      ALTER TABLE leads.vet_profesionales ADD COLUMN IF NOT EXISTS template_enviado TEXT;

      -- Extender el CHECK de estado_validacion para incluir estados CRM
      ALTER TABLE leads.vet_profesionales DROP CONSTRAINT IF EXISTS vet_profesionales_estado_validacion_check;
      ALTER TABLE leads.vet_profesionales ADD CONSTRAINT vet_profesionales_estado_validacion_check
        CHECK (estado_validacion IN ('pendiente', 'contactado', 'respondio', 'interesado', 'validado', 'convertido', 'descartado'));
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Algunas columnas CRM ya existen o schema leads no encontrado: %', SQLERRM;
    END;
  END IF;
END
$$;


-- 2. RPC: Listar leads con filtros (solo admin)
CREATE OR REPLACE FUNCTION public.get_leads_vets(
  p_estado TEXT DEFAULT NULL,
  p_prioridad TEXT DEFAULT NULL,
  p_comuna TEXT DEFAULT NULL,
  p_busqueda TEXT DEFAULT NULL,
  p_fuente TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY
    CASE t.prioridad_outreach WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
    t.fecha_captura DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      id, nombre_completo, registro_cmv, telefono, whatsapp,
      es_whatsapp_business, email, instagram, instagram_seguidores,
      tiktok, facebook, sitio_web, comunas_cobertura, especialidades,
      servicios, tarifa_consulta_clp_min, tarifa_consulta_clp_max,
      tiene_clinica_fisica, presencia_digital_score, fuente_dato,
      url_fuente, fecha_captura, fecha_actualizacion, estado_validacion,
      notas, prioridad_outreach, hash_dedup,
      fecha_primer_contacto, fecha_ultimo_contacto, intentos_contacto,
      canal_contacto_preferido, notas_seguimiento, asignado_a, template_enviado
    FROM leads.vet_profesionales
    WHERE
      (p_estado IS NULL OR estado_validacion = p_estado)
      AND (p_prioridad IS NULL OR prioridad_outreach = p_prioridad)
      AND (p_comuna IS NULL OR p_comuna = ANY(comunas_cobertura))
      AND (p_fuente IS NULL OR fuente_dato ILIKE '%' || p_fuente || '%')
      AND (
        p_busqueda IS NULL
        OR nombre_completo ILIKE '%' || p_busqueda || '%'
        OR instagram ILIKE '%' || p_busqueda || '%'
        OR telefono ILIKE '%' || p_busqueda || '%'
        OR email ILIKE '%' || p_busqueda || '%'
      )
  ) t;

  RETURN v_result;
END;
$$;


-- 3. RPC: Estadísticas de leads (solo admin)
CREATE OR REPLACE FUNCTION public.get_leads_vets_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM leads.vet_profesionales),
    'por_estado', (
      SELECT COALESCE(jsonb_object_agg(estado_validacion, cnt), '{}'::jsonb)
      FROM (SELECT estado_validacion, COUNT(*) as cnt FROM leads.vet_profesionales GROUP BY estado_validacion) s
    ),
    'por_prioridad', (
      SELECT COALESCE(jsonb_object_agg(prioridad_outreach, cnt), '{}'::jsonb)
      FROM (SELECT prioridad_outreach, COUNT(*) as cnt FROM leads.vet_profesionales GROUP BY prioridad_outreach) s
    ),
    'por_fuente', (
      SELECT COALESCE(jsonb_object_agg(fuente_dato, cnt), '{}'::jsonb)
      FROM (SELECT fuente_dato, COUNT(*) as cnt FROM leads.vet_profesionales GROUP BY fuente_dato) s
    ),
    'con_contacto', (
      SELECT COUNT(*) FROM leads.vet_profesionales
      WHERE telefono IS NOT NULL OR whatsapp IS NOT NULL OR email IS NOT NULL
    ),
    'contactados_hoy', (
      SELECT COUNT(*) FROM leads.vet_profesionales
      WHERE fecha_ultimo_contacto::date = CURRENT_DATE
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- 4. RPC: Actualizar estado de un lead (solo admin)
CREATE OR REPLACE FUNCTION public.update_lead_vet_estado(
  p_lead_id UUID,
  p_estado TEXT,
  p_notas TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  UPDATE leads.vet_profesionales
  SET
    estado_validacion = p_estado,
    notas_seguimiento = CASE
      WHEN p_notas IS NOT NULL THEN
        COALESCE(notas_seguimiento, '') || E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] ' || p_notas
      ELSE notas_seguimiento
    END,
    fecha_actualizacion = now()
  WHERE id = p_lead_id;
END;
$$;


-- 5. RPC: Registrar un contacto/intento de outreach (solo admin)
CREATE OR REPLACE FUNCTION public.registrar_contacto_lead(
  p_lead_id UUID,
  p_canal TEXT,
  p_notas TEXT DEFAULT NULL,
  p_template TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  UPDATE leads.vet_profesionales
  SET
    intentos_contacto = COALESCE(intentos_contacto, 0) + 1,
    fecha_ultimo_contacto = now(),
    fecha_primer_contacto = COALESCE(fecha_primer_contacto, now()),
    canal_contacto_preferido = p_canal,
    template_enviado = COALESCE(p_template, template_enviado),
    estado_validacion = CASE
      WHEN estado_validacion = 'pendiente' THEN 'contactado'
      ELSE estado_validacion
    END,
    notas_seguimiento = CASE
      WHEN p_notas IS NOT NULL THEN
        COALESCE(notas_seguimiento, '') || E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ' ' || p_canal || '] ' || p_notas
      ELSE notas_seguimiento
    END,
    fecha_actualizacion = now()
  WHERE id = p_lead_id;
END;
$$;


COMMENT ON FUNCTION public.get_leads_vets IS 'Lista leads de vets a domicilio con filtros. Solo admin. Bridge public→leads schema.';
COMMENT ON FUNCTION public.get_leads_vets_stats IS 'Estadísticas agregadas de leads. Solo admin.';
COMMENT ON FUNCTION public.update_lead_vet_estado IS 'Actualiza estado CRM de un lead. Solo admin.';
COMMENT ON FUNCTION public.registrar_contacto_lead IS 'Registra intento de contacto/outreach a un lead. Solo admin.';
