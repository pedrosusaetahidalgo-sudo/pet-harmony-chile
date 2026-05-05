/**
 * Copy centralizado del landing nuevo (Immersive Masterplan v3).
 *
 * Toda string visible del landing vive acá para facilitar:
 * - Edición rápida sin tocar JSX.
 * - QA de tono chileno.
 * - Futuro i18n a Latam (es-AR, es-MX).
 *
 * Reglas de tono (CLAUDE.md §9.5):
 * - Tuteo chileno (tú, tienes, puedes).
 * - "Peludo" en lugar de "mascota" donde se pueda (sin abusar).
 * - Cero claims sin respaldo (CLAUDE.md §6.8 del masterplan).
 * - Modelo freemium 3 tiers (Plan v5 Opcion 3, addendum 2026-04-29):
 *   Free $0 · Paw Member $3.990/mes · Manada $9.990/mes.
 *   Lo esencial es gratis para siempre; lo avanzado es opcional.
 */

export const HERO = {
  badge: 'Hecho en Chile · Lo esencial gratis para siempre',
  h1Lead: 'La ficha médica gratuita de tu mascota,',
  h1Highlight: 'siempre a mano.',
  h1Tail: 'Tu mascota tiene una historia. Paw Friend la cuida contigo.',
  sub: 'Para que nunca más dependas de una libreta, un WhatsApp perdido o la memoria del veterinario. Historial médico, vacunas, alertas, veterinarios, adopción y comunidad en una sola herramienta chilena.',
  ctaPrimary: 'Crear cuenta gratis',
  ctaPrimaryAuth: 'Ir al inicio',
  ctaSecondary: 'Ver demo (1 min)',
  microcopy: 'Sin tarjeta · Sin letra chica',
  trustRating: '4.9',
  // Trust copy se renderiza solo cuando haya numero real (ver SocialProofBand)
} as const;

export const PROBLEM = {
  badge: 'Por qué importa',
  h2Line1: 'Cuando tu peludo se enferma a las 3 AM,',
  h2Line2: '¿dónde está su historia médica?',
  body: 'El 80% de las mascotas en Chile no tiene su salud al día. Y cuando uno la necesita —en una urgencia, en un viaje, al cambiar de vet— está en un cuaderno perdido o en la cabeza de un vet que ya no atiende.',
  closer: 'Hicimos Paw Friend para que esa historia te acompañe siempre, en tu bolsillo.',
  source: 'Datos: Vetivery, SUBDERE/UC · 2024',
  cta: 'Crear ficha gratis ahora',
} as const;

export const ECOSYSTEM = {
  badge: 'Ecosistema completo',
  h2Lead: 'Una app,',
  h2Highlight: '4 mundos para tu peludo',
  sub: 'No es solo una ficha. Es todo lo que tu peludo y tú necesitan para vivir tranquilos.',
  cta: 'Explorar ecosistema',
} as const;

export const MEDICAL = {
  badge: 'Ficha clínica PDF',
  h2Lead: 'Una ficha que',
  h2Highlight: 'cualquier vet puede leer',
  body: 'Vacunas, alergias, condiciones crónicas, peso, microchip. Todo en un PDF limpio que viaja contigo y compartes por WhatsApp en 3 toques. Cuando cambias de vet o viajas, llega antes que tú.',
  bullets: [
    'Calendario de vacunas siempre al día',
    'Alergias y condiciones crónicas destacadas',
    'Compartir 30 días con un link único',
    'OCR del carnet de vacunación con IA',
  ],
  cta: 'Crear ficha de mi peludo',
} as const;

export const VETS_DIRECTORY = {
  badge: 'Directorio público',
  h2Lead: 'Tu vet ideal,',
  h2Highlight: 'a 1,2 km',
  body: 'Filtra por comuna y especialidad. Lee reseñas verificadas (solo dueños que reservaron pueden dejarlas). Reserva sin intermediarios.',
  bullets: [
    'Filtro por comuna y especialidad',
    'Reseñas verificadas con reserva real',
    'Verificación Colmevet integrada',
    'Sin intermediarios, sin comisiones ocultas',
  ],
  cta: 'Explorar directorio',
} as const;

export const ALMA = {
  badge: 'Paw Core · Nuestra historia',
  h2Lead: 'Hecho por una persona,',
  h2Highlight: 'con amor, en Chile',
  body: 'Paw Friend lo construye una persona en Chile, apoyada por IA, con la convicción de que la salud de un peludo no debería ser un privilegio. Sin VC presionando, sin exit forzado, sin gates ocultos.',
  sustainTitle: 'Cómo nos sostenemos',
  sustainBody:
    'El grueso del revenue lo pagan pharma, seguros y retail por acceso a la ficha clínica. Para los dueños es freemium: lo esencial es gratis para siempre y solo pagan si quieren features avanzadas (Paw Member $3.990/mes o Manada $9.990/mes con aporte a refugios). Sumamos Paw Companys (sponsors empresas) y Paw Support (apoyo voluntario).',
  quote:
    'Lo hago porque mis peludos me cambiaron la vida. Quiero que la salud de un peludo nunca sea un privilegio, en Chile y en toda Latinoamérica.',
  quoteAuthor: 'Paw Founder',
  cta: 'Conoce nuestra historia',
} as const;

export const FOR_VETS = {
  badge: 'Para veterinarios',
  h2Lead: '¿Tienes una',
  h2Highlight: 'clínica veterinaria?',
  body: 'Aparece en el directorio más usado por dueños en Chile. Recibe pacientes nuevos, gestiona ficha digital compartida, organiza tu agenda. Plan Básica gratis (5 pacientes). Premium desde $9.900/mes.',
  bullets: [
    'Más pacientes desde tu comuna',
    'Ficha clínica compartida con dueños',
    'Agenda + sync Google Calendar',
    'Reportes semanales automáticos',
    'Verificación Colmevet integrada',
    '"Ver como me ven los dueños" en 1 click',
  ],
  ctaPrimary: 'Ver planes',
  ctaSecondary: 'Registrar mi clínica gratis',
} as const;

export const COMMUNITY = {
  badge: 'Comunidad pet lover',
  h2Lead: 'Si amas a los animales,',
  h2Highlight: 'hay un rol para ti',
  sub: 'Paw Friend lo hacemos porque queremos. Para que lo esencial siga gratis, necesitamos comunidad.',
  closer: 'Sin exclusividad, sin letra chica. Solo amor por los peludos.',
} as const;

export const FINAL_CTA = {
  h2Lead: 'Tu peludo merece esto.',
  h2Highlight: 'Empieza gratis hoy.',
  body: 'Crea su ficha en 2 minutos. Encuentra tu vet ideal. Olvídate de la próxima vacuna olvidada.',
  cta: 'Crear cuenta gratis',
  microcopy: 'Sin tarjeta · Sin letra chica · Sin gates',
} as const;

/**
 * Copy del header sticky.
 */
export const HEADER = {
  brandLead: 'Paw',
  brandTail: 'Friend',
  navItems: [
    { label: 'Veterinarios publicos', href: '/veterinarios', cta: false },
    // Item con cta=true se renderiza como boton destacado en LandingHeader.
    { label: '¿Eres vet?', href: '/para-veterinarios', cta: true },
    { label: 'Apoyar', href: '/paw-support', cta: false },
    { label: 'Nuestra historia', href: '/paw-core', cta: false },
  ] as ReadonlyArray<{ label: string; href: string; cta: boolean }>,
  ctaAuth: 'Iniciar sesión',
  ctaCreate: 'Crear cuenta gratis',
  ctaHome: 'Ir al inicio',
} as const;

/**
 * Copy del footer rico (4 columnas).
 */
export const FOOTER = {
  tagline: 'Hecho en Chile, para Chile y Latam · Pagos seguros con Flow',
  contactEmail: 'pedrosusaeta@pawfriend.cl',
  columns: [
    {
      title: 'Producto',
      links: [
        { label: 'Ficha clínica PDF', href: '/auth' },
        { label: 'Directorio de vets', href: '/veterinarios' },
        { label: 'Estimador de precios', href: '/precios-veterinarios' },
        { label: 'Memorial', href: '/en-memoria' },
        { label: 'Donantes de sangre', href: '/donantes-sangre' },
      ],
    },
    {
      title: 'Comunidad',
      links: [
        { label: 'Paw Support', href: '/paw-support' },
        { label: 'Transparencia', href: '/transparencia' },
        { label: 'Paw Voices (creadores)', href: '/paw-voices' },
        { label: 'Paw Companys (empresas)', href: '/paw-companys' },
        { label: 'Paw Member', href: '/paw-member' },
        { label: 'Adopción', href: '/adoption' },
      ],
    },
    {
      title: 'Para vets',
      links: [
        { label: 'Ver planes', href: '/para-veterinarios' },
        { label: 'Registrar mi clínica', href: '/registro-veterinario' },
        { label: 'Registrar partner', href: '/registro-partner' },
      ],
    },
    {
      title: 'B2B',
      links: [
        { label: 'API B2B (data · stats agregadas)', href: '/b2b' },
        { label: 'Aseguradoras', href: '/aplicar?tipo=b2b_api' },
        { label: 'Gobierno · Municipios (Ley 21.020)', href: '/aplicar?tipo=gobierno_municipio' },
        { label: 'Bancos · Loyalty pet-friendly', href: '/aplicar?tipo=banca' },
        { label: 'Edificios · Inmobiliarias', href: '/aplicar?tipo=edificios' },
        { label: 'Long-tail (aerolineas · academia · hardware)', href: '/aplicar?tipo=longtail' },
      ],
    },
    {
      title: 'Sobre Paw Friend',
      links: [
        { label: 'Paw Core (visión)', href: '/paw-core' },
        { label: 'Para inversionistas', href: '/pitch/recorrido.html' },
        { label: 'Preguntas frecuentes', href: '/faq' },
        { label: 'Términos', href: '/terms' },
        { label: 'Privacidad', href: '/privacy' },
      ],
    },
  ],
} as const;
