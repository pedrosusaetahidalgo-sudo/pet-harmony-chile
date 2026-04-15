-- =============================================================================
-- SEED COMPLETO: Grupos de comunidad para Paw Friend Chile
-- =============================================================================
-- Amplia los 5 grupos originales con un catalogo representativo del mercado
-- chileno: razas populares, condiciones medicas comunes, grupos por region
-- y grupos de interes general.
--
-- Idempotente: ON CONFLICT (slug) DO NOTHING para los existentes,
-- DO UPDATE para actualizar descripciones si se re-ejecuta.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RAZAS DE PERROS POPULARES EN CHILE (breed / Razas)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO community_groups (name, slug, description, category, group_type) VALUES

  -- Ya existe: Labradores Chile (slug: labradores-chile)

  ('Golden Retrievers Chile', 'golden-retrievers-chile',
   'Para amantes de los Golden Retriever en Chile. Comparte fotos, tips de cuidado, alimentacion y experiencias con esta raza increible.',
   'Razas', 'breed'),

  ('Bulldogs Franceses Chile', 'bulldogs-franceses-chile',
   'Todo sobre Frenchies: salud respiratoria, alimentacion, socializacion y las mejores fotos de tus Bulldogs Franceses.',
   'Razas', 'breed'),

  ('Pastores Alemanes Chile', 'pastores-alemanes-chile',
   'Comunidad de Pastores Alemanes. Entrenamiento, salud articular, displasia, alimentacion y actividades al aire libre.',
   'Razas', 'breed'),

  ('Schnauzers Chile', 'schnauzers-chile',
   'Mini, estandar o gigante: todos los Schnauzers son bienvenidos. Grooming, alimentacion, salud y personalidad.',
   'Razas', 'breed'),

  ('Chihuahuas Chile', 'chihuahuas-chile',
   'La comunidad mas grande de Chihuahuas en Chile. Cuidados especiales, socializacion, ropa y accesorios.',
   'Razas', 'breed'),

  ('Poodles y Caniches Chile', 'poodles-caniches-chile',
   'Toy, miniatura o estandar. Tips de grooming, cortes, salud ocular y todo sobre Poodles en Chile.',
   'Razas', 'breed'),

  ('Border Collies Chile', 'border-collies-chile',
   'La raza mas inteligente del mundo. Entrenamiento avanzado, agility, estimulacion mental y paseos activos.',
   'Razas', 'breed'),

  ('Yorkshire Terriers Chile', 'yorkshire-terriers-chile',
   'Comunidad de Yorkies chilenos. Cuidados del pelaje, alimentacion, salud dental y socializacion.',
   'Razas', 'breed'),

  ('Dachshunds Chile', 'dachshunds-chile',
   'Salchichas unidos! Cuidados de la espalda, alimentacion para evitar sobrepeso, ejercicios seguros y las mejores fotos.',
   'Razas', 'breed'),

  ('Cocker Spaniels Chile', 'cocker-spaniels-chile',
   'Ingleses y americanos: todo sobre Cocker Spaniels. Cuidado de orejas, alimentacion y actividades.',
   'Razas', 'breed'),

  ('Huskies Siberianos Chile', 'huskies-siberianos-chile',
   'Criar un Husky en Chile tiene sus desafios. Tips de temperatura, pelaje, ejercicio intenso y socializacion.',
   'Razas', 'breed'),

  ('Pit Bulls y Bull Terriers Chile', 'pit-bulls-chile',
   'Comunidad de tenencia responsable de Pit Bulls y Bull Terriers. Socializacion, entrenamiento positivo y desmitificacion.',
   'Razas', 'breed'),

  ('Quiltros de Corazon', 'quiltros-de-corazon',
   'Mestizos, quiltros y perros unicos. La raza mas chilena de todas merece su propia comunidad. Historias, adopcion y orgullo quiltro.',
   'Razas', 'breed'),

  ('Beagles Chile', 'beagles-chile',
   'Nariz inquieta y energia infinita. Comunidad de Beagles: entrenamiento de olfato, ejercicio, alimentacion y aventuras.',
   'Razas', 'breed'),

  ('Shih Tzu Chile', 'shih-tzu-chile',
   'Companeros de sofa y corazon. Cuidado del pelaje, ojos, alimentacion y socializacion de Shih Tzus.',
   'Razas', 'breed'),

  ('Rottweilers Chile', 'rottweilers-chile',
   'Fuerza y lealtad. Comunidad de tenencia responsable de Rottweilers: entrenamiento, socializacion y salud.',
   'Razas', 'breed'),

  ('Bichon Frise y Malteses Chile', 'bichon-malteses-chile',
   'Pequenos, blancos y llenos de amor. Grooming, alergias, cuidado dental y convivencia.',
   'Razas', 'breed')

ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RAZAS DE GATOS POPULARES EN CHILE (breed / Razas Gatos)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO community_groups (name, slug, description, category, group_type) VALUES

  ('Gatos Siameses Chile', 'gatos-siameses-chile',
   'Elegantes y vocales. Comunidad de Siameses: temperamento, salud, alimentacion y las mejores fotos de tus gatitos.',
   'Razas Gatos', 'breed'),

  ('Gatos Persas Chile', 'gatos-persas-chile',
   'Cuidado del pelaje largo, salud ocular, alimentacion especial y todo sobre Persas en Chile.',
   'Razas Gatos', 'breed'),

  ('Maine Coon Chile', 'maine-coon-chile',
   'Los gigantes gentiles del mundo felino. Salud, alimentacion, enriquecimiento ambiental y fotos de tus Maine Coons.',
   'Razas Gatos', 'breed'),

  ('British Shorthair Chile', 'british-shorthair-chile',
   'Redondos, tranquilos y adorables. Comunidad de British Shorthair: salud cardiaca, alimentacion y convivencia.',
   'Razas Gatos', 'breed'),

  ('Gatos Mestizos Chile', 'gatos-mestizos-chile',
   'Los gatos callejeros adoptados son los mas agradecidos. Historias de rescate, cuidados y orgullo gatuno mestizo.',
   'Razas Gatos', 'breed'),

  ('Bengal y Savannah Chile', 'bengal-savannah-chile',
   'Gatos exoticos con alma salvaje. Enriquecimiento ambiental, alimentacion, ejercicio y convivencia responsable.',
   'Razas Gatos', 'breed'),

  ('Ragdoll Chile', 'ragdoll-chile',
   'Relajados y carinosos. Comunidad de Ragdolls: cuidado del pelaje, salud, alimentacion y vida indoor.',
   'Razas Gatos', 'breed')

ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CONDICIONES MEDICAS (condition / Salud)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO community_groups (name, slug, description, category, group_type) VALUES

  -- Ya existen: displasia-cadera, diabetes-felina, perros-senior

  ('Epilepsia canina', 'epilepsia-canina',
   'Apoyo para duenos de perros con epilepsia. Medicacion, control de crisis, dieta y experiencias compartidas.',
   'Salud', 'condition'),

  ('Insuficiencia renal en gatos', 'insuficiencia-renal-gatos',
   'IRC felina: control de creatinina, dieta renal, hidratacion subcutanea y cuidados paliativos. Apoyo entre duenos.',
   'Salud', 'condition'),

  ('Alergias alimentarias', 'alergias-alimentarias-mascotas',
   'Dietas de eliminacion, alimentos hipoalergenicos, BARF y todo sobre alergias e intolerancias en perros y gatos.',
   'Salud', 'condition'),

  ('Obesidad en mascotas', 'obesidad-mascotas',
   'Ayuda mutua para el control de peso. Planes de alimentacion, ejercicio gradual, snacks saludables y motivacion.',
   'Salud', 'condition'),

  ('Artritis y movilidad', 'artritis-movilidad',
   'Mascotas con problemas articulares o de movilidad. Suplementos, fisioterapia, rampas, camas ortopedicas y mas.',
   'Salud', 'condition'),

  ('Problemas cardiacos', 'problemas-cardiacos-mascotas',
   'Soplos, cardiomiopatia y otras condiciones. Medicacion, ecocardiogramas, ejercicio controlado y calidad de vida.',
   'Salud', 'condition'),

  ('Cancer en mascotas', 'cancer-mascotas',
   'Acompanamiento para duenos de mascotas con diagnostico de cancer. Tratamientos, quimioterapia, cuidados paliativos y apoyo emocional.',
   'Salud', 'condition'),

  ('Ansiedad por separacion', 'ansiedad-separacion',
   'Tu mascota sufre cuando te vas? Tecnicas de desensibilizacion, enriquecimiento ambiental, productos calmantes y apoyo profesional.',
   'Salud', 'condition'),

  ('Dermatitis y piel', 'dermatitis-piel-mascotas',
   'Dermatitis atopica, hot spots, alergias ambientales. Tratamientos, banos medicados y cuidado preventivo de la piel.',
   'Salud', 'condition'),

  ('Problemas dentales', 'problemas-dentales-mascotas',
   'Gingivitis, sarro, extracciones. Limpieza dental, snacks dentales, cepillado y todo sobre salud oral de tu mascota.',
   'Salud', 'condition'),

  ('Diabetes canina', 'diabetes-canina',
   'Control de glucosa, insulina, alimentacion especial y monitoreo diario para perros diabeticos.',
   'Salud', 'condition'),

  ('Cataratas y vision', 'cataratas-vision-mascotas',
   'Mascotas con perdida de vision: adaptacion del hogar, cirugia de cataratas, cuidados post-operatorios y calidad de vida.',
   'Salud', 'condition'),

  ('Mascotas con discapacidad', 'mascotas-con-discapacidad',
   'Perros y gatos con sillas de ruedas, amputaciones o limitaciones fisicas. Adaptaciones, productos y experiencias inspiradoras.',
   'Salud', 'condition'),

  ('Enfermedades respiratorias', 'enfermedades-respiratorias',
   'Razas braquicefalas, asma felina, colapso traqueal. Cuidados especiales, climatizacion y cuando ir al vet de urgencia.',
   'Salud', 'condition'),

  ('Cachorros y gatitos recien nacidos', 'cachorros-gatitos-recien-nacidos',
   'Cuidado neonatal, alimentacion con mamadera, vacunas iniciales, socializacion temprana y primeros pasos.',
   'Salud', 'condition')

ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. GRUPOS POR REGION/ZONA (location / Regiones)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO community_groups (name, slug, description, category, group_type) VALUES

  ('Mascotas Santiago Centro', 'mascotas-santiago-centro',
   'Duenos de mascotas en Santiago Centro, Quinta Normal, Estacion Central. Plazas pet-friendly, vets cercanos y paseos grupales.',
   'Regiones', 'location'),

  ('Mascotas Providencia y Nunoa', 'mascotas-providencia-nunoa',
   'Comunidad pet en Providencia, Nunoa, Macul. Los mejores parques, cafes pet-friendly, vets recomendados y paseos.',
   'Regiones', 'location'),

  ('Mascotas Las Condes y Vitacura', 'mascotas-las-condes-vitacura',
   'Vida pet en el sector oriente: parques, grooming, vets premium y actividades para mascotas en Las Condes, Vitacura y Lo Barnechea.',
   'Regiones', 'location'),

  ('Mascotas Maipu y Cerrillos', 'mascotas-maipu-cerrillos',
   'Comunidad de mascotas en Maipu, Cerrillos y alrededores. Vets economicos, plazas y actividades para tu mascota.',
   'Regiones', 'location'),

  ('Mascotas La Florida y Puente Alto', 'mascotas-la-florida-puente-alto',
   'Zona sur de Santiago: La Florida, Puente Alto, La Pintana. Vets de guardia, paseos y comunidad pet.',
   'Regiones', 'location'),

  ('Mascotas Valparaiso y Vina del Mar', 'mascotas-valparaiso-vina',
   'Costa central: playas pet-friendly, vets en Valpo y Vina, paseos por los cerros y actividades costeras con tu mascota.',
   'Regiones', 'location'),

  ('Mascotas Concepcion y Bio Bio', 'mascotas-concepcion-biobio',
   'Comunidad pet de la Region del Bio Bio. Vets en Conce, Talcahuano, Chillan. Parques y actividades locales.',
   'Regiones', 'location'),

  ('Mascotas Temuco y La Araucania', 'mascotas-temuco-araucania',
   'Mascotas en el sur: Temuco, Villarrica, Pucon. Vets rurales, cuidados de invierno y naturaleza con tu mascota.',
   'Regiones', 'location'),

  ('Mascotas La Serena y Coquimbo', 'mascotas-la-serena-coquimbo',
   'Comunidad pet del norte chico. Playas, calor, hidratacion, vets locales y actividades en La Serena y Coquimbo.',
   'Regiones', 'location'),

  ('Mascotas Antofagasta y Norte Grande', 'mascotas-antofagasta-norte',
   'Vida pet en el desierto: cuidados contra el calor extremo, hidratacion, vets en Antofagasta, Iquique y Arica.',
   'Regiones', 'location'),

  ('Mascotas Puerto Montt y Los Lagos', 'mascotas-puerto-montt-los-lagos',
   'Sur profundo: lluvia, barro y aventura. Cuidados de invierno, vets en Puerto Montt, Osorno y alrededores.',
   'Regiones', 'location'),

  ('Mascotas Rancagua y O''Higgins', 'mascotas-rancagua-ohiggins',
   'Comunidad pet de la sexta region. Vets en Rancagua, San Fernando, Santa Cruz. Campo y mascotas.',
   'Regiones', 'location')

ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. INTERES GENERAL (general / Estilo de vida)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO community_groups (name, slug, description, category, group_type) VALUES

  -- Ya existen: gatos-rescatados

  ('Alimentacion BARF y Natural', 'alimentacion-barf-natural',
   'Dieta cruda, BARF, comida casera y alimentacion natural para mascotas. Recetas, proveedores en Chile y transicion desde pellet.',
   'Estilo de vida', 'general'),

  ('Agility y Deportes Caninos', 'agility-deportes-caninos',
   'Agility, canicross, frisbee, obediencia deportiva. Competencias en Chile, entrenamiento y equipamiento.',
   'Estilo de vida', 'general'),

  ('Paseos Grupales Chile', 'paseos-grupales-chile',
   'Organiza y unete a paseos grupales con tu perro. Rutas recomendadas, horarios, puntos de encuentro por comuna.',
   'Estilo de vida', 'general'),

  ('Primeros Auxilios para Mascotas', 'primeros-auxilios-mascotas',
   'Que hacer en una emergencia? Botiquin basico, RCP canino/felino, envenenamientos, golpes de calor y cuando correr al vet.',
   'Estilo de vida', 'general'),

  ('Viajando con Mascotas', 'viajando-con-mascotas',
   'Tips para viajar con tu mascota en Chile y al extranjero. Aerolineas pet-friendly, documentos SAG, alojamientos y rutas.',
   'Estilo de vida', 'general'),

  ('Mascotas y Bebes', 'mascotas-y-bebes',
   'Preparar a tu mascota para la llegada de un bebe. Socializacion, seguridad, convivencia y crianza responsable.',
   'Estilo de vida', 'general'),

  ('Entrenamiento Positivo', 'entrenamiento-positivo',
   'Refuerzo positivo, clicker training, socializacion. Tecnicas modernas de entrenamiento sin castigo para perros y gatos.',
   'Estilo de vida', 'general'),

  ('Fotografia de Mascotas', 'fotografia-mascotas',
   'Tips para sacar las mejores fotos de tu mascota. Iluminacion, poses, edicion y concursos fotograficos de la comunidad.',
   'Estilo de vida', 'general'),

  ('Adopcion Responsable', 'adopcion-responsable-chile',
   'Adoptar es amar. Red de adopcion, fundaciones, requisitos, experiencias de adopcion y ayuda para quienes buscan su proximo companero.',
   'Estilo de vida', 'general'),

  ('Rescate Animal Chile', 'rescate-animal-chile',
   'Coordinacion de rescates, colonias felinas, voluntariado, donaciones y todo sobre rescate animal en Chile.',
   'Estilo de vida', 'general'),

  ('Gatos Indoor', 'gatos-indoor-chile',
   'Vida 100%% indoor para gatos: enriquecimiento ambiental, rascadores, catios, juguetes interactivos y bienestar felino.',
   'Estilo de vida', 'general'),

  ('Mascotas en Departamento', 'mascotas-en-departamento',
   'Vivir con mascotas en depto: adaptaciones de espacio, ruido, vecinos, balcones seguros y tips de convivencia.',
   'Estilo de vida', 'general'),

  ('Duenos Primerizos', 'duenos-primerizos',
   'Primera mascota? Aqui resolvemos todas tus dudas. Vacunas, alimentacion, veterinario, accesorios basicos y errores comunes.',
   'Estilo de vida', 'general'),

  ('Mascotas Exoticas', 'mascotas-exoticas-chile',
   'Conejos, hamsters, hurones, aves y reptiles. Cuidados especializados, vets exoticos en Chile y normativa SAG.',
   'Estilo de vida', 'general'),

  ('Perdidos y Encontrados', 'perdidos-y-encontrados',
   'Tu mascota se perdio o encontraste una? Publica aqui con comuna, foto y contacto. Red de busqueda solidaria.',
   'Estilo de vida', 'general'),

  ('Cuidado en Verano', 'cuidado-verano-mascotas',
   'Golpes de calor, hidratacion, proteccion solar, playas, piscinas y todo para que tu mascota pase un verano seguro.',
   'Estilo de vida', 'general'),

  ('Cuidado en Invierno', 'cuidado-invierno-mascotas',
   'Frio, lluvia y barro. Ropa, calefaccion segura, paseos cortos, cuidado de almohadillas y salud respiratoria invernal.',
   'Estilo de vida', 'general')

ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ACTUALIZAR descripciones de los 5 grupos originales (mejora de copy)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE community_groups SET description = 'Comunidad de apoyo para duenos de mascotas con displasia de cadera. Tratamientos, ejercicios, suplementos, cirugias y experiencias compartidas.'
WHERE slug = 'displasia-cadera';

UPDATE community_groups SET description = 'Grupo de apoyo para duenos de gatos diabeticos. Control de glucosa, inyecciones de insulina, dieta especial y monitoreo diario.'
WHERE slug = 'diabetes-felina';

UPDATE community_groups SET description = 'Todo sobre Labradores Retriever en Chile. Salud articular, alimentacion, entrenamiento, fotos y la mejor comunidad de Labs.'
WHERE slug = 'labradores-chile';

UPDATE community_groups SET description = 'Comunidad de gatos rescatados y adoptados. Historias de exito, cuidados post-rescate, socializacion y apoyo para quienes adoptan.'
WHERE slug = 'gatos-rescatados';

UPDATE community_groups SET description = 'Cuidados especiales para perros mayores de 8 anos. Salud articular, alimentacion senior, chequeos frecuentes, suplementos y bienestar en la tercera edad.'
WHERE slug = 'perros-senior';

-- ─────────────────────────────────────────────────────────────────────────────
-- RESUMEN: Total de grupos despues de esta migracion
-- ─────────────────────────────────────────────────────────────────────────────
-- Razas perros:  17 (1 existente + 16 nuevos)
-- Razas gatos:    7 nuevos
-- Condiciones:   18 (3 existentes + 15 nuevos)
-- Regiones:      12 nuevos
-- Estilo de vida: 18 (1 existente + 17 nuevos)
-- TOTAL:         72 grupos
-- ─────────────────────────────────────────────────────────────────────────────
