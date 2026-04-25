/**
 * OwnerAudioNoteRecorder — el dueño graba una observación o consulta vet y se
 * inserta en pet_timeline_events + owner_audio_notes (Refactor Maestro §2.6.2).
 *
 * Solo se muestra cuando OWNER_AUDIO_NOTES está activo.
 *
 * Flujo MVP (procesamiento IA queda como TODO para edge fn):
 *   1. Click "Grabar observación" → modal con mic
 *   2. Grabación con SpeechRecognition (transcript live)
 *   3. Stop → transcript se inserta como evento timeline + nota persistente
 *   4. (Futuro) Edge fn procesa el transcript con IA y estructura
 *      motivo/diagnostico/tratamiento → updatea timeline event
 *
 * Reutiliza `useAudioRecorder` (mismo hook que vets).
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface OwnerAudioNoteRecorderProps {
  petId: string;
  petName: string;
  /** Si se renderiza como Card embebida (en QuickActions) o como dialog standalone */
  trigger?: 'inline-button' | 'card';
}

type Phase = 'idle' | 'recording' | 'review' | 'saving';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function OwnerAudioNoteRecorder({
  petId,
  petName,
  trigger = 'card',
}: OwnerAudioNoteRecorderProps) {
  const recorder = useAudioRecorder();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [editedTranscript, setEditedTranscript] = useState('');

  const closeAndReset = useCallback(() => {
    recorder.reset();
    setPhase('idle');
    setEditedTranscript('');
    setOpen(false);
  }, [recorder]);

  const handleStart = useCallback(async () => {
    try {
      await recorder.start();
      setPhase('recording');
      trackRefactor(RefactorEvent.audioNoteOpened);
    } catch {
      toast.error('No se pudo acceder al micrófono. Verificá los permisos.');
    }
  }, [recorder]);

  const handleStop = useCallback(() => {
    const text = recorder.transcript + (recorder.interimText ? ' ' + recorder.interimText : '');
    recorder.stop();
    if (text.trim().length < 10) {
      toast.error('La grabación es muy corta. Intentá hablar más tiempo.');
      setPhase('idle');
      return;
    }
    setEditedTranscript(text.trim());
    setPhase('review');
  }, [recorder]);

  type AiObservation = {
    category: string;
    title: string;
    description: string;
    severity: 'info' | 'concern' | 'urgent';
    suggested_action: 'log_only' | 'consult_vet_soon' | 'consult_vet_urgent';
    reason: string | null;
  };

  /**
   * Llama a process-consultation-transcript con callerKind='owner'.
   * Si falla o devuelve datos inválidos, retorna null (caller usa fallback).
   */
  async function processWithAI(transcript: string): Promise<AiObservation | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return null;
      const supabaseUrl =
        (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
        'https://gwailbjlvevkhwcrovfd.supabase.co';
      const res = await fetch(`${supabaseUrl}/functions/v1/process-consultation-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcript,
          petName,
          callerKind: 'owner',
        }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return (json.observation as AiObservation) ?? null;
    } catch (err) {
      console.warn('process-consultation-transcript (owner) falló:', err);
      return null;
    }
  }

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No autenticado');
      const transcript = editedTranscript.trim();
      if (transcript.length < 10) throw new Error('La nota es muy corta');

      // 1. Procesar con IA (best-effort). Si falla, fallback a evento plano.
      const ai = await processWithAI(transcript);

      // 2. Crear evento en timeline con la categoría/título/descripción que la IA
      //    sugiere. Si IA falló, fallback a categoría 'health' con texto plano.
      const eventCategory = ai?.category ?? 'health';
      const eventTitle = ai?.title || `Observación de ${petName}`;
      const eventDescription = ai?.description || transcript;

      const { data: timelineEvent, error: e1 } = await supabase
        .from('pet_timeline_events')
        .insert({
          pet_id: petId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: eventCategory as any,
          title: eventTitle,
          description: eventDescription,
          event_at: new Date().toISOString(),
          is_user_reported: true,
          recorded_by: user.id,
          source: 'audio',
          data: {
            duration_seconds: recorder.duration,
            ai_processed: !!ai,
            severity: ai?.severity ?? null,
            suggested_action: ai?.suggested_action ?? null,
            ai_reason: ai?.reason ?? null,
            transcript_raw: transcript,
          },
        })
        .select('id')
        .single();
      if (e1) throw e1;

      // 3. Insertar registro persistente owner_audio_notes (auditoría)
      const { error: e2 } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('owner_audio_notes' as any)
        .insert({
          pet_id: petId,
          owner_user_id: user.id,
          transcript,
          duration_seconds: recorder.duration,
          processing_status: ai ? 'done' : 'review',
          timeline_event_id: timelineEvent.id,
        });
      if (e2) {
        console.warn('owner_audio_notes insert falló:', e2.message);
      }

      return { ai };
    },
    onSuccess: ({ ai }) => {
      trackRefactor(RefactorEvent.audioNoteSaved, {
        duration_seconds: recorder.duration,
        ai_processed: !!ai,
        severity: ai?.severity ?? null,
      });
      toast.success(`Observación de ${petName} guardada en su historia`);

      // Si IA detectó algo urgente, alertar al dueño
      if (ai?.suggested_action === 'consult_vet_urgent') {
        setTimeout(() => {
          toast.warning(`${petName}: te recomendamos consultar al vet pronto. ${ai.reason ?? ''}`, {
            duration: 8000,
          });
        }, 600);
      } else if (ai?.suggested_action === 'consult_vet_soon') {
        setTimeout(() => {
          toast.info(`Sugerencia: agendar visita al vet en próximos días.`, { duration: 5000 });
        }, 600);
      }

      queryClient.invalidateQueries({ queryKey: ['pet-history-timeline', petId] });
      closeAndReset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const supported = recorder.browserSupported;

  const Trigger =
    trigger === 'card' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md hover:border-purple-300 transition-all text-left"
      >
        <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Mic className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Grabar observación</p>
          <p className="text-xs text-muted-foreground">
            Hablá lo que viste en {petName} y queda en su historia
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
      </button>
    ) : (
      <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-1">
        <Mic className="h-3 w-3" /> Grabar observación
      </Button>
    );

  return (
    <>
      {Trigger}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) closeAndReset();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grabar observación de {petName}</DialogTitle>
            <DialogDescription>
              {phase === 'idle' && 'Hablá libremente lo que querés dejar registrado.'}
              {phase === 'recording' && 'Estoy escuchando…'}
              {phase === 'review' && 'Revisá la transcripción antes de guardar.'}
            </DialogDescription>
          </DialogHeader>

          {!supported && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                Tu navegador no soporta grabación de voz. Usá Chrome o Edge desde el celular.
              </div>
            </div>
          )}

          {phase === 'idle' && supported && (
            <div className="text-center space-y-3 py-4">
              <button
                type="button"
                onClick={handleStart}
                className="h-20 w-20 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center mx-auto shadow-lg active:scale-95 transition"
              >
                <Mic className="h-10 w-10" />
              </button>
              <p className="text-xs text-muted-foreground">Tocá para empezar</p>
            </div>
          )}

          {phase === 'recording' && (
            <div className="space-y-3 py-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-red-600 font-mono text-sm">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  {formatDuration(recorder.duration)}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 min-h-[80px] text-sm">
                <p className="text-foreground">{recorder.transcript}</p>
                {recorder.interimText && (
                  <p className="text-muted-foreground italic">{recorder.interimText}</p>
                )}
              </div>
              <Button onClick={handleStop} variant="outline" className="w-full gap-1">
                <Square className="h-3 w-3 fill-current" /> Terminar
              </Button>
            </div>
          )}

          {phase === 'review' && (
            <div className="space-y-3">
              <Textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                rows={6}
                placeholder="Editá si la transcripción tiene errores..."
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Esta observación queda en la historia clínica de {petName} con marca "reportada por
                el dueño".
              </p>
            </div>
          )}

          <DialogFooter>
            {phase === 'review' && (
              <>
                <Button variant="outline" onClick={closeAndReset} disabled={isSaving}>
                  Descartar
                </Button>
                <Button
                  onClick={() => save()}
                  disabled={isSaving || editedTranscript.trim().length < 10}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Guardando
                    </>
                  ) : (
                    'Guardar en su historia'
                  )}
                </Button>
              </>
            )}
            {(phase === 'idle' || phase === 'recording') && (
              <Button variant="outline" onClick={closeAndReset}>
                Cancelar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
