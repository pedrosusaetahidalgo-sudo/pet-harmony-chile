-- =============================================================================
-- SEED: Partners Directory — Datos publicos verificados 2026-04-12 (v2)
-- =============================================================================
-- Ejecutar DESPUES de la migracion 20260430000000_partners_directory_fields.sql
-- Todos los datos extraidos de sitios web publicos via fetch directo.
-- Coordenadas: centroide conocido de cada comuna de Santiago.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SEGUROS DE MASCOTAS (category: insurance)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (brand_name, ad_text, ad_link, category, placement, is_active, priority, contact_phone, contact_email, website, address, commune, city, latitude, longitude, social_media)
VALUES
  ('Cacttus', 'Seguro de mascotas desde $11.600/mes. 3 planes: Mini 60%, Care 70%, Care+ 90%. App iOS/Android.', 'https://www.cacttus.cl', 'insurance', 'services', true, 10,
   NULL, 'soporte@cacttus.cl', 'https://www.cacttus.cl',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@cacttus.cl", "facebook": "CacttusCL", "tiktok": "@cacttus.cl"}'::jsonb),

  ('WOOF! Seguros', 'Seguro de mascotas desde $18.950/mes. Reembolso 90%. Asistencia 24/7.', 'https://www.woof.cl', 'insurance', 'services', true, 9,
   '+56 2 2712 0483', 'contacto@woofinsurtech.com', 'https://www.woof.cl',
   'Cerro El Plomo 5555, Oficina 402', 'Las Condes', 'Santiago', -33.4103, -70.5770,
   '{"instagram": "@woofseguros", "facebook": "woofseguros"}'::jsonb),

  ('Pawer', 'Seguro de mascotas desde $14.900/mes. Ficha medica digital + telemedicina. Opera en CL/PE/ES/MX.', 'https://www.somospawer.com', 'insurance', 'services', true, 8,
   '+56 9 9879 2181', NULL, 'https://www.somospawer.com',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@somospawer"}'::jsonb),

  ('BCI Seguros — Pata Segura', 'Seguro de mascotas desde $3.890/mes via BCI.', 'https://www.bciseguros.cl', 'insurance', 'services', true, 7,
   NULL, NULL, 'https://www.bciseguros.cl',
   NULL, NULL, 'Santiago', -33.4489, -70.6693, '{}'::jsonb),

  ('MACH Mascotas', 'Seguro de mascotas mas economico: desde $3.317/mes.', 'https://www.mach.cl', 'insurance', 'services', true, 6,
   NULL, NULL, 'https://www.mach.cl',
   NULL, NULL, 'Santiago', -33.4489, -70.6693, '{}'::jsonb),

  ('Amerins', 'Seguro de mascotas desde $28.212/mes.', 'https://www.amerins.cl', 'insurance', 'services', true, 5,
   NULL, NULL, 'https://www.amerins.cl',
   NULL, NULL, 'Santiago', -33.4489, -70.6693, '{}'::jsonb),

  ('Zenit Seguros', 'Seguro RC Mascota: perros, gatos y animales exoticos. 100% online, sin examenes previos.', 'https://www.zenitseguros.cl/', 'insurance', 'services', true, 5,
   '+56 9 4288 8826', NULL, 'https://www.zenitseguros.cl/',
   'Av. Manquehue Norte 290, Of. 01 (Sub 1)', 'Las Condes', 'Santiago', -33.3980, -70.5770,
   '{"facebook": "@ZenitSeguros", "twitter": "@ZenitSeguros"}'::jsonb)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TIENDAS DE MASCOTAS — SuperZoo 29 sucursales (category: store)
--    Coordenadas: centroide de cada comuna
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (brand_name, ad_text, ad_link, category, placement, is_active, priority, contact_phone, contact_email, website, address, commune, city, latitude, longitude, social_media)
VALUES
  ('SuperZoo Ahumada', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 7109 5758', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Ahumada 327', 'Santiago', 'Santiago', -33.4400, -70.6536, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Nunoa', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9542 0629', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Salvador 1822, Local 6', 'Nunoa', 'Santiago', -33.4530, -70.5980, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Portal El Llano', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9542 0392', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. El Llano Subercaseaux 3519 A, local 2002', 'San Miguel', 'Santiago', -33.4980, -70.6510, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Alferez Real', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9991 3361', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Manuel Montt 1141', 'Providencia', 'Santiago', -33.4350, -70.6130, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Providencia', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3863 9973', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Providencia 1275', 'Providencia', 'Santiago', -33.4310, -70.6190, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo San Miguel', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9542 0186', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Salvador Allende 1334, Local 2', 'San Miguel', 'Santiago', -33.4975, -70.6515, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Portal Nunoa', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9448 9701', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Jose Pedro Alessandri 1166, local 2008', 'Nunoa', 'Santiago', -33.4560, -70.5990, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Costanera Center', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9426 6986', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Andres Bello 2447, local 280', 'Providencia', 'Santiago', -33.4175, -70.6070, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Colon', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9391 4767', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Cristobal Colon 4455, Local A', 'Las Condes', 'Santiago', -33.4150, -70.5880, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Plaza Egana', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3446 4401', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Larrain 5862', 'La Reina', 'Santiago', -33.4480, -70.5510, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Florida Center', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9423 0828', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Vicuna Mackenna 6100, local 119', 'La Florida', 'Santiago', -33.5170, -70.5980, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Lo Castillo', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9093 6605', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Vitacura 3790', 'Vitacura', 'Santiago', -33.3940, -70.5890, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo La Reina', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9543 9595', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Monsenor Edwards 872', 'La Reina', 'Santiago', -33.4450, -70.5480, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Parque Arauco', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9141 8757', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Kennedy 5413, local 69, nivel -2', 'Las Condes', 'Santiago', -33.4010, -70.5770, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Plaza Vespucio', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 6541 2569', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Vicuna Mackenna 7110, Local A-110', 'La Florida', 'Santiago', -33.5260, -70.5970, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo San Pio', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9620 9728', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Pio XI 1715, locales 3 y 4', 'Vitacura', 'Santiago', -33.3960, -70.5920, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Mall Plaza Oeste', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3371 3855', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Americo Vespucio 1501', 'Cerrillos', 'Santiago', -33.4940, -70.7110, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Arauco Maipu', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 6680 4134', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Americo Vespucio 399, local 06', 'Maipu', 'Santiago', -33.5100, -70.7570, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Penalolen', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9542 0282', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Los Presidentes 7728', 'Penalolen', 'Santiago', -33.4900, -70.5530, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Rotonda Atenas', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3218 3610', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Pdte. Sebastian Pinera E. 996', 'Las Condes', 'Santiago', -33.4080, -70.5690, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Ossandon', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3862 2459', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Carlos Ossandon 1300, Local 2', 'La Reina', 'Santiago', -33.4470, -70.5500, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Cobres de Vitacura', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 4469 9095', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Vitacura 6640', 'Vitacura', 'Santiago', -33.3930, -70.5760, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Pedro Fontova', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9093 6560', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Pedro Fontova 7571, locales 2 y 3', 'Huechuraba', 'Santiago', -33.3650, -70.6340, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Pajaritos', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 4465 7263', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Los Pajaritos 2310', 'Maipu', 'Santiago', -33.5090, -70.7560, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Arauco Quilicura', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3234 5514', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Bernardo OHiggins 581', 'Quilicura', 'Santiago', -33.3560, -70.7330, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Chesterton', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9991 3367', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Padre Hurtado Central 415', 'Las Condes', 'Santiago', -33.4130, -70.5750, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Alto Las Condes', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 9449 5607', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Kennedy 9001, local 2102', 'Las Condes', 'Santiago', -33.3990, -70.5670, '{"instagram": "@superzoo.cl"}'::jsonb),
  ('SuperZoo Los Quillayes', 'Tienda de mascotas', 'https://www.superzoo.cl/tiendas', 'store', 'map', true, 5,
   '+56 9 3922 2304', 'ventas@superzoo.cl', 'https://www.superzoo.cl',
   'Av. Vicuna Mackenna 10811', 'La Florida', 'Santiago', -33.5340, -70.5960, '{"instagram": "@superzoo.cl"}'::jsonb),
  -- Petco
  ('Petco Chile', 'Tienda de mascotas premium', 'https://www.petco.cl', 'store', 'services', true, 7,
   '+56 2 3321 6799', NULL, 'https://www.petco.cl',
   NULL, 'Las Condes', 'Santiago', -33.4080, -70.5770, '{}'::jsonb),
  -- Petlandia (V Region — 4 sucursales)
  ('Petlandia Vina del Mar', 'Tienda de mascotas', 'https://petlandiachile.cl/', 'store', 'map', true, 4,
   '+56 9 2245 6669', 'ecommercemarben@gmail.com', 'https://petlandiachile.cl/',
   'Av. Libertad 1002', 'Vina del Mar', 'Valparaiso', -33.0153, -71.5500,
   '{"instagram": "@petlandia_chile", "tiktok": "@petlandia_chile"}'::jsonb),
  ('Petlandia Villa Alemana', 'Tienda de mascotas', 'https://petlandiachile.cl/', 'store', 'map', true, 4,
   '+56 9 2245 6669', 'ecommercemarben@gmail.com', 'https://petlandiachile.cl/',
   'Almirante La Torre 84', 'Villa Alemana', 'Valparaiso', -33.0420, -71.3730, '{"instagram": "@petlandia_chile"}'::jsonb),
  ('Petlandia Quillota', 'Tienda de mascotas', 'https://petlandiachile.cl/', 'store', 'map', true, 4,
   '+56 9 2245 6669', 'ecommercemarben@gmail.com', 'https://petlandiachile.cl/',
   'Av. Carlos Condell 1687', 'Quillota', 'Valparaiso', -32.8800, -71.2480, '{"instagram": "@petlandia_chile"}'::jsonb),
  ('Petlandia La Calera', 'Tienda de mascotas', 'https://petlandiachile.cl/', 'store', 'map', true, 4,
   '+56 9 2245 6669', 'ecommercemarben@gmail.com', 'https://petlandiachile.cl/',
   'J. J. Perez 12010, Mall Open Plaza', 'La Calera', 'Valparaiso', -32.7870, -71.2060, '{"instagram": "@petlandia_chile"}'::jsonb),
  -- Distribuidora Lira
  ('Distribuidora Lira', 'Tienda mayorista premium de alimento para mascotas. Lun-Dom 9-17h.', 'https://www.distribuidoralira.cl/', 'store', 'services', true, 4,
   '+56 2 3275 7600', 'ayuda@distribuidoralira.cl', 'https://www.distribuidoralira.cl/',
   'Av. Trinidad Oriente 893', 'La Florida', 'Santiago', -33.5230, -70.5880,
   '{"instagram": "@distribuidoralira", "facebook": "@distribuidoralira", "tiktok": "@distribuidoralira"}'::jsonb)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREMATORIOS Y CEMENTERIOS (category: general)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (brand_name, ad_text, ad_link, category, placement, is_active, priority, contact_phone, contact_email, website, address, commune, city, latitude, longitude, social_media)
VALUES
  ('Crematorio Las Nubes', 'Cremacion de mascotas desde $59.500. Retiro a domicilio Santiago. Cremacion presencial, individual o compartida.', 'https://crematoriolasnubes.cl/', 'general', 'services', true, 5,
   '+56 9 3923 4982', 'contacto@crematoriolasnubes.cl', 'https://crematoriolasnubes.cl/',
   'Santa Ines 3683', 'Isla de Maipo', 'Santiago', -33.7490, -70.8910,
   '{"instagram": "@crematoriolasnubes", "facebook": "/crematoriolasnubes"}'::jsonb),

  ('Eternapet', 'Cremacion de mascotas. La Pintana + V Region.', 'https://eternapet.cl/', 'general', 'services', true, 4,
   '+56 9 6161 0035', 'contacto@eternapet.cl', 'https://eternapet.cl/',
   NULL, 'La Pintana', 'Santiago', -33.5830, -70.6340, '{}'::jsonb),

  ('INERS Crematorio', 'Cremacion ecologica de mascotas. 3 hornos ecologicos. Retiro a domicilio sin costo. SEREMI autorizado.', 'https://iners.cl/', 'general', 'services', true, 4,
   '+56 9 8435 4474', 'iners@terra.cl', 'https://iners.cl/',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@crematorio_iners", "facebook": "/crematorioiners"}'::jsonb),

  ('Memory Pet', 'Crematorio de mascotas en Lampa.', 'https://www.memorypet.cl/', 'general', 'services', true, 3,
   '+56 9 9445 4696', 'info@memorypet.cl', 'https://www.memorypet.cl/',
   'Camino El Noviciado Norte, Parcela Los Aromos, Lote E-2', 'Lampa', 'Santiago', -33.2830, -70.8760, '{}'::jsonb),

  ('Almascotas', 'Cremacion de mascotas. Servicio de emergencias 24/7. Urg: +56 9 9517 7776.', 'https://almascotas.cl/', 'general', 'services', true, 4,
   '+56 9 8240 9076', 'almascotascremacion@gmail.com', 'https://almascotas.cl/',
   'Av. Apoquindo 6410', 'Las Condes', 'Santiago', -33.4100, -70.5700,
   '{"instagram": "@almascotas", "facebook": "/cremaciondemascotasAlmascotas"}'::jsonb),

  ('Cementerio y Crematorio del Pilar', 'Cementerio y crematorio de mascotas. 24 horas, 7 dias. ISO 9001/14001.', 'https://www.cementeriodelpilar.cl/', 'general', 'services', true, 3,
   '+56 9 8690 6291', NULL, 'https://www.cementeriodelpilar.cl/',
   'Rungue, Km 55 Ruta 5 Norte', 'Til-Til', 'Santiago', -33.1060, -70.9210,
   '{"instagram": "@cementerioycrematoriodelpilar", "facebook": "@cementerioycrematoriodelpilar"}'::jsonb),

  ('Crematorio El Canelo', 'Crematorio de mascotas.', '#', 'general', 'services', true, 2,
   '+56 9 9228 0977', 'info@crematorioelcanelo.cl', NULL,
   NULL, NULL, 'Santiago', -33.4489, -70.6693, '{}'::jsonb)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRANSPORTE DE MASCOTAS (category: general)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (brand_name, ad_text, ad_link, category, placement, is_active, priority, contact_phone, contact_email, website, address, commune, city, latitude, longitude, social_media)
VALUES
  ('Pets Travel', 'Transporte de mascotas Arica — Patagonia. Kennel gratis, clima controlado, tracking en vivo.', 'https://petstravel.cl/', 'general', 'services', true, 4,
   '+56 9 4982 2410', 'petstravelspa@gmail.com', 'https://petstravel.cl/',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@petstravel.cl"}'::jsonb),

  ('Interfamily', 'Transporte internacional de mascotas. Documentacion sanitaria, retiro, tracking, hotel canino/felino.', 'https://www.interfamily.cl/', 'general', 'services', true, 4,
   '+56 9 6448 5947', 'live@interfamily.cl', 'https://www.interfamily.cl/',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@liveinterfamily", "facebook": "liveinterfamily"}'::jsonb),

  ('Woof Airlines', 'Transporte internacional de mascotas. Europa/Asia/America/Africa.', 'https://www.woofairlines.com/', 'general', 'services', true, 3,
   NULL, NULL, 'https://www.woofairlines.com/',
   NULL, NULL, NULL, NULL, NULL,
   '{"instagram": "@woofairlines", "facebook": "woofairlines"}'::jsonb)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENTRENADORES CANINOS (category: general)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (brand_name, ad_text, ad_link, category, placement, is_active, priority, contact_phone, contact_email, website, address, commune, city, latitude, longitude, social_media)
VALUES
  ('Educandogs', 'Educacion canina. Cursos online y presencial. Cobertura nacional. Acreditado IAABC.', 'https://www.educandogs.cl/', 'general', 'services', true, 3,
   NULL, 'contacto@educandogs.cl', 'https://www.educandogs.cl/',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@jib_educandogs"}'::jsonb),

  ('Adiestramiento.cl', 'Adiestramiento canino a domicilio y etologia aplicada. Santiago + Valparaiso/Vina. Lun-Sab 9-20h.', 'https://www.adiestramiento.cl/', 'general', 'services', true, 3,
   '+56 9 9821 3014', NULL, 'https://www.adiestramiento.cl/',
   NULL, NULL, 'Santiago', -33.4489, -70.6693,
   '{"instagram": "@adiestramiento.cl", "facebook": "Adiestramiento.cl"}'::jsonb),

  ('GAG K9', 'Centro de adiestramiento canino certificado K9 USA. Cursos profesionales SENCE. Deteccion, obediencia, apoyo emocional.', 'https://www.gagk9.cl/', 'general', 'services', true, 3,
   '+56 9 8384 8230', 'adiestramiento.canino@gagk9.cl', 'https://www.gagk9.cl/',
   'El Quillay Parcela LP 1, Sector Lo Aguila Sur', 'Curacavi', 'Santiago', -33.4050, -71.1340,
   '{"instagram": "@gagadiestramiento", "facebook": "gagreydelosperros"}'::jsonb),

  ('AdiestramientoCaninoChile', 'Adiestramiento canino con metodos positivos. Certificacion apoyo emocional.', 'https://adiestramientocaninochile.cl/', 'general', 'services', true, 2,
   '+56 9 5394 9722', NULL, 'https://adiestramientocaninochile.cl/',
   NULL, NULL, 'Santiago', -33.4489, -70.6693, '{}'::jsonb)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PORTAL PET / MARCA DE ALIMENTO (category: food)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (brand_name, ad_text, ad_link, category, placement, is_active, priority, contact_phone, contact_email, website, social_media)
VALUES
  ('Patas Arriba (Anasac Pets)', 'Portal pet + marcas Traper, Goofy, Fellini. Alimento y productos para perros y gatos.', 'https://patasarriba.cl/', 'food', 'services', true, 3,
   '+56 9 3910 6012', NULL, 'https://patasarriba.cl/',
   '{"instagram": "@patasarribachile", "facebook": "patasarribachile"}'::jsonb)
ON CONFLICT DO NOTHING;
