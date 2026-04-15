-- =====================================================
-- RPC para upsert de leads desde el pipeline Python.
-- supabase-py no soporta .schema(), así que usamos RPC.
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_lead_vet(p_data JSONB)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO leads.vet_profesionales (
    nombre_completo, registro_cmv, telefono, whatsapp, es_whatsapp_business,
    email, instagram, instagram_seguidores, tiktok, facebook, sitio_web,
    comunas_cobertura, especialidades, servicios,
    tarifa_consulta_clp_min, tarifa_consulta_clp_max,
    tiene_clinica_fisica, presencia_digital_score, fuente_dato, url_fuente,
    estado_validacion, notas, prioridad_outreach, hash_dedup
  ) VALUES (
    p_data->>'nombre_completo', p_data->>'registro_cmv',
    p_data->>'telefono', p_data->>'whatsapp', (p_data->>'es_whatsapp_business')::boolean,
    p_data->>'email', p_data->>'instagram', (p_data->>'instagram_seguidores')::int,
    p_data->>'tiktok', p_data->>'facebook', p_data->>'sitio_web',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'comunas_cobertura', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'especialidades', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_data->'servicios', '[]'::jsonb))),
    (p_data->>'tarifa_consulta_clp_min')::int, (p_data->>'tarifa_consulta_clp_max')::int,
    COALESCE((p_data->>'tiene_clinica_fisica')::boolean, false),
    (p_data->>'presencia_digital_score')::int,
    p_data->>'fuente_dato', p_data->>'url_fuente',
    COALESCE(p_data->>'estado_validacion', 'pendiente'),
    p_data->>'notas',
    COALESCE(p_data->>'prioridad_outreach', 'baja'),
    p_data->>'hash_dedup'
  )
  ON CONFLICT (hash_dedup) DO UPDATE SET
    nombre_completo = COALESCE(EXCLUDED.nombre_completo, leads.vet_profesionales.nombre_completo),
    telefono = COALESCE(EXCLUDED.telefono, leads.vet_profesionales.telefono),
    whatsapp = COALESCE(EXCLUDED.whatsapp, leads.vet_profesionales.whatsapp),
    email = COALESCE(EXCLUDED.email, leads.vet_profesionales.email),
    instagram = COALESCE(EXCLUDED.instagram, leads.vet_profesionales.instagram),
    instagram_seguidores = GREATEST(EXCLUDED.instagram_seguidores, leads.vet_profesionales.instagram_seguidores),
    comunas_cobertura = CASE
      WHEN array_length(EXCLUDED.comunas_cobertura, 1) > array_length(leads.vet_profesionales.comunas_cobertura, 1)
      THEN EXCLUDED.comunas_cobertura
      ELSE leads.vet_profesionales.comunas_cobertura
    END,
    presencia_digital_score = GREATEST(EXCLUDED.presencia_digital_score, leads.vet_profesionales.presencia_digital_score),
    fuente_dato = leads.vet_profesionales.fuente_dato || ', ' || EXCLUDED.fuente_dato,
    fecha_actualizacion = now();

  RETURN 'ok';
END;
$$;

COMMENT ON FUNCTION public.upsert_lead_vet IS 'Upsert de un lead vet desde pipeline Python. Service role only.';
