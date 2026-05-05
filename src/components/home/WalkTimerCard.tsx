/**
 * WalkTimerCard — boton "Empezar paseo" en home con GPS tracking en vivo.
 *
 * Estado idle: card con icono + boton primario.
 * Estado activo: timer en vivo (duracion + distancia) + botones Terminar/Cancelar.
 * Al terminar: toast con resumen ("X min · Y km") + queryClient.invalidate timeline.
 *
 * Permisos: la primera vez pide GPS al user. Si denied, muestra mensaje y oculta
 * la card en runs siguientes (TODO: persistir denial en localStorage para no
 * insistir).
 *
 * Ver hook useWalkSession para detalle del flujo.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Play, Square, AlertCircle, Loader2 } from '@/lib/icons';
import { toast } from 'sonner';
import { useWalkSession } from '@/hooks/useWalkSession';

interface WalkTimerCardProps {
  petId: string;
  petName: string;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function WalkTimerCard({ petId, petName }: WalkTimerCardProps) {
  const queryClient = useQueryClient();
  const { state, start, stop, cancel } = useWalkSession();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const handleStart = async () => {
    await start(petId);
  };

  const handleStop = async () => {
    const result = await stop();
    if (result) {
      const min = Math.round(result.durationSeconds / 60);
      const km = (result.distanceMeters / 1000).toFixed(2);
      toast.success(`Paseo guardado · ${min} min · ${km} km`, {
        description: `Quedó en la historia de ${petName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['pet-history-timeline', petId] });
      queryClient.invalidateQueries({ queryKey: ['pet-walk-stats', petId] });
    }
  };

  const handleCancelConfirm = async () => {
    setConfirmCancelOpen(false);
    await cancel();
    toast('Paseo cancelado');
  };

  if (state.isActive) {
    return (
      <>
        <Card className="p-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">
              Paseando con {petName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duración</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-900">
                {formatDuration(state.durationSeconds)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Distancia
              </p>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-900">
                {formatDistance(state.distanceMeters)}
              </p>
            </div>
          </div>

          {state.error && (
            <div className="flex items-start gap-2 p-2 mb-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleStop}
              disabled={state.isStopping}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {state.isStopping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4 fill-current" />
              )}
              Terminar
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmCancelOpen(true)}
              disabled={state.isStopping}
            >
              Cancelar
            </Button>
          </div>
        </Card>

        <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar el paseo?</AlertDialogTitle>
              <AlertDialogDescription>
                Si cancelás, no se guarda en la historia de {petName}. Los{' '}
                {Math.round(state.durationSeconds / 60)} min y{' '}
                {formatDistance(state.distanceMeters)} se descartan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Seguir paseando</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sí, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Sacar a pasear a {petName}</p>
          <p className="text-xs text-muted-foreground">
            Tiempo + distancia con GPS, queda en su historia.
          </p>
        </div>
      </div>

      {state.error && (
        <div className="flex items-start gap-2 p-2 mt-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <Button
        onClick={handleStart}
        disabled={state.isStarting}
        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 gap-2"
      >
        {state.isStarting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando GPS…
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            Empezar paseo
          </>
        )}
      </Button>
    </Card>
  );
}
