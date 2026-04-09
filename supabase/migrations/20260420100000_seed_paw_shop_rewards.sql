-- Seed initial PawShop rewards catalog
-- These are starter rewards. Partners can add more via admin panel.

INSERT INTO paw_shop_rewards (name, description, category, points_cost, discount_percentage, service_type, partner_name, icon, stock, is_active)
VALUES
  -- Descuentos
  ('10% descuento consulta vet', 'Válido en cualquier veterinaria del directorio Paw Friend', 'discount', 500, 10, 'vet', 'Paw Friend', 'stethoscope', NULL, true),
  ('15% descuento peluquería', 'Aplica en peluquerías asociadas a Paw Friend', 'discount', 800, 15, 'groomer', 'Paw Friend', 'scissors', NULL, true),
  ('20% descuento primer paseo', 'Para paseadores verificados del directorio', 'discount', 300, 20, 'walker', 'Paw Friend', 'footprints', NULL, true),
  ('$5.000 de descuento en productos', 'Canjeable en tiendas partner de alimento y accesorios', 'discount', 1200, NULL, NULL, 'Tiendas partner', 'shopping-bag', 50, true),

  -- Donaciones
  ('Donar 1 kg de alimento a refugio', 'Tu donación va directamente a refugios aliados en Santiago', 'donation', 200, NULL, NULL, 'Refugios aliados', 'heart', NULL, true),
  ('Donar manta a refugio', 'Entregamos una manta nueva a un refugio de tu comuna', 'donation', 400, NULL, NULL, 'Refugios aliados', 'home', NULL, true),
  ('Apadrinar vacuna de rescatado', 'Cubres la vacuna de un animal en proceso de adopción', 'donation', 600, NULL, NULL, 'Refugios aliados', 'syringe', NULL, true),

  -- Cosméticos (badges especiales en el perfil)
  ('Badge "Corazón de Oro"', 'Badge exclusivo que aparece en tu perfil público', 'visual', 1000, NULL, NULL, NULL, 'award', NULL, true),
  ('Badge "Paw Master"', 'El badge más exclusivo de Paw Friend para tu perfil', 'visual', 5000, NULL, NULL, NULL, 'crown', NULL, true),
  ('Marco especial para foto de mascota', 'Un marco dorado para destacar la foto de tu peludo', 'visual', 750, NULL, NULL, NULL, 'image', 100, true),

  -- Premium
  ('1 mes Premium gratis', 'Disfruta todas las funciones Premium por 30 días', 'premium', 3000, NULL, NULL, 'Paw Friend', 'zap', 20, true),
  ('Ficha médica PDF premium', 'Genera fichas médicas PDF ilimitadas por 30 días', 'premium', 1500, NULL, NULL, 'Paw Friend', 'file-text', NULL, true)
ON CONFLICT DO NOTHING;
