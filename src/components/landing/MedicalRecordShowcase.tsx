import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { ArrowRight, FileText, CheckCircle2, Download, MessageCircle } from '@/lib/icons';
import { MEDICAL } from './content/copy';
import { RevealSection } from './RevealSection';

/**
 * Joya 1 — Ficha clínica PDF (masterplan §9.6 / §15.5).
 * Reemplaza al antiguo MedicalPDFShowcase.tsx pero mantiene el espíritu:
 * mostrar visualmente el resultado tangible (PDF) + animación de "compartir".
 *
 * Dirección visual:
 * - Mockup del PDF con datos demo (Kai, pastor suizo — la mascota real
 *   del founder, tal como aparece en seed flag).
 * - Card flotante "PDF listo" + indicador animado "compartiendo por WhatsApp".
 * - Sin rotación del sheet (el masterplan dice eliminar rotaciones).
 */
export function MedicalRecordShowcase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <RevealSection
      as="section"
      id="ficha-clinica"
      ariaLabelledby="ficha-title"
      className="relative overflow-hidden px-4 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-white" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />

      <div className="container relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* PDF Mockup — sin rotación */}
          <div className="order-2 md:order-1">
            <div className="relative mx-auto max-w-sm">
              <div className="relative rounded-2xl bg-white p-7 shadow-[0_40px_80px_-20px_rgba(147,51,234,0.25)] ring-1 ring-black/5">
                {/* Header PDF con logo brand */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg"
                      alt=""
                      aria-hidden
                      className="h-6 w-6"
                    />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-purple-600">
                        Paw Friend · Chile
                      </p>
                      <p className="mt-0.5 text-base font-black tracking-tight text-neutral-900">
                        Ficha clínica
                      </p>
                    </div>
                  </div>
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>

                {/* Datos mascota */}
                <div className="mt-4 space-y-1.5">
                  {[
                    ['Mascota', 'Kai'],
                    ['Raza', 'Pastor suizo'],
                    ['Edad', '4 años'],
                    ['Microchip', '982000364512031'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                        {k}
                      </span>
                      <span className="font-mono text-xs text-neutral-900">{v}</span>
                    </div>
                  ))}
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
                  <span>Generado 2026-04-18</span>
                </div>
              </div>

              {/* Badge flotante: PDF listo */}
              <div className="absolute -right-3 top-10 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                      PDF listo
                    </p>
                    <p className="text-xs font-bold text-neutral-900">ficha-kai.pdf</p>
                  </div>
                </div>
              </div>

              {/* Badge flotante: compartiendo por WhatsApp */}
              <div className="absolute -bottom-3 -left-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
                      Compartido
                    </p>
                    <p className="text-xs font-bold text-neutral-900">vía WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <FileText className="h-3.5 w-3.5" />
              {MEDICAL.badge}
            </span>
            <h2
              id="ficha-title"
              className="mt-4 font-display font-semibold text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              {MEDICAL.h2Lead}{' '}
              <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
                {MEDICAL.h2Highlight}
              </span>
              .
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              {MEDICAL.body}
            </p>

            <ul className="mt-7 space-y-3">
              {MEDICAL.bullets.map((text) => (
                <li key={text} className="flex items-start gap-3 text-base text-foreground">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={() => navigate(user ? LINKS.myPets() : LINKS.auth())}
              className="mt-9 h-14 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_20px_40px_-18px_rgba(147,51,234,0.5)] transition-all hover:scale-[1.02] hover:bg-primary/90"
            >
              {MEDICAL.cta}
              <ArrowRight className="ml-1.5 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
