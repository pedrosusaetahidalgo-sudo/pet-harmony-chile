/**
 * Datos estructurales del landing: 4 pilares del ecosistema + 5 caminos
 * de comunidad. Centralizados acá para facilitar edición sin tocar JSX.
 */

export interface Pillar {
  /** Path al icono custom dentro de /public/icons/landing/ (brand SVG squircle) */
  iconSrc: string;
  title: string;
  description: string;
  /** Color de acento (Tailwind utility class fragment) */
  accentFrom: string;
  accentTo: string;
  /** Ruta interna a la que apunta el card (deep link al feature) */
  href: string;
  /** Etiqueta opcional ("Beta", "Nuevo") */
  tag?: string;
}

/** 4 pilares del ecosistema (sección 4 del masterplan §9.5). */
export const PILLARS: readonly Pillar[] = [
  {
    iconSrc: '/icons/landing/13_health_monitored.svg',
    title: 'Salud',
    description:
      'Ficha clínica PDF, vacunas al día, recordatorios automáticos, OCR del carnet con IA.',
    accentFrom: 'from-emerald-400',
    accentTo: 'to-teal-500',
    href: '/auth?intent=ficha',
  },
  {
    iconSrc: '/icons/landing/20_chat.svg',
    title: 'Comunidad',
    description: 'Feed pet lover, grupos por raza, adopciones. El lado humano de tener un peludo.',
    accentFrom: 'from-rose-400',
    accentTo: 'to-pink-500',
    href: '/auth?intent=comunidad',
  },
  {
    iconSrc: '/icons/landing/12_first_aid.svg',
    title: 'Emergencias',
    description: 'Red de donantes de sangre, vets de urgencia 24h, ficha compartida en 1 toque.',
    accentFrom: 'from-amber-400',
    accentTo: 'to-orange-500',
    href: '/donantes-sangre',
  },
  {
    iconSrc: '/icons/landing/11_pet_beloved.svg',
    title: 'Memoria',
    description: 'Cápsulas del alma, memorial de los que se fueron. Espacio para honrar.',
    accentFrom: 'from-violet-400',
    accentTo: 'to-fuchsia-500',
    href: '/en-memoria',
  },
] as const;

export interface CommunityCard {
  iconSrc: string;
  title: string;
  description: string;
  cta: string;
  /** href interno o "mailto:..." para externos */
  to: string;
  accentFrom: string;
  accentTo: string;
}

/** 5 caminos de comunidad (sección 9 del masterplan §9.10). */
export const COMMUNITY_CARDS: readonly CommunityCard[] = [
  {
    iconSrc: '/icons/landing/04_heart_paw.svg',
    title: 'Paw Member',
    description:
      'Aporta $3.990/mes voluntario. Mismas features, badge de honor que sostiene el proyecto.',
    cta: 'Ver Paw Member',
    to: '/paw-member',
    accentFrom: 'from-amber-400',
    accentTo: 'to-amber-600',
  },
  {
    iconSrc: '/icons/landing/27_rocket.svg',
    title: 'Paw Voices',
    description:
      '¿Creador en redes? Amplifica la misión con tu voz auténtica. Badge oficial + perfil.',
    cta: 'Aplicar',
    to: '/paw-voices',
    accentFrom: 'from-violet-500',
    accentTo: 'to-fuchsia-600',
  },
  {
    iconSrc: '/icons/landing/24_partnership.svg',
    title: 'Paw Companys',
    description:
      '¿Tu empresa ama a los peludos? Sponsor mensual con logo + menciones + impacto medible.',
    cta: 'Aplicar',
    to: '/paw-companys',
    accentFrom: 'from-orange-400',
    accentTo: 'to-rose-500',
  },
  {
    iconSrc: '/icons/landing/26_clinic.svg',
    title: 'Paw Partners',
    description:
      'Tiendas, comida, restaurantes, seguros. Descuentos a Paw Members ↔ publicidad gratis.',
    cta: 'Escríbenos',
    to: 'mailto:pedrosusaeta@pawfriend.cl?subject=Paw Partner',
    accentFrom: 'from-rose-400',
    accentTo: 'to-pink-600',
  },
  {
    iconSrc: '/icons/landing/12_first_aid.svg',
    title: 'Donante de sangre',
    description:
      'Si tu peludo califica, salva la vida de otro peludo en urgencia. Red activa en Chile.',
    cta: 'Inscribirme',
    to: '/donantes-sangre',
    accentFrom: 'from-red-500',
    accentTo: 'to-rose-600',
  },
] as const;

/**
 * Bullets B2B del bloque ForVets — iconografía custom.
 */
export const VET_BENEFITS: readonly { iconSrc: string; text: string }[] = [
  { iconSrc: '/icons/landing/22_search.svg', text: 'Más pacientes desde tu comuna' },
  { iconSrc: '/icons/landing/14_clinical_record.svg', text: 'Ficha clínica compartida con dueños' },
  { iconSrc: '/icons/landing/15_calendar.svg', text: 'Agenda + sync Google Calendar' },
  { iconSrc: '/icons/landing/25_growth.svg', text: 'Reportes semanales automáticos' },
  { iconSrc: '/icons/landing/10_stethoscope.svg', text: 'Verificación Colmevet integrada' },
  {
    iconSrc: '/icons/landing/21_notification.svg',
    text: '"Ver como me ven los dueños" en 1 click',
  },
] as const;
