/**
 * NosePrintCapture — captura biometrica de nariz para una mascota.
 *
 * Refactor Maestro Fase 1 §6.2 — Pilar 1 Trinidad del Corazon.
 *
 * Flujo:
 *   1. Solicita permiso de camara
 *   2. Renderiza video con overlay guía (circulo "centrá la nariz aquí")
 *   3. User toca "Capturar" → toma frame → muestra preview
 *   4. User toca "Guardar" → llama edge fn nose-print-embed
 *   5. onSuccess(nose_print_id) → parent decide qué hacer
 *
 * No usa modelo on-device (TFLite face detection) en este MVP — la
 * verificacion de calidad la hace el modelo grande server-side.
 *
 * Props:
 *   - petId, petName: contexto del pet
 *   - onSuccess: callback con el nose_print_id creado
 *   - onCancel: callback si el user abandona
 *   - allowSkip: si true, muestra boton "Saltar por ahora" (default true)
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Loader2, AlertTriangle, Check, X, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';
import { cn } from '@/lib/utils';
import { errorMessageForUser } from '@/lib/errors';

interface NosePrintCaptureProps {
  petId: string;
  petName: string;
  onSuccess?: (nosePrintId: string) => void;
  onCancel?: () => void;
  allowSkip?: boolean;
}

type Phase = 'intro' | 'requesting' | 'capturing' | 'review' | 'uploading' | 'done' | 'error';

interface CapturedFrame {
  base64: string; // sin prefijo data:
  preview: string; // dataURL para mostrar
}

export function NosePrintCapture({
  petId,
  petName,
  onSuccess,
  onCancel,
  allowSkip = true,
}: NosePrintCaptureProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frame, setFrame] = useState<CapturedFrame | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup stream al desmontar
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // Conectar stream al video
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const requestCamera = async () => {
    setError(null);
    setPhase('requesting');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setPhase('capturing');
      trackRefactor(RefactorEvent.nosePrintCaptureStarted, { pet_id: petId });
    } catch (err) {
      const msg = errorMessageForUser(err);
      setError(`No pudimos acceder a la cámara: ${msg}. Verificá permisos del navegador.`);
      setPhase('error');
    }
  };

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop al cuadrado central (donde está la guía visual del circulo)
    const size = Math.min(w, h);
    const sx = (w - size) / 2;
    const sy = (h - size) / 2;

    canvas.width = 512;
    canvas.height = 512;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    setFrame({ base64, preview: dataUrl });
    setPhase('review');

    // Cortar el stream una vez capturado
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const retake = async () => {
    setFrame(null);
    await requestCamera();
  };

  const upload = async () => {
    if (!frame) return;
    setPhase('uploading');
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No autenticado');

      const supabaseUrl =
        (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
        'https://gwailbjlvevkhwcrovfd.supabase.co';

      const res = await fetch(`${supabaseUrl}/functions/v1/nose-print-embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pet_id: petId,
          image_base64: frame.base64,
          set_as_primary: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { ok: boolean; nose_print_id: string };
      if (!json.ok || !json.nose_print_id) {
        throw new Error('Respuesta invalida del servidor');
      }

      trackRefactor(RefactorEvent.nosePrintCaptureSaved, {
        pet_id: petId,
        nose_print_id: json.nose_print_id,
      });

      toast.success(`Huella nasal de ${petName} guardada`);
      setPhase('done');
      onSuccess?.(json.nose_print_id);
    } catch (err) {
      const msg = errorMessageForUser(err);
      setError(`No pudimos guardar la huella: ${msg}`);
      setPhase('error');
    }
  };

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    onCancel?.();
  };

  // ──────────────────────────────────────────────────────────────────────
  // Render por fase
  // ──────────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Camera className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold">Huella nasal de {petName}</h3>
          <p className="text-sm text-muted-foreground">
            Cada mascota tiene una huella nasal única, como una huella digital. La usamos para
            identificar a {petName} si alguna vez se pierde.
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p>• Buscamos un primer plano de la nariz, bien iluminado.</p>
          <p>• {petName} debe estar quieta unos segundos.</p>
          <p>• La foto NO se publica en ningún lado, solo se usa para el matching.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={requestCamera} className="flex-1 gap-2">
            <Camera className="h-4 w-4" />
            Empezar captura
          </Button>
          {allowSkip && (
            <Button variant="outline" onClick={handleCancel}>
              Saltar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (phase === 'requesting') {
    return (
      <Card className="p-6 text-center space-y-3">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600" />
        <p className="text-sm text-muted-foreground">Pidiendo permiso de cámara…</p>
      </Card>
    );
  }

  if (phase === 'capturing') {
    return (
      <Card className="overflow-hidden">
        <div className="relative bg-black aspect-square">
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" aria-label="Buffer de captura" />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label={`Camara para huella nasal de ${petName}`}
            className="w-full h-full object-cover"
          >
            <track kind="captions" />
          </video>
          {/* Overlay guia: circulo donde centrar la nariz */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2/3 aspect-square rounded-full border-4 border-white/60 shadow-[0_0_0_999px_rgba(0,0,0,0.4)]" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow">
            Centrá la nariz de {petName} en el círculo
          </div>
        </div>
        <div className="p-4 flex gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={captureFrame} className="flex-1 gap-2">
            <Camera className="h-4 w-4" />
            Capturar
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === 'review' && frame) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-square bg-black flex items-center justify-center">
          <img src={frame.preview} alt="Captura" className="w-full h-full object-cover" />
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm font-medium text-center">¿Se ve bien la nariz?</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={retake} className="flex-1 gap-2">
              <RotateCw className="h-4 w-4" />
              Repetir
            </Button>
            <Button onClick={upload} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'uploading') {
    return (
      <Card className="p-6 text-center space-y-3">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600" />
        <p className="text-sm text-muted-foreground">Procesando huella biométrica…</p>
      </Card>
    );
  }

  if (phase === 'done') {
    return (
      <Card className="p-6 text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Huella guardada</h3>
        <p className="text-sm text-muted-foreground">
          {petName} tiene su huella nasal registrada. Si alguna vez se pierde, alguien que la
          encuentre puede identificarla con una foto de su nariz.
        </p>
      </Card>
    );
  }

  // error
  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn('h-5 w-5 shrink-0 text-amber-600 mt-0.5')} />
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium">No pudimos completar la captura</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCancel} className="flex-1 gap-2">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button
          onClick={() => {
            setError(null);
            setFrame(null);
            setPhase('intro');
          }}
          className="flex-1 gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </Card>
  );
}
