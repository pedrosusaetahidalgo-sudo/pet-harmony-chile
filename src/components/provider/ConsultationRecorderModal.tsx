import { useState, useCallback } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Square, Pause, Play, Loader2, AlertTriangle, Sparkles } from '@/lib/icons';
import { toast } from 'sonner';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useProcessTranscript, type ConsultationSummary } from '@/hooks/useProcessTranscript';
import { ConsultationSummaryView } from './ConsultationSummaryView';

type Phase = 'idle' | 'recording' | 'processing' | 'summary';

interface ConsultationRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareTokenId?: string;
  providerId: string;
  petId: string;
  petName: string;
  petSpecies?: string;
  onSaved?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ConsultationRecorderModal({
  open,
  onOpenChange,
  shareTokenId,
  providerId,
  petId,
  petName,
  petSpecies,
  onSaved,
}: ConsultationRecorderModalProps) {
  const recorder = useAudioRecorder();
  const processor = useProcessTranscript();

  const [phase, setPhase] = useState<Phase>('idle');
  const [summaryData, setSummaryData] = useState<ConsultationSummary | null>(null);
  const [finalTranscript, setFinalTranscript] = useState('');

  // Fallback: manual transcript input for unsupported browsers
  const [manualTranscript, setManualTranscript] = useState('');

  const handleStartRecording = useCallback(async () => {
    try {
      await recorder.start();
      setPhase('recording');
    } catch {
      toast.error('No se pudo acceder al microfono. Verifica los permisos del navegador.');
    }
  }, [recorder]);

  const handleStopAndProcess = useCallback(async () => {
    const transcript =
      recorder.transcript + (recorder.interimText ? ' ' + recorder.interimText : '');
    recorder.stop();

    if (transcript.trim().length < 20) {
      toast.error(
        'La transcripcion es muy corta. Habla mas durante la consulta o pega el texto manualmente.'
      );
      setPhase('idle');
      return;
    }

    setFinalTranscript(transcript.trim());
    setPhase('processing');

    const result = await processor.process({
      transcript: transcript.trim(),
      petName,
      petSpecies,
    });

    if (result) {
      setSummaryData(result);
      setPhase('summary');
    } else {
      toast.error(processor.error || 'Error al procesar la transcripcion');
      setPhase('idle');
    }
  }, [recorder, processor, petName, petSpecies]);

  const handleManualProcess = useCallback(async () => {
    if (manualTranscript.trim().length < 20) {
      toast.error('La transcripcion debe tener al menos 20 caracteres.');
      return;
    }

    setFinalTranscript(manualTranscript.trim());
    setPhase('processing');

    const result = await processor.process({
      transcript: manualTranscript.trim(),
      petName,
      petSpecies,
    });

    if (result) {
      setSummaryData(result);
      setPhase('summary');
    } else {
      toast.error(processor.error || 'Error al procesar la transcripcion');
      setPhase('idle');
    }
  }, [manualTranscript, processor, petName, petSpecies]);

  const handleClose = useCallback(() => {
    if (phase === 'recording') {
      recorder.reset();
    }
    processor.reset();
    setPhase('idle');
    setSummaryData(null);
    setFinalTranscript('');
    setManualTranscript('');
    onOpenChange(false);
  }, [phase, recorder, processor, onOpenChange]);

  const handleSaved = useCallback(() => {
    handleClose();
    onSaved?.();
  }, [handleClose, onSaved]);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
      title={phase === 'summary' ? 'Resumen de consulta' : 'Grabar consulta'}
      description={`Paciente: ${petName}${petSpecies ? ` (${petSpecies})` : ''}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* ============================================= */}
        {/* PHASE: IDLE / RECORDING                       */}
        {/* ============================================= */}
        {(phase === 'idle' || phase === 'recording') && (
          <>
            {recorder.browserSupported ? (
              <>
                {/* Recording controls */}
                <div className="flex flex-col items-center gap-3 py-4">
                  {phase === 'idle' ? (
                    <Button
                      size="lg"
                      onClick={handleStartRecording}
                      className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600"
                    >
                      <Mic className="h-7 w-7" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3">
                      {recorder.isPaused ? (
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={recorder.resume}
                          className="rounded-full h-14 w-14"
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={recorder.pause}
                          className="rounded-full h-14 w-14"
                        >
                          <Pause className="h-6 w-6" />
                        </Button>
                      )}
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleStopAndProcess}
                        className="rounded-full h-14 w-14"
                      >
                        <Square className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {phase === 'recording' && (
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          recorder.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                        }`}
                      />
                      <span className="font-mono text-base">
                        {formatDuration(recorder.duration)}
                      </span>
                      <span className="text-muted-foreground">
                        {recorder.isPaused ? 'Pausado' : 'Grabando...'}
                      </span>
                    </div>
                  )}

                  {phase === 'idle' && (
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Presiona para comenzar a grabar. La transcripcion aparece en tiempo real. El
                      audio no se almacena.
                    </p>
                  )}
                </div>

                {/* Live transcript area */}
                {phase === 'recording' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Transcripcion en vivo</Label>
                    <div className="p-3 bg-muted/50 rounded-lg min-h-[120px] max-h-[250px] overflow-y-auto text-sm">
                      {recorder.transcript || recorder.interimText ? (
                        <>
                          <span>{recorder.transcript}</span>
                          {recorder.interimText && (
                            <span className="text-muted-foreground italic">
                              {' '}
                              {recorder.interimText}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Esperando audio...</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stop & process button (prominent) */}
                {phase === 'recording' && (
                  <Button
                    onClick={handleStopAndProcess}
                    className="w-full h-11"
                    disabled={!recorder.transcript && !recorder.interimText}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Detener y procesar con IA
                  </Button>
                )}
              </>
            ) : (
              /* ---- Fallback: manual transcript ---- */
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Navegador sin soporte de voz</p>
                    <p className="text-xs mt-1">
                      Tu navegador no soporta transcripcion por voz. Usa Chrome o Edge para grabar,
                      o pega la transcripcion manualmente.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pega la transcripcion de la consulta</Label>
                  <Textarea
                    value={manualTranscript}
                    onChange={(e) => setManualTranscript(e.target.value)}
                    placeholder="Pega aqui el texto de la consulta..."
                    rows={8}
                  />
                </div>
                <Button
                  onClick={handleManualProcess}
                  className="w-full h-11"
                  disabled={manualTranscript.trim().length < 20}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Procesar con IA
                </Button>
              </div>
            )}
          </>
        )}

        {/* ============================================= */}
        {/* PHASE: PROCESSING                             */}
        {/* ============================================= */}
        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <div className="text-center">
              <p className="font-medium">Analizando consulta con IA...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Generando resumen estructurado de la consulta
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg max-h-32 overflow-y-auto text-xs text-muted-foreground w-full">
              {finalTranscript.slice(0, 500)}
              {finalTranscript.length > 500 && '...'}
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* PHASE: SUMMARY (editable)                     */}
        {/* ============================================= */}
        {phase === 'summary' && summaryData && (
          <ConsultationSummaryView
            summary={summaryData}
            rawTranscript={finalTranscript}
            shareTokenId={shareTokenId}
            providerId={providerId}
            petId={petId}
            petName={petName}
            onSaved={handleSaved}
          />
        )}

        {/* Cancel button (always visible except in summary, which has its own save) */}
        {phase !== 'summary' && (
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full"
            disabled={phase === 'processing'}
          >
            {phase === 'processing' ? 'Procesando...' : 'Cancelar'}
          </Button>
        )}
      </div>
    </ResponsiveModal>
  );
}
