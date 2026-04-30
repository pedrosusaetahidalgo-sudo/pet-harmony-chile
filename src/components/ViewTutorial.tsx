import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { HelpCircle } from '@/lib/icons';

interface TutorialStep {
  title: string;
  description: string;
}

interface ViewTutorialProps {
  /** Title of the tutorial */
  title: string;
  /** One-line summary */
  summary: string;
  /** Ordered steps */
  steps: readonly TutorialStep[];
  /** Optional: show as floating button (default true) */
  floating?: boolean;
}

/**
 * Tutorial contextual por vista. Muestra un sheet lateral con pasos
 * detallados sobre como usar la pantalla actual.
 *
 * Uso: <ViewTutorial title="Mi consultorio" summary="..." steps={[...]} />
 */
export function ViewTutorial({ title, summary, steps, floating = true }: ViewTutorialProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {floating ? (
          <button
            className="fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors sm:bottom-6"
            aria-label="Ayuda"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            Ayuda
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            {title}
          </SheetTitle>
          <SheetDescription>{summary}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-3 bg-muted/50 rounded-lg">
          <p className="text-[10px] text-muted-foreground">
            ¿Necesitas mas ayuda? Escribenos a soporte@pawfriend.cl
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Tutoriales pre-definidos por vista
// ══════════════════════════════════════════════════════════════════════

export const TUTORIALS = {
  home: {
    title: 'Inicio',
    summary: 'Tu centro de control de Paw Friend',
    steps: [
      {
        title: 'Tus mascotas',
        description:
          'Los avatares circulares arriba son tus mascotas. Toca uno para ver su resumen rapido con salud, recordatorios y acciones.',
      },
      {
        title: 'Recordatorios urgentes',
        description:
          'Los recordatorios vencidos aparecen destacados en rojo. Toca "Posponer" para aplazar 1 dia o 1 semana.',
      },
      {
        title: 'Acciones rapidas',
        description:
          'Usa los botones inferiores para navegar: Mis Mascotas, Servicios (veterinarios y más), Agenda y Perfil.',
      },
      {
        title: 'Lo esencial gratis para siempre',
        description:
          'Plan Free ($0): ficha clínica, recordatorios, calendario, OCR del carnet y directorio de vets — hasta 2 mascotas. Si quieres más, hay 2 planes opcionales: Paw Member ($3.990/mes, hasta 4 mascotas, suma Paw Passport + Insights Pro + audio IA + reportes históricos + descuentos Paw Partners) y Manada ($9.990/mes, hasta 5 mascotas, suma Paw Shield biométrico exclusivo + descuentos exclusivos + early access + aporte $2.000/mes a fondo refugios).',
      },
    ],
  },

  myPets: {
    title: 'Mis Mascotas',
    summary: 'Administra el perfil y salud de cada mascota',
    steps: [
      {
        title: 'Agregar mascota',
        description:
          'Toca el botón "+" para crear una nueva mascota. Necesitas nombre, especie y foto. El plan Free incluye hasta 2 mascotas; Paw Member sube a 4 y Manada a 5.',
      },
      {
        title: 'Paw Card',
        description:
          'Cada mascota tiene una Paw Card coleccionable con diseno unico. Toca la card para voltearla y ver el QR.',
      },
      {
        title: 'Ficha clinica',
        description:
          'Toca "Ver ficha" en cualquier mascota para acceder a su historial medico completo, vacunas, documentos y compartir con tu vet.',
      },
      {
        title: 'Editar datos',
        description:
          'Toca el icono de lapiz para modificar nombre, raza, peso, alergias y otros datos clinicos.',
      },
    ],
  },

  fichaClinical: {
    title: 'Ficha Clinica',
    summary: 'El historial medico completo de tu mascota',
    steps: [
      {
        title: 'Tab Resumen',
        description:
          'Vista rapida con datos basicos, alertas clinicas, peso y proximas citas. Edita los datos clinicos desde aqui.',
      },
      {
        title: 'Tab Vacunas',
        description:
          'Tabla cronologica con todas las vacunas: fecha, nombre, lote, serie, veterinario. Badge verde = "Al dia", rojo = "Pendiente".',
      },
      {
        title: 'Tab Historial',
        description:
          'Timeline de todos los registros medicos (consultas, examenes, cirugias). Usa el buscador y filtros por tipo y fuente.',
      },
      {
        title: 'Agregar registro',
        description:
          'Boton "Agregar Registro" para crear consultas, vacunas, desparasitaciones, etc. Si agregas fecha proxima en vacuna/desparasitacion, se crea recordatorio automatico.',
      },
      {
        title: 'Compartir ficha',
        description:
          'Tab "Compartir" permite vincular con tu veterinario o generar enlace publico temporal (30 dias). Compartir ilimitado, gratis para todos.',
      },
      {
        title: 'PDF descargable',
        description:
          'En "Documentos" puedes descargar la ficha clinica como PDF profesional. Gratis para todos los dueños.',
      },
    ],
  },

  providerDashboard: {
    title: 'Mi Consultorio',
    summary: 'Hub de gestion para veterinarios y profesionales',
    steps: [
      {
        title: 'Acciones rapidas',
        description:
          'Arriba tienes 3 botones: "Nuevo paciente" para registrar, "Grabar consulta" para notas con IA, y "Calendario" para ver tu agenda.',
      },
      {
        title: 'Metricas interactivas',
        description:
          'Las 6 cards con numeros son clickeables: toca una para ir al tab correspondiente. El icono (?) te explica cada metrica.',
      },
      {
        title: 'Tab Clinico',
        description:
          'Agenda de hoy, fichas compartidas por duenos, pacientes vinculados y seguimientos pendientes. Es tu vista de trabajo diaria.',
      },
      {
        title: 'Tab Negocio',
        description:
          'Grafico de reservas, ingresos, resenas y perfil publico. Link a "Analytics completos" para ver comparativas y exportar.',
      },
      {
        title: 'Tab Pacientes',
        description:
          'Lista completa de todos tus pacientes con actividad reciente. Boton "Nuevo paciente" para agregar uno manualmente.',
      },
      {
        title: 'Feed de actividad',
        description:
          'Al final del dashboard ves los ultimos 7 dias de actividad: fichas compartidas, solicitudes de vinculacion, reservas y resenas nuevas.',
      },
    ],
  },

  reminders: {
    title: 'Recordatorios',
    summary: 'No se te pasa ninguna vacuna, control o medicamento',
    steps: [
      {
        title: 'Crear recordatorio',
        description:
          'Toca "+" para crear uno nuevo. Elige tipo (vacuna, control, medicamento), titulo, mascota y fecha. Plan gratuito: maximo 3 activos.',
      },
      {
        title: 'Recordatorios vencidos',
        description:
          'Los vencidos aparecen arriba en rojo. Usa "Posponer 1 dia" o "Posponer 1 semana" para reprogramar.',
      },
      {
        title: 'Recurrentes',
        description:
          'Algunos recordatorios se repiten automaticamente (ej: desparasitacion trimestral). Al completar uno, se crea el siguiente.',
      },
      {
        title: 'Desde la ficha clinica',
        description:
          'Al registrar una vacuna o desparasitacion con "Proxima cita", se crea un recordatorio automatico.',
      },
    ],
  },

  directorio: {
    title: 'Directorio de Veterinarios',
    summary: 'Encuentra al mejor profesional para tu mascota',
    steps: [
      {
        title: 'Buscar por comuna',
        description:
          'Usa el selector de comuna para filtrar veterinarios cerca tuyo. Los resultados muestran distancia aproximada.',
      },
      {
        title: 'Especialidades',
        description:
          'Filtra por especialidad (cirugia, dermatologia, cardiologia, etc.) para encontrar al vet indicado.',
      },
      {
        title: 'Badge "Atiende hoy"',
        description:
          'Los veterinarios con badge verde "Atiende hoy" tienen disponibilidad marcada para hoy.',
      },
      {
        title: 'Perfil del vet',
        description:
          'Toca un vet para ver su perfil completo: bio, precios, resenas, horarios y boton para agendar o vincular.',
      },
    ],
  },
} as const;
