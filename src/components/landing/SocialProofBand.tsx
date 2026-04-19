import { Sparkles } from '@/lib/icons';

/**
 * Banda de prueba social. Reemplaza al antiguo LogosBand.tsx que tenía
 * clínicas FALSAS (riesgo de credibilidad — masterplan §3.3).
 *
 * Estado actual: HONESTO. Mostramos "comunidad pioneer en formación"
 * hasta tener logos reales con autorización (Pedro: contacto Sofía Rosi
 * + 3-5 clínicas más).
 *
 * Cuando lleguen los logos reales:
 *   1. Importarlos en `public/landing/clinics/`
 *   2. Reemplazar el bloque <PioneerState /> por <RealLogos />
 *   3. Borrar el TODO comment
 */
export function SocialProofBand() {
  return (
    <section
      aria-label="Comunidad de Paw Friend"
      className="relative border-y border-neutral-100 bg-neutral-50/60 px-4 py-8"
    >
      <div className="container mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Comunidad pioneer en formación
        </span>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Estamos sumando dueños y veterinarios reales en Chile, semana a semana.{' '}
          <span className="font-semibold text-foreground">
            Sé parte del primer grupo que cuida la salud de su peludo en serio.
          </span>
        </p>
      </div>

      {/* TODO(landing): cuando Pedro consiga 3+ logos clínicas reales con
          autorización por escrito, reemplazar el bloque de arriba por:

          <ul className="flex items-center gap-8 overflow-x-auto md:justify-center">
            {REAL_CLINICS.map((c) => (
              <li key={c.name}>
                <img src={c.logo} alt={c.name} className="h-8 grayscale opacity-60 hover:opacity-100 transition" />
              </li>
            ))}
          </ul>
      */}
    </section>
  );
}
