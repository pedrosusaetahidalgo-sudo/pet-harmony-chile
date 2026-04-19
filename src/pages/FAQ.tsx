import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { RichFooter } from '@/components/landing/RichFooter';
import { Bell, ArrowLeft } from '@/lib/icons';

/**
 * FAQ pública — extraída del landing v2 para evitar saturar el viaje
 * principal y para tener pricing actualizado al modelo post 2026-04-19.
 *
 * Cuando aparezcan dudas nuevas frecuentes (canal de soporte), agregar
 * acá en lugar de inflar el landing.
 */
const FAQ_ITEMS = [
  {
    q: '¿Cuánto cuesta usar Paw Friend?',
    a: 'Es gratis para dueños. Para siempre. Sin límite de mascotas, sin gates ocultos. Si quieres apoyar el proyecto puedes hacerte Paw Member ($3.990/mes voluntario, mismas features + badge 💛) o donar lo que sientas justo en /donaciones.',
  },
  {
    q: '¿Cómo encuentro un veterinario?',
    a: 'Entra al directorio público en /veterinarios, filtra por comuna y especialidad, y revisa reseñas verificadas (solo dueños que reservaron pueden dejarlas). Reserva sin intermediarios.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Tu información médica es privada. Solo tú decides con qué veterinario compartirla, y por cuánto tiempo (links que vencen a los 30 días). Cumplimos con la normativa de protección de datos en Chile.',
  },
  {
    q: 'Soy veterinario, ¿cómo me sumo?',
    a: 'Tenemos planes para clínicas y profesionales independientes. El Plan Básica es gratis (5 pacientes). Premium parte en $9.900/mes. Ingresa a /para-veterinarios para ver todos los planes y registrarte.',
  },
  {
    q: '¿Qué es Paw Member?',
    a: 'Es una membresía 100% voluntaria. NO desbloquea features extra (todo es gratis). Es para dueños que quieren sostener el proyecto activamente. Reciben badge 💛 y acceso a descuentos de empresas aliadas (Paw Partners).',
  },
  {
    q: '¿Quién está detrás del proyecto?',
    a: 'Paw Friend es un proyecto home-made: lo construye una persona en Chile, apoyada por IA, sin VC presionando. Todo el modelo de sostenibilidad está documentado en /paw-core.',
  },
  {
    q: '¿Puedo donar?',
    a: 'Sí, en /donaciones. Cada aporte se traduce en Paw Points y se reconoce públicamente. La transparencia del uso de fondos también vive en /donaciones.',
  },
  {
    q: '¿Qué es Paw Voices? ¿Y Paw Companys?',
    a: 'Paw Voices son creadores/influencers que amplifican la misión (ver /paw-voices). Paw Companys son empresas sponsor con aporte mensual (ver /paw-companys). Ambas son alianzas opcionales.',
  },
  {
    q: '¿Puedo eliminar mi cuenta?',
    a: 'Sí, en /delete-account o desde tu perfil. Borrado permanente de todos tus datos en menos de 24 horas.',
  },
  {
    q: '¿Hay app móvil?',
    a: 'Sí, Paw Friend está disponible como web app (funciona perfecto en navegador móvil) y como app nativa Android/iOS vía Capacitor. La web app no requiere instalación.',
  },
] as const;

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Preguntas frecuentes — Paw Friend</title>
        <meta
          name="description"
          content="Resolvemos las dudas más comunes sobre Paw Friend: pricing, privacidad, vets, donaciones y modelo del proyecto."
        />
        <link rel="canonical" href="https://pawfriend.cl/faq" />
      </Helmet>

      <LandingHeader />

      <main className="px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="mt-6 mb-10 text-center md:mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Bell className="h-3.5 w-3.5" />
              Preguntas frecuentes
            </span>
            <h1 className="mt-4 font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.05]">
              ¿Alguna duda?
            </h1>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              Lo más preguntado por la comunidad. Si no encuentras tu respuesta, escríbenos a{' '}
              <a
                href="mailto:pawfriendcl@gmail.com"
                className="font-semibold text-primary hover:underline"
              >
                pawfriendcl@gmail.com
              </a>
              .
            </p>
          </div>

          <Accordion type="single" collapsible className="flex w-full flex-col gap-3">
            {FAQ_ITEMS.map(({ q, a }, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="rounded-2xl border-0 bg-neutral-50 px-5 data-[state=open]:bg-neutral-100/70"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline md:text-lg">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <RichFooter />
    </div>
  );
}
