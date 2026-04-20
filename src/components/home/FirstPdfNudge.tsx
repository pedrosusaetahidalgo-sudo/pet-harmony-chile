import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileDown, X } from '@/lib/icons';
import { LINKS } from '@/lib/links';
import { track, EVENTS } from '@/lib/analytics';
import { STORAGE_KEYS } from '@/lib/config/marketingConfig';

/**
 * Nudge "Primer PDF" (playbook §9.3 · 2026-04-19).
 *
 * Objetivo: disparar el "aha moment" (exportar PDF ficha clinica) para
 * tutores que agregaron mascota pero nunca descargaron PDF. Es la joya
 * de la corona y hoy muchos usuarios se pierden el feature.
 *
 * Senales:
 * - localStorage `pf_first_pdf_done` → se marca en MedicalSummaryButton al
 *   primer descargar PDF exitosa.
 * - localStorage `pf_first_pdf_nudge_dismissed` → el user cerro el banner.
 *
 * Solo se muestra si:
 * - hay al menos 1 mascota Y
 * - nunca descargo PDF Y
 * - nunca descarto el banner.
 */
interface FirstPdfNudgeProps {
  firstPetId: string | null;
  petsCount: number;
}

const DONE_KEY = STORAGE_KEYS.firstPdfDone;
const DISMISS_KEY = STORAGE_KEYS.firstPdfNudgeDismissed;

export function FirstPdfNudge({ firstPetId, petsCount }: FirstPdfNudgeProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!firstPetId || petsCount === 0) {
      setVisible(false);
      return;
    }
    let done = false;
    let dismissed = false;
    try {
      done = localStorage.getItem(DONE_KEY) === '1';
      dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      /* storage unavailable: treat as not-done, not-dismissed */
    }
    const shouldShow = !done && !dismissed;
    setVisible(shouldShow);
    if (shouldShow) {
      track({
        event: EVENTS.FIRST_PDF_NUDGE_SHOWN,
        properties: { pets_count: petsCount },
      });
    }
    // Queremos disparar una sola vez por sesion/render inicial.
  }, [firstPetId, petsCount]);

  if (!visible || !firstPetId) return null;

  const handleGoToFicha = () => {
    track({
      event: EVENTS.FIRST_PDF_NUDGE_CLICKED,
      properties: { pets_count: petsCount },
    });
    navigate(LINKS.petClinical(firstPetId));
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* no-op */
    }
    setVisible(false);
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-purple-50 shadow-sm">
      <CardContent className="flex items-start gap-3 py-4">
        <div className="shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 p-2.5 text-white shadow-sm">
          <FileDown className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-purple-900">
            Descarga el PDF de la ficha — es la joya de Paw Friend
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            En 3 toques tienes la ficha clínica en PDF lista para compartir por WhatsApp con
            cualquier vet, en chile o donde viajes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleGoToFicha}
              className="h-8 bg-gradient-to-br from-purple-600 to-rose-500 text-white hover:opacity-95"
            >
              Generar ahora
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Más tarde
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso"
          className="shrink-0 p-1 text-muted-foreground/60 hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
