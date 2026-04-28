/**
 * Contenido del tutorial guiado por sección del sidebar.
 * Cada sección tiene múltiples pasos que el usuario recorre antes de
 * "desbloquear" esa zona de la app.
 */

export interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
}

export interface SectionTutorial {
  sectionKey: string;
  sectionLabel: string;
  color: string;
  steps: TutorialStep[];
}

export const SIDEBAR_TUTORIALS: SectionTutorial[] = [
  {
    sectionKey: 'salud',
    sectionLabel: 'Salud',
    color: 'from-purple-600 to-violet-500',
    steps: [
      {
        title: 'Tu centro de control',
        description:
          'En Inicio encuentras un resumen de todo: tus mascotas, recordatorios pendientes, actividad reciente y accesos rápidos a lo más importante.',
        tip: 'Revisa tu dashboard cada mañana para no perderte nada.',
      },
      {
        title: 'Mis mascotas y Paw Cards',
        description:
          'Cada mascota tiene su perfil completo con ficha clínica y una Paw Card coleccionable única estilo TCG. Voltea tu carta para ver el QR: otros usuarios pueden escanearla y coleccionarla.',
        tip: 'La ficha clínica es la joya de la corona: puedes descargarla como PDF y compartirla con tu vet.',
      },
      {
        title: 'Recordatorios',
        description:
          'Crea recordatorios para vacunas, desparasitaciones, controles y medicamentos. Te avisamos cuando se acerque la fecha para que nada se te pase.',
        tip: 'Puedes vincular Google Calendar para que tus recordatorios aparezcan ahí también.',
      },
    ],
  },
  {
    sectionKey: 'descubrir',
    sectionLabel: 'Descubrir',
    color: 'from-teal-500 to-emerald-500',
    steps: [
      {
        title: 'Buscar veterinario',
        description:
          'Explora el directorio público de veterinarios verificados en tu comuna. Filtra por especialidad, ubicación y reseñas de otros dueños.',
        tip: 'Puedes ver el perfil completo de cada vet antes de agendar.',
      },
      {
        title: 'Servicios',
        description:
          'Encuentra paseadores, cuidadores, entrenadores y peluqueros caninos cerca de ti. Todos con perfil verificado y reseñas reales.',
        tip: 'Reserva directamente desde la app y lleva el historial de tus citas.',
      },
      {
        title: 'Mapa',
        description:
          'Visualiza en un mapa interactivo todos los servicios y veterinarios cercanos. Ideal para encontrar opciones rápido cuando estás fuera de casa.',
        tip: 'El mapa usa tu ubicación para mostrarte lo más cercano primero.',
      },
      {
        title: 'Banco de sangre',
        description:
          'Registra a tu mascota como donante de sangre y ayuda a salvar vidas. Encuentra donantes compatibles cuando tu mascota lo necesite.',
      },
    ],
  },
  {
    sectionKey: 'comunidad',
    sectionLabel: 'Comunidad',
    color: 'from-orange-500 to-amber-500',
    steps: [
      {
        title: 'Feed',
        description:
          'Comparte fotos, experiencias y consejos con otros dueños de mascotas. Sigue a personas, dale like a publicaciones y mantente al día con la comunidad.',
        tip: 'Publica una foto de tu mascota para empezar a conectar.',
      },
      {
        title: 'Comunidad',
        description:
          'Únete a grupos organizados por raza, condición de salud o interés. Haz preguntas, comparte tips y conoce dueños con experiencias similares.',
        tip: 'Los grupos de raza son perfectos para consejos específicos de cuidado.',
      },
      {
        title: 'Mensajes',
        description:
          'Chatea directamente con otros dueños, veterinarios o proveedores de servicios. Coordina paseos, consultas o simplemente conversa.',
      },
    ],
  },
  {
    sectionKey: 'pawlabs',
    sectionLabel: 'Paw Labs',
    color: 'from-pink-500 to-rose-500',
    steps: [
      {
        title: 'Paw Game',
        description:
          'Gana PawPoints completando misiones: agregar mascotas, crear recordatorios, publicar en el feed y más. Sube de nivel de Guardián y desbloquea recompensas.',
        tip: 'Cada acción en la app te acerca a premios reales.',
      },
      {
        title: 'Misiones',
        description:
          'Completa desafíos diarios, semanales y mensuales para ganar puntos y badges exclusivos.',
      },
      {
        title: 'Paw Cards y colección',
        description:
          'Tus mascotas son tus primeras Paw Cards. Escanea las cards de otros usuarios para expandir tu colección. Cada card es única y tiene un ranking.',
        tip: 'Comparte tu QR para que más personas coleccionen tu Paw Card.',
      },
    ],
  },
];

/** Claves válidas de sección (para typing) */
export type SectionKey = 'salud' | 'descubrir' | 'comunidad' | 'pawlabs';

/** Orden de secciones para el flujo guiado */
export const SECTION_ORDER: SectionKey[] = ['salud', 'descubrir', 'comunidad', 'pawlabs'];

/** Obtener tutorial por sectionKey */
export function getTutorialBySection(key: SectionKey): SectionTutorial | undefined {
  return SIDEBAR_TUTORIALS.find((t) => t.sectionKey === key);
}
