-- Rewards mejorados: más variados, nombres divertidos, conexión orgánica con misiones
-- Limpia rewards genéricos y agrega catálogo atractivo

-- Limpiar rewards existentes para reemplazar con mejores
DELETE FROM paw_shop_rewards WHERE partner_name IN ('Paw Friend', 'Tiendas partner', 'Refugios aliados') OR partner_name IS NULL;

INSERT INTO paw_shop_rewards (name, description, category, points_cost, discount_percentage, service_type, partner_name, icon, stock, is_active)
VALUES
  -- === DESCUENTOS SERVICIOS (accesibles, incentivan usar la plataforma) ===
  ('Primera consulta -20%', '20% off en tu primera consulta con cualquier vet del directorio. Válido por 30 días.', 'discount', 200, 20, 'vet', 'Paw Friend', 'stethoscope', NULL, true),
  ('Baño + corte -15%', 'Descuento en peluquerías verificadas. Porque tu mascota merece un spa day.', 'discount', 350, 15, 'groomer', 'Paw Friend', 'scissors', NULL, true),
  ('Paseo gratis', 'Un paseo cortesía con paseadores verificados. Ideal para probar el servicio.', 'discount', 500, 100, 'walker', 'Paw Friend', 'footprints', 30, true),
  ('Control dental -25%', 'Descuento en limpieza dental. La salud oral es clave para una vida larga.', 'discount', 600, 25, 'vet', 'Paw Friend', 'smile', NULL, true),
  ('Vacuna antirrábica gratis', 'Cubre el costo de la vacuna anual obligatoria en vets del directorio.', 'discount', 800, 100, 'vet', 'Paw Friend', 'syringe', 20, true),
  ('Sesión de fotos mascotera', 'Sesión de 30 min con fotógrafos pet-friendly asociados.', 'discount', 1500, NULL, NULL, 'Paw Friend', 'camera', 10, true),

  -- === DONACIONES (bajo costo, alto impacto emocional) ===
  ('1 kg de alimento a refugio', 'Alimentamos a un rescatado por una semana gracias a ti.', 'donation', 100, NULL, NULL, 'Refugios aliados', 'heart', NULL, true),
  ('Kit vacuna para rescatado', 'Cubres la primera vacuna de un animal esperando adopción.', 'donation', 300, NULL, NULL, 'Refugios aliados', 'syringe', NULL, true),
  ('Manta + plato para refugio', 'Equipamos a un rescatado con lo básico para su estadía.', 'donation', 500, NULL, NULL, 'Refugios aliados', 'home', NULL, true),
  ('Esterilización solidaria', 'Cubres una esterilización completa de un rescatado. Enorme impacto.', 'donation', 1200, NULL, NULL, 'Refugios aliados', 'shield', 10, true),

  -- === COSMÉTICOS (status social, coleccionables) ===
  ('Badge "Paw Lover"', 'Corazón dorado en tu perfil. Todo el mundo sabrá que amas a los animales.', 'visual', 400, NULL, NULL, NULL, 'heart', NULL, true),
  ('Badge "Vet VIP"', 'Estrella azul exclusiva. Solo para quienes cuidan la salud al 100%.', 'visual', 800, NULL, NULL, NULL, 'star', NULL, true),
  ('Badge "Paw Master"', 'Corona diamante. El badge más raro de Paw Friend. Respeto.', 'visual', 5000, NULL, NULL, NULL, 'crown', 50, true),
  ('Marco dorado para foto', 'Tu mascota con marco premium en el feed. Destaca entre todos.', 'visual', 600, NULL, NULL, NULL, 'image', NULL, true),
  ('Título personalizado', 'Elige un título custom bajo tu nombre: "Guardián", "Héroe Animal", etc.', 'visual', 1000, NULL, NULL, NULL, 'award', NULL, true),

  -- === PREMIUM (alto valor, incentiva upgrade) ===
  ('7 días Premium', 'Prueba todas las funciones Premium por una semana. Sin compromiso.', 'premium', 1000, NULL, NULL, 'Paw Friend', 'zap', NULL, true),
  ('1 mes Premium', 'Un mes completo de mascotas ilimitadas, PDF, compartir ficha y más.', 'premium', 3000, NULL, NULL, 'Paw Friend', 'crown', 20, true),
  ('Exportar 5 PDFs gratis', 'Genera hasta 5 fichas médicas PDF sin necesitar Premium.', 'premium', 800, NULL, NULL, 'Paw Friend', 'file-text', NULL, true)
ON CONFLICT DO NOTHING;
