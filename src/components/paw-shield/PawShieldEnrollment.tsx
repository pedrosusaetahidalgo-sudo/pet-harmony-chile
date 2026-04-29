/**
 * PawShieldEnrollment — Captura biometrica de hocico estilo "banco".
 *
 * Flow:
 *   1. Usuario presiona "Activar Paw Shield"
 *   2. Pide permiso de camara
 *   3. Muestra preview en vivo + circulo guia
 *   4. Al presionar [Grabar], graba 3 segundos (countdown 3-2-1)
 *   5. Al terminar: extrae 3 frames (t=0.5, 1.5, 2.5)
 *   6. Mide sharpness de cada frame:
 *      - Si los 3 son OK → sube a paw-shield-register
 *      - Si 1 o mas borrosos → toast "salieron borrosas, intenta otra vez"
 *      - Despues de 3 retries → marca nose_print_pending=true + cierra
 *   7. Backend devuelve status: registered / duplicate_detected / ambiguous_match
 *   8. UI reacciona: success / abre claim flow / muestra top-3 candidates
 *
 * El hocico se mueve, asi que NO requerimos perfecto encuadre — confiamos en
 * que con 3 frames tomados a tiempos distintos al menos 2 quedaran bien.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Loader2, ShieldCheck, AlertTriangle, RefreshCw } from '@/lib/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  extractFramesAtTimes,
  frameToJpegBase64,
  SHARPNESS_THRESHOLD,
  type ExtractedFrame,
} from '@/lib/videoFrameExtractor';

type Phase =
  | 'intro'
  | 'requesting_camera'
  | 'ready'
  | 'recording'
  | 'processing'
  | 'uploading'
  | 'success'
  | 'duplicate'
  | 'ambiguous'
  | 'low_quality'
  | 'error';

interface PawShieldEnrollmentProps {
  petId: string;
  petName: string;
  petSpecies: 'DOG' | 'CAT';
  petBreed?: string;
  onSuccess?: (petifyPetId: string) => void;
  onClose?: () => void;
}

const RECORDING_DURATION_MS = 3000;
const FRAME_TIMES = [0.5, 1.5, 2.5]; // segundos

interface RegisterResponse {
  status:
    | 'registered'
    | 'already_registered'
    | 'duplicate_detected'
    | 'ambiguous_match'
    | 'failed'
    | 'partial_failure'
    | 'low_quality';
  petify_pet_id?: string;
  fingerprint_count?: number;
  quality?: 'high' | 'low';
  existing_petify_pet_id?: string;
  candidates?: Array<{ id: string; score: number; metadata: string }>;
  message?: string;
  error?: string;
}

export function PawShieldEnrollment({
  petId,
  petName,
  petSpecies,
  petBreed,
  onSuccess,
  onClose,
}: PawShieldEnrollmentProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [retries, setRetries] = useState(0);
  const [response, setResponse] = useState<RegisterResponse | null>(null);
  const [archiveConsent, setArchiveConsent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup al desmontar.
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const requestCamera = async () => {
    setPhase('requesting_camera');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // camara trasera por defecto
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setPhase('ready');
    } catch (err) {
      logger.error('[PawShield] camera permission denied', err);
      toast.error('No pudimos acceder a la camara', {
        description: 'Revisa los permisos en tu navegador.',
      });
      setPhase('intro');
    }
  };

  const register = useMutation({
    mutationFn: async (frames: ExtractedFrame[]) => {
      const images_base64 = frames.map((f) => frameToJpegBase64(f.canvas, 0.85));
      const sharpness_per_frame = frames.map((f) => f.sharpness);
      const { data, error } = await supabase.functions.invoke('paw-shield-register', {
        body: {
          pet_id: petId,
          species: petSpecies,
          breed: petBreed,
          images_base64,
          sharpness_per_frame,
          archive_consent: archiveConsent,
        },
      });
      if (error) throw error;
      return data as RegisterResponse;
    },
    onSuccess: (data) => {
      setResponse(data);
      switch (data.status) {
        case 'registered':
        case 'already_registered':
          setPhase('success');
          toast.success('Paw Shield activado', {
            description: `${petName} esta protegido biometricamente.`,
          });
          if (data.petify_pet_id) onSuccess?.(data.petify_pet_id);
          break;
        case 'duplicate_detected':
          setPhase('duplicate');
          break;
        case 'ambiguous_match':
          setPhase('ambiguous');
          break;
        case 'failed':
        case 'partial_failure':
        case 'low_quality':
        default:
          setPhase('error');
          toast.error('No pudimos activar Paw Shield', {
            description: data.message ?? data.error,
          });
      }
    },
    onError: (err) => {
      logger.error('[PawShield] register failed', err);
      setPhase('error');
      toast.error('Error al activar Paw Shield', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      });
    },
  });

  const startRecording = () => {
    if (!stream) return;
    setPhase('recording');
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      setPhase('processing');
      const videoBlob = new Blob(chunksRef.current, { type: mimeType });
      try {
        const frames = await extractFramesAtTimes(videoBlob, FRAME_TIMES);
        // Filtrar borrosos.
        const sharp = frames.filter((f) => f.sharpness >= SHARPNESS_THRESHOLD);
        if (sharp.length < 2) {
          // <2 nitidos = mala captura.
          logger.debug(
            '[PawShield] sharpness low',
            frames.map((f) => f.sharpness)
          );
          setRetries((r) => r + 1);
          if (retries + 1 >= 3) {
            // 3 intentos fallidos: marcar pending y cerrar.
            setPhase('low_quality');
          } else {
            toast.warning('Las fotos salieron borrosas', {
              description: `Intento ${retries + 1}/3. Mantén estable y con buena luz.`,
            });
            setPhase('ready');
          }
          return;
        }
        // Subir los mejores frames (top-3 sharpest, max 3).
        const top3 = [...frames].sort((a, b) => b.sharpness - a.sharpness).slice(0, 3);
        setPhase('uploading');
        register.mutate(top3);
      } catch (err) {
        logger.error('[PawShield] frame extraction failed', err);
        setPhase('error');
        toast.error('Error procesando el video');
      }
    };

    recorder.start();
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, RECORDING_DURATION_MS);
  };

  const reset = () => {
    setRetries(0);
    setResponse(null);
    setPhase('ready');
  };

  const close = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    onClose?.();
  };

  // ── Renders ────────────────────────────────────────────────────────

  if (phase === 'success' && response) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <ShieldCheck className="h-16 w-16 mx-auto text-green-600" />
          <h2 className="text-xl font-bold">Paw Shield activo</h2>
          <p className="text-sm text-muted-foreground">
            {petName} esta protegido biometricamente con{' '}
            <strong>{response.fingerprint_count}</strong> huellas registradas.
          </p>
          {response.quality === 'low' && (
            <p className="text-xs text-amber-600">
              Captura solo {response.fingerprint_count} foto. Recomendamos repetir cuando puedas
              para mejorar la precision.
            </p>
          )}
          <Button onClick={close} className="w-full">
            Listo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'duplicate' && response) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
          <h2 className="text-lg font-bold text-center">Esta mascota ya esta registrada</h2>
          <p className="text-sm text-muted-foreground text-center">
            {response.message ?? 'Encontramos una mascota con biometria muy parecida.'}
          </p>
          <p className="text-xs text-center bg-amber-50 p-3 rounded">
            Si crees que es tu mascota, escribi a soporte para iniciar el proceso de transferencia
            con el dueno actual.
          </p>
          <Button onClick={close} variant="outline" className="w-full">
            Entendido
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'ambiguous' && response?.candidates) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-blue-500" />
          <h2 className="text-lg font-bold text-center">Encontramos mascotas parecidas</h2>
          <p className="text-sm text-muted-foreground text-center">
            {response.message ??
              'Hay varias mascotas con biometria similar (probablemente hermanos).'}
          </p>
          <div className="text-xs text-muted-foreground text-center">
            Top {response.candidates.length} matches: scores{' '}
            {response.candidates.map((c) => c.score).join(', ')}.
          </div>
          <p className="text-xs text-center bg-blue-50 p-3 rounded">
            Para evitar confusion, te pediremos mas fotos en otro momento. Por ahora tu mascota
            queda sin Paw Shield.
          </p>
          <Button onClick={close} variant="outline" className="w-full">
            Cerrar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'low_quality') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-bold">Probemos en otro momento</h2>
          <p className="text-sm text-muted-foreground">
            No logramos una captura nitida. Lo intentamos de nuevo cuando {petName} este mas
            tranquilo (despues de comer o jugar suele funcionar).
          </p>
          <Button onClick={close} variant="outline" className="w-full">
            Cerrar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'intro') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <ShieldCheck className="h-16 w-16 mx-auto text-purple-600" />
          <h2 className="text-xl font-bold text-center">Activar Paw Shield para {petName}</h2>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>Si {petName} se pierde, otros pueden encontrarlo escaneando su hocico.</li>
            <li>Solo necesitamos un video de 3 segundos del hocico.</li>
            <li>Sin costo. Sin que {petName} tenga que aprender nada.</li>
          </ul>

          <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
            <Checkbox
              id="archive-consent"
              checked={archiveConsent}
              onCheckedChange={(v) => setArchiveConsent(v === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="archive-consent"
              className="text-xs leading-relaxed cursor-pointer text-muted-foreground"
            >
              Quiero ayudar a Paw Friend a mejorar la identificacion de mascotas chilenas. Las
              imagenes se conservan <strong>anonimizadas</strong> (sin tu nombre ni telefono) para
              entrenar nuestro proximo modelo. Podes revocar este permiso en cualquier momento desde
              tu perfil.
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={close} variant="outline" className="flex-1">
              Despues
            </Button>
            <Button onClick={requestCamera} className="flex-1">
              Comenzar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ready / recording / processing / uploading
  return (
    <Card className="max-w-md mx-auto overflow-hidden">
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Vista previa de camara para enrollment de huella nasal"
          className="w-full h-full object-cover"
        />
        {/* Circulo guia */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full border-4 border-white/60 shadow-lg" />
        </div>
        {/* Overlay segun phase */}
        {phase === 'recording' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Grabando 3 seg
          </div>
        )}
        {(phase === 'processing' || phase === 'uploading') && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-sm text-white">
              {phase === 'processing' ? 'Procesando video' : 'Activando Paw Shield'}
            </p>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          Acerca el celular al hocico de {petName} y manten estable 3 segundos.
        </p>
        {phase === 'ready' && (
          <div className="flex gap-2">
            <Button onClick={close} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={startRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Camera className="h-4 w-4 mr-1.5" />
              Grabar 3 seg
            </Button>
          </div>
        )}
        {phase === 'error' && (
          <Button onClick={reset} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Reintentar
          </Button>
        )}
        {retries > 0 && phase === 'ready' && (
          <p className="text-xs text-amber-600 text-center">Intento {retries + 1} de 3</p>
        )}
      </CardContent>
    </Card>
  );
}
