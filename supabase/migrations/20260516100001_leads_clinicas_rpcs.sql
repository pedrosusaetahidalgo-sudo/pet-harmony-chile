-- =====================================================
-- RPCs para clínicas veterinarias en schema leads.
-- Bridge public→leads para acceso desde frontend admin.
-- PRERREQUISITO: aplicar sql/002_clinicas_schema.sql
-- =====================================================

-- 1. Listar clínicas con filtros (solo admin)
CREATE OR REPLACE FUNCTION public.get_leads_clinicas(
  p_estado TEXT DEFAULT NULL,
  p_prioridad TEXT DEFAULT NULL,
  p_comuna TEXT DEFAULT NULL,
  p_busqueda TEXT DEFAULT NULL,
  p_tamano TEXT DEFAULT NULL,
  p_es_cadena BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY
    CASE t.prioridad_outreach WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
    t.google_reviews_count DESC NULLS LAST
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT *
    FROM leads.vet_clinicas
    WHERE
      (p_estado IS NULL OR estado_validacion = p_estado)
      AND (p_prioridad IS NULL OR prioridad_outreach = p_prioridad)
      AND (p_comuna IS NULL OR comuna = p_comuna)
      AND (p_tamano IS NULL OR tamano_estimado = p_tamano)
      AND (p_es_cadena IS NULL OR es_cadena = p_es_cadena)
      AND (
        p_busqueda IS NULL
        OR nombre_clinica ILIKE '%' || p_busqueda || '%'
        OR instagram ILIKE '%' || p_busqueda || '%'
        OR telefono_principal ILIKE '%' || p_busqueda || '%'
        OR email ILIKE '%' || p_busqueda || '%'
        OR comuna ILIKE '%' || p_busqueda || '%'
      )
  ) t;

  RETURN v_result;
END;
$$;

-- 2. Stats de clínicas (solo admin)
CREATE OR REPLACE FUNCTION public.get_leads_clinicas_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM leads.vet_clinicas),
    'por_estado', (
      SELECT COALESCE(jsonb_object_agg(estado_validacion, cnt), '{}'::jsonb)
      FROM (SELECT estado_validacion, COUNT(*) as cnt FROM leads.vet_clinicas GROUP BY estado_validacion) s
    ),
    'por_prioridad', (
      SELECT COALESCE(jsonb_object_agg(prioridad_outreach, cnt), '{}'::jsonb)
      FROM (SELECT prioridad_outreach, COUNT(*) as cnt FROM leads.vet_clinicas GROUP BY prioridad_outreach) s
    ),
    'por_comuna', (
      SELECT COALESCE(jsonb_object_agg(COALESCE(comuna, 'Sin comuna'), cnt), '{}'::jsonb)
      FROM (SELECT comuna, COUNT(*) as cnt FROM leads.vet_clinicas GROUP BY comuna ORDER BY cnt DESC LIMIT 15) s
    ),
    'por_tamano', (
      SELECT COALESCE(jsonb_object_agg(tamano_estimado, cnt), '{}'::jsonb)
      FROM (SELECT tamano_estimado, COUNT(*) as cnt FROM leads.vet_clinicas GROUP BY tamano_estimado) s
    ),
    'cadenas', (SELECT COUNT(*) FROM leads.vet_clinicas WHERE es_cadena = true),
    'independientes', (SELECT COUNT(*) FROM leads.vet_clinicas WHERE es_cadena = false),
    'con_whatsapp', (SELECT COUNT(*) FROM leads.vet_clinicas WHERE whatsapp IS NOT NULL)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3. Actualizar estado clínica (solo admin)
CREATE OR REPLACE FUNCTION public.update_lead_clinica_estado(
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
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE leads.vet_clinicas
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

-- 4. Registrar contacto clínica (solo admin)
CREATE OR REPLACE FUNCTION public.registrar_contacto_clinica(
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
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  UPDATE leads.vet_clinicas
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

COMMENT ON FUNCTION public.get_leads_clinicas IS 'Lista clínicas veterinarias con filtros. Solo admin.';
COMMENT ON FUNCTION public.get_leads_clinicas_stats IS 'Stats clínicas. Solo admin.';
COMMENT ON FUNCTION public.update_lead_clinica_estado IS 'Actualiza estado CRM clínica. Solo admin.';
COMMENT ON FUNCTION public.registrar_contacto_clinica IS 'Registra contacto a clínica. Solo admin.';
