import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { FileText, CheckCircle2, Syringe, Heart, Shield, Download } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';

/**
 * Seccion dedicada a la joya de la corona: la ficha clinica PDF descargable.
 * Split horizontal con mockup del PDF + copy + 3 bullets.
 */
const MedicalPDFShowcase = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => navigate(user ? LINKS.myPets() : LINKS.auth());

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-28">
      {/* Fondo cálido sutil */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-background to-background" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* PDF Mockup */}
          <div className="order-2 md:order-1">
            <div className="relative mx-auto max-w-sm">
              {/* Sheet rotado */}
              <div className="relative rotate-[-3deg] rounded-2xl bg-white p-6 shadow-[0_40px_80px_-20px_rgba(251,146,60,0.35)] ring-1 ring-black/5 md:p-7">
                {/* Header PDF */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                      Paw Friend · Chile
                    </p>
                    <p className="mt-1 text-lg font-black tracking-tight text-neutral-900">
                      Ficha clínica
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-primary" />
                </div>

                {/* Datos mascota */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Mascota
                    </span>
                    <span className="text-sm font-bold text-neutral-900">Firulais</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Raza
                    </span>
                    <span className="text-sm font-semibold text-neutral-900">Beagle</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Edad
                    </span>
                    <span className="text-sm font-semibold text-neutral-900">4 años</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Microchip
                    </span>
                    <span className="font-mono text-xs text-neutral-700">982000364512031</span>
                  </div>
                </div>

                {/* Vacunas */}
                <div className="mt-5 rounded-xl bg-emerald-50/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Vacunas al día
                  </p>
                  <div className="mt-2 space-y-1">
                    {[
                      'Séxtuple · 12 mar 2026',
                      'Antirrábica · 08 ene 2026',
                      'Tos de las perreras · 22 nov 2025',
                    ].map((t) => (
                      <div key={t} className="flex items-center gap-2 text-[11px] text-neutral-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alergias */}
                <div className="mt-3 rounded-xl bg-rose-50/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    Alergias
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-700">Ninguna reportada</p>
                </div>

                {/* Footer PDF */}
                <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 text-[9px] text-neutral-500">
                  <span>pawfriend.cl</span>
                  <span>Generado 2026-04-11</span>
                </div>
              </div>

              {/* Badge flotante descarga */}
              <div className="absolute -right-4 top-10 rotate-[6deg] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                      PDF listo
                    </p>
                    <p className="text-xs font-bold text-neutral-900">ficha-firulais.pdf</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <FileText className="h-3.5 w-3.5" />
              Ficha clínica PDF
            </span>
            <h2 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
              Una ficha clínica que{' '}
              <span className="bg-warm-gradient bg-clip-text text-transparent">
                cualquier vet puede leer
              </span>
              .
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Exporta toda la historia médica de tu mascota en un PDF limpio, con vacunas, alergias
              e historial completos. Ideal para cambios de veterinario o viajes.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                {
                  icon: Syringe,
                  text: 'Calendario de vacunas siempre al día',
                },
                {
                  icon: Heart,
                  text: 'Alergias y condiciones crónicas destacadas',
                },
                {
                  icon: Shield,
                  text: 'Comparte sólo con el vet que tú elijas',
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-base text-foreground">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={handleCTA}
              className="mt-8 h-14 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_20px_40px_-18px_rgba(251,146,60,0.5)] transition-all hover:scale-[1.02] hover:bg-primary/90"
            >
              Crear ficha de mi mascota
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MedicalPDFShowcase;
