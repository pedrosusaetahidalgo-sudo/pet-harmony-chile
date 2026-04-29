/**
 * Punto único de generación de URLs para deep linking entre flujos médicos.
 *
 * Cuando una pantalla necesita navegar a otra sección, debe usar estos
 * helpers en lugar de armar strings manualmente. Garantiza que si una ruta
 * cambia, solo hay que actualizar este archivo.
 */

export const LINKS = {
  // === Vets / Directorio ===
  /** Directorio público de vets */
  vets: () => '/veterinarios',

  /** Directorio filtrado por comuna */
  vetsByComuna: (comuna: string) => `/veterinarios/comuna/${slugify(comuna)}`,

  /** Directorio filtrado por especialidad */
  vetsBySpecialty: (specialty: string) => `/veterinarios/especialidad/${slugify(specialty)}`,

  /** Perfil público de un vet */
  vetProfile: (slug: string) => `/veterinarios/${slug}`,

  /** Buscar vet con servicio pre-aplicado (query string) */
  vetsForService: (serviceType: string, urgent?: boolean) =>
    `/veterinarios?service=${serviceType}${urgent ? '&urgent=1' : ''}`,

  /** Buscar vet por especialidad y comuna */
  vetsBySpecialtyAndComuna: (specialty: string, comuna: string) =>
    `/veterinarios/especialidad/${slugify(specialty)}?comuna=${slugify(comuna)}`,

  // === Mascotas / Ficha clínica ===
  /** Lista de mis mascotas */
  myPets: () => '/my-pets',

  /** Agregar mascota */
  addPet: () => '/add-pet',

  /** Ficha clínica de una mascota (vista dueño) */
  petClinical: (petId: string) => `/ficha/${petId}`,

  /** Ficha clínica en vista veterinario (fuerza V2 incluso si el vet es dueño) */
  petClinicalVet: (petId: string) => `/ficha/${petId}?mode=vet`,

  /** Ficha clínica abierta directamente en la pestaña de compartir */
  petClinicalShare: (petId: string) => `/ficha/${petId}?action=share`,

  /** Ficha clínica abierta con CTA de reservar vet */
  petClinicalBook: (petId: string) => `/ficha/${petId}?action=book`,

  /** Ficha clínica global */
  medicalRecords: () => '/medical-records',

  // === Reservas ===
  /** Ruta fisica de mis reservas */
  bookings: () => '/mis-reservas',

  // === Calendario unificado: helpers por intencion ===
  // Apuntan al tab correspondiente en /calendario. Las rutas fisicas
  // /reminders, /rutinas, /mis-reservas siguen vivas como alias
  // (deep links desde emails/pushes antiguos).
  /** Vista de recordatorios dentro del calendario unificado. */
  remindersTab: () => '/calendario?tab=recordatorios',
  /** Vista de rutinas dentro del calendario unificado. */
  routinesTab: () => '/calendario?tab=rutinas',
  /** Vista de reservas dentro del calendario unificado. */
  bookingsTab: () => '/calendario?tab=reservas',
  /** Vista "hoy" del calendario unificado (default). */
  calendarToday: () => '/calendario?tab=hoy',
  /** Ruta fisica legacy de recordatorios (dejar para deep links antiguos). */
  reminders: () => '/reminders',

  // === Provider ===
  /** Dashboard del provider (vet logueado) */
  providerDashboard: () => '/provider/dashboard',

  /** Editor del perfil profesional */
  providerProfileEdit: () => '/provider/profile-edit',

  /** Lista de pacientes del vet */
  providerPatients: () => '/provider/pacientes',

  // === Auth con returnTo ===
  /** Login con redirect post-login */
  authReturn: (returnTo: string) => `/auth?returnTo=${encodeURIComponent(returnTo)}`,

  // === Otras ===
  home: () => '/home',
  feed: () => '/feed',
  chat: () => '/chat',
  adoption: () => '/adoption',
  maps: () => '/maps',
  paraVeterinarios: () => '/para-veterinarios',
  registroVeterinario: () => '/registro-veterinario',
  auth: () => '/auth',
  terms: () => '/terms',
  privacy: () => '/privacy',
  pawGame: () => '/paw-game',
  settings: () => '/settings',
  profile: () => '/profile',
  userProfile: (userId: string) => `/user/${userId}`,
  /** Servicio unificado: /services/walkers, /services/vets, /services/sitters, /services/trainers, /services/groomers */
  services: (type: 'walkers' | 'vets' | 'sitters' | 'trainers' | 'groomers') => `/services/${type}`,
  /** Panel Pro de Analytics */
  proDashboard: () => '/panel-pro',
  /** Hub de servicios (paseo, cuidado, entrenamiento, peluquería) */
  servicios: () => '/servicios',
  /** Directorio público de peluqueros (tab nativo del directorio de servicios) */
  peluqueria: () => '/services/groomers',
  /** Editor de perfil de peluquero */
  groomerProfileEdit: () => '/peluquero/perfil',
  /** Banco de sangre / donantes */
  bloodDonors: () => '/donantes-sangre',
  /** Rutinas semanales */
  routines: () => '/rutinas',
  /** Rutinas de una mascota especifica */
  petRoutines: (petId: string) => `/mascota/${petId}/rutinas`,
  /** Calendario unificado */
  calendar: () => '/calendario',

  // === Modelo de negocio (post pivot 2026-04-19) ===
  /** Identidad del proyecto: visión, misión, valores, motores */
  pawCore: () => '/paw-core',
  /** Membresía voluntaria (badge, sin features extra) */
  pawMember: () => '/paw-member',
  /** Paw Support — apoyo voluntario del dueño (modelo v2 2026-04-22
   *  2026-04-22, reemplaza "Donaciones" en UI pública). La ruta /donaciones
   *  sigue viva como alias 3 meses para no romper backlinks. */
  pawSupport: () => '/paw-support',
  /** @deprecated 2026-04-27 — usar `pawSupport()`. Se mantiene como alias. */
  donaciones: () => '/paw-support',
  /** Página pública de creadores aliados */
  pawVoices: () => '/paw-voices',
  /** Página pública de empresas sponsor */
  pawCompanys: () => '/paw-companys',
  /** Estimador de precios por comuna */
  preciosVeterinarios: () => '/precios-veterinarios',
  /** Registro de partners (tiendas, peluquerías, etc.) */
  registroPartner: () => '/registro-partner',
  /** Memorial de mascotas */
  enMemoria: () => '/en-memoria',
  /** FAQ pública */
  faq: () => '/faq',
} as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
