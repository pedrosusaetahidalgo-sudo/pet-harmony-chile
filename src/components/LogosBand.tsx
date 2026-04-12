import { Building2 } from '@/lib/icons';

/**
 * Banda de logos de clínicas veterinarias — sección 2 del blueprint.
 *
 * Simula logos con nombre + ícono porque no tenemos assets reales aún.
 * Grayscale por defecto, color al hover en desktop.
 * En mobile: scroll horizontal con fade en los bordes.
 */

const CLINICS = [
  'VetCentro Providencia',
  'Clínica Animal Sur',
  'VetPlus Santiago',
  'PetCare Ñuñoa',
  'Clínica Los Andes',
  'VetSalud Viña',
];

const LogosBand = () => {
  return (
    <section
      aria-label="Clínicas que usan Paw Friend"
      className="relative border-y border-neutral-100 bg-neutral-50/60 px-4 py-8"
    >
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Veterinarios que ya usan Paw Friend
      </p>

      {/* Contenedor con scroll horizontal en mobile, centrado en desktop */}
      <div className="relative">
        {/* Fade izquierdo mobile */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-neutral-50/60 to-transparent md:hidden" />
        {/* Fade derecho mobile */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-neutral-50/60 to-transparent md:hidden" />

        <div className="flex items-center gap-8 overflow-x-auto px-4 scrollbar-hide md:justify-center md:overflow-visible md:px-0">
          {CLINICS.map((name) => (
            <div
              key={name}
              className="flex shrink-0 items-center gap-2 grayscale opacity-60 transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <span className="whitespace-nowrap text-sm font-semibold text-neutral-700">
                {name}
              </span>
            </div>
          ))}
          <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-muted-foreground">
            +40 clínicas
          </span>
        </div>
      </div>
    </section>
  );
};

export default LogosBand;
