-- Seed: 50+ precios referenciales de servicios veterinarios por comuna RM
-- Fuente: referencias públicas Chile 2024-2026
-- Nota: estos son precios referenciales, no precios reales de vets específicos

INSERT INTO vet_service_prices (service_type, service_name, price_min, price_max, comuna, currency, source, is_reference)
VALUES
  -- CONSULTA GENERAL
  ('consulta', 'Consulta general', 15000, 30000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('consulta', 'Consulta general', 15000, 28000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('consulta', 'Consulta general', 12000, 22000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('consulta', 'Consulta general', 10000, 18000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('consulta', 'Consulta general', 10000, 20000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- VACUNACIÓN
  ('vacuna', 'Vacuna séxtuple/óctuple', 15000, 30000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna séxtuple/óctuple', 15000, 28000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna séxtuple/óctuple', 12000, 25000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna séxtuple/óctuple', 10000, 20000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna séxtuple/óctuple', 10000, 22000, 'La Florida', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna antirrábica', 8000, 15000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna antirrábica', 8000, 15000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna antirrábica', 6000, 12000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna antirrábica', 5000, 10000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('vacuna', 'Vacuna antirrábica', 5000, 10000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- ESTERILIZACIÓN
  ('cirugia', 'Esterilización hembra (perro)', 80000, 150000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Esterilización hembra (perro)', 80000, 140000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Esterilización hembra (perro)', 60000, 120000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Esterilización hembra (perro)', 50000, 100000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Esterilización hembra (perro)', 50000, 100000, 'La Florida', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Castración macho (perro)', 50000, 100000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Castración macho (perro)', 50000, 90000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Castración macho (perro)', 40000, 80000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Castración macho (perro)', 30000, 65000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Castración macho (perro)', 30000, 65000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- LIMPIEZA DENTAL
  ('cirugia', 'Limpieza dental', 80000, 180000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Limpieza dental', 80000, 170000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Limpieza dental', 60000, 140000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Limpieza dental', 50000, 120000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('cirugia', 'Limpieza dental', 50000, 120000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- DESPARASITACIÓN
  ('desparasitacion', 'Desparasitación interna', 5000, 15000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('desparasitacion', 'Desparasitación interna', 5000, 12000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('desparasitacion', 'Desparasitación interna', 4000, 10000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('desparasitacion', 'Desparasitación interna', 3000, 8000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('desparasitacion', 'Desparasitación interna', 3000, 8000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- EXÁMENES DE SANGRE
  ('examen', 'Hemograma completo', 15000, 30000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('examen', 'Hemograma completo', 15000, 28000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('examen', 'Hemograma completo', 12000, 25000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('examen', 'Hemograma completo', 10000, 20000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('examen', 'Hemograma completo', 10000, 20000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- ECOGRAFÍA
  ('examen', 'Ecografía abdominal', 30000, 60000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('examen', 'Ecografía abdominal', 30000, 55000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('examen', 'Ecografía abdominal', 25000, 50000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('examen', 'Ecografía abdominal', 20000, 40000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('examen', 'Ecografía abdominal', 20000, 40000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- RADIOGRAFÍA
  ('examen', 'Radiografía', 20000, 45000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('examen', 'Radiografía', 20000, 40000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('examen', 'Radiografía', 15000, 35000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('examen', 'Radiografía', 12000, 30000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('examen', 'Radiografía', 12000, 30000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- URGENCIA
  ('urgencia', 'Atención de urgencia', 30000, 80000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('urgencia', 'Atención de urgencia', 30000, 75000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('urgencia', 'Atención de urgencia', 25000, 60000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('urgencia', 'Atención de urgencia', 20000, 50000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('urgencia', 'Atención de urgencia', 20000, 50000, 'La Florida', 'CLP', 'referencia_publica', true),
  -- PELUQUERÍA CANINA
  ('grooming', 'Baño y corte perro mediano', 15000, 30000, 'Providencia', 'CLP', 'referencia_publica', true),
  ('grooming', 'Baño y corte perro mediano', 15000, 28000, 'Las Condes', 'CLP', 'referencia_publica', true),
  ('grooming', 'Baño y corte perro mediano', 12000, 25000, 'Ñuñoa', 'CLP', 'referencia_publica', true),
  ('grooming', 'Baño y corte perro mediano', 10000, 20000, 'Maipú', 'CLP', 'referencia_publica', true),
  ('grooming', 'Baño y corte perro mediano', 10000, 20000, 'La Florida', 'CLP', 'referencia_publica', true)
ON CONFLICT DO NOTHING;
