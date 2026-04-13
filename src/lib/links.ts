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

  /** Ficha clínica de una mascota */
  petClinical: (petId: string) => `/ficha/${petId}`,

  /** Ficha clínica abierta directamente en la pestaña de compartir */
  petClinicalShare: (petId: string) => `/ficha/${petId}?action=share`,

  /** Ficha clínica abierta con CTA de reservar vet */
  petClinicalBook: (petId: string) => `/ficha/${petId}?action=book`,

  /** Historial médico global */
  medicalRecords: () => '/medical-records',

  // === Reservas ===
  /** Calendario / mis reservas */
  bookings: () => '/mis-reservas',

  // === Provider ===
  /** Dashboard del provider (vet logueado) */
  providerDashboard: () => '/provider/dashboard',

  /** Editor del perfil profesional */
  providerProfileEdit: () => '/provider/profile-edit',

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
