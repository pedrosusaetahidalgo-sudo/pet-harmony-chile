/**
 * PetCompletionProgress — feedback al dueño sobre el progreso de la
 * mascota hacia "ficha completa" (definición del North Star §14.bis.6).
 *
 * Diseño:
 *   - Si is_complete=true → card celebratoria con badge "Ficha completa ✨"
 *   - Si in-progress → progress bar grande + qué falta (eventos / categorías
 *     / Pet ID Card) con CTAs específicas
 *   - Si recién creada (1-2 eventos) → mensaje motivador "Vamos juntos"
 *
 * No invasivo: si la mascota ya está completa, el card es solo
 * celebratorio (no pide nada más). Si está cerca (>=80%) destaca con
 * tone purple. Si está al inicio (<30%) tone neutral con sugerencias
 * de primera acción.
 *
 * Filosofía: el dueño NO debería sentirse presionado a completar.
 * El progreso es invitación, no requirimiento. La ficha "incompleta"
 * sigue siendo útil — Pet ID Card, share, todo funciona igual.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePetCompletionStatus } from '@/hooks/usePetCompletionStatus';
import { pickCompletionTone } from '@/lib/completion';
import { LINKS } from '@/lib/links';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Props {
  petId: string;
  petName: string;
  /** Si true, muestra card minimal (1 línea); si false, full card con CTAs. */
  compact?: boolean;
}

export function PetCompletionProgress({ petId, petName, compact = false }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = usePetCompletionStatus(petId);
  const claimAttempted = useRef(false);

  // §14.bis.6 owner-side: cuando is_complete=true, intentar claim del milestone.
  // El RPC es idempotente DB-side — si ya se otorgo antes, devuelve already_awarded=true
  // y no contamina toast. Solo dispara una vez por mount via claimAttempted ref.
  useEffect(() => {
    if (!data?.is_complete || claimAttempted.current) return;
    claimAttempted.current = true;

    void (async () => {
      try {
        const { data: result, error } = await sb.rpc('claim_ficha_complete_milestone', {
          p_pet_id: petId,
        });
        if (error) {
          console.warn('[PetCompletionProgress] claim error', error);
          return;
        }
        const row = (
          result as Array<{ already_awarded: boolean; points_awarded: number; qualifies: boolean }>
        )?.[0];
        if (row && !row.already_awarded && row.points_awarded > 0) {
          // Primera vez que cruza el threshold — celebrar
          toast.success(`¡${petName} tiene ficha completa! 🎉`, {
            description: `+${row.points_awarded} Paw Points por completar el norte del proyecto.`,
            duration: 6000,
          });
        }
      } catch (err) {
        console.warn('[PetCompletionProgress] claim threw', err);
      }
    })();
  }, [data?.is_complete, petId, petName]);

  if (isLoading) return <Skeleton className={compact ? 'h-12 w-full' : 'h-32 w-full'} />;
  if (!data) return null;

  // Determinar tone segun progreso (lógica pura testeable)
  const tone = pickCompletionTone(data.is_complete, data.progress_pct);

  const toneColors = {
    complete: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50',
    near: 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50',
    progress: 'border-slate-200 bg-slate-50/40',
    starting: 'border-slate-200 bg-slate-50/40',
  };

  // ── COMPACT MODE: solo barra + label ─────────────────────────────────
  if (compact) {
    return (
      <Card className={cn(toneColors[tone])}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {data.is_complete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="relative h-4 w-4 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-purple-500"
                  style={{
                    clipPath: `polygon(0 0, ${data.progress_pct}% 0, ${data.progress_pct}% 100%, 0 100%)`,
                  }}
                />
              </div>
            )}
            <p className="text-xs flex-1">
              {data.is_complete ? (
                <>
                  Ficha completa de <strong>{petName}</strong> ✨
                </>
              ) : (
                <>
                  Ficha de <strong>{petName}</strong>:{' '}
                  <span className="text-purple-700 font-semibold">{data.progress_pct}%</span>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── FULL CARD ─────────────────────────────────────────────────────────
  return (
    <Card className={cn(toneColors[tone])}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {data.is_complete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Sparkles className="h-5 w-5 text-purple-600" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {data.is_complete
                ? `Ficha completa de ${petName} ✨`
                : `Ficha de ${petName}: ${data.progress_pct}%`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {data.is_complete
                ? 'Tiene historia rica, identidad y categorías diversas. Sigue agregando lo que sea relevante.'
                : tone === 'near'
                  ? '¡Muy cerca de tener una ficha completa!'
                  : tone === 'progress'
                    ? 'Cada evento que registres suma a la historia.'
                    : 'Vamos a armar la historia paso a paso.'}
            </p>
          </div>
        </div>

        {!data.is_complete && (
          <>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${data.progress_pct}%` }}
              />
            </div>

            {/* Pasos */}
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-3 w-3 rounded-full shrink-0',
                    data.event_count >= data.event_target ? 'bg-emerald-500' : 'bg-slate-300'
                  )}
                />
                <span
                  className={
                    data.event_count >= data.event_target
                      ? 'text-emerald-700 font-medium'
                      : 'text-slate-700'
                  }
                >
                  {data.event_count} de {data.event_target} eventos en el timeline
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-3 w-3 rounded-full shrink-0',
                    data.category_count >= data.category_target ? 'bg-emerald-500' : 'bg-slate-300'
                  )}
                />
                <span
                  className={
                    data.category_count >= data.category_target
                      ? 'text-emerald-700 font-medium'
                      : 'text-slate-700'
                  }
                >
                  {data.category_count} de {data.category_target} categorías distintas
                  {data.missing_categories > 0 && (
                    <span className="text-muted-foreground italic"> (probá vacuna/peso/foto)</span>
                  )}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-3 w-3 rounded-full shrink-0',
                    data.has_id_card ? 'bg-emerald-500' : 'bg-slate-300'
                  )}
                />
                <span
                  className={data.has_id_card ? 'text-emerald-700 font-medium' : 'text-slate-700'}
                >
                  Pet ID Card {data.has_id_card ? 'generada' : 'pendiente'}
                </span>
              </li>
            </ul>

            {/* CTA: la primera accion que falte */}
            {!data.has_id_card && (
              <Button
                size="sm"
                onClick={() => navigate(`${LINKS.petClinical(petId)}?tab=identidad`)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Generar Pet ID Card <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            {data.has_id_card && data.event_count < data.event_target && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`${LINKS.petClinical(petId)}?tab=cuidados`)}
                className="w-full"
              >
                Registrar evento <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
