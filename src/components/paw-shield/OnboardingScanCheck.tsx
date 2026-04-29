/**
 * OnboardingScanCheck — Step 0 opcional en /add-pet (Onboarding express).
 *
 * #1 RICE 168 (docs-raiz/PAW_SHIELD_IDEAS_BANK.md):
 *   Antes de crear mascota nueva, ofrecemos escanear hocico para detectar
 *   duplicados. Si ya esta en la base (otro dueno, mismo user, o sistema):
 *     - Score >= 95 → "Esta mascota ya esta registrada. Contactanos a soporte
 *       para iniciar transferencia."
 *     - Score 80-94 → "Encontramos algo parecido. ¿Es esta mascota?"
 *     - Sin match → seguir al wizard tradicional (skip).
 *
 * Solo se muestra si flag PAW_SHIELD_PETIFY=true. Si flag=false, el componente
 * llama a onSkip() inmediatamente al montar.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Loader2, ScanLine, ArrowRight, AlertTriangle } from '@/lib/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { logger } from '@/lib/logger';

interface IdentifyMatch {
  pet_id: string | null;
  pet_name: string;
  pet_photo_url: string | null;
  score: number;
}

interface IdentifyResponse {
  status: 'match' | 'ambiguous' | 'no_match' | 'service_error';
  matches?: IdentifyMatch[];
  message?: string;
}

const HIGH = 95;
const MIN = 80;

interface OnboardingScanCheckProps {
  /** Llamar cuando el flow debe avanzar al wizard tradicional. */
  onSkip: () => void;
  /** Llamar cuando se detecta duplicado. UI puede mostrar mensaje al user. */
  onDuplicate?: (match: IdentifyMatch) => void;
}

type Phase =
  | 'intro'
  | 'requesting'
  | 'ready'
  | 'capturing'
  | 'processing'
  | 'duplicate'
  | 'ambiguous';

export function OnboardingScanCheck({ onSkip, onDuplicate }: OnboardingScanCheckProps) {
  // Si flag off, hacer skip inmediato (no mostramos nada).
  useEffect(() => {
    if (!isFeatureEnabled('PAW_SHIELD_PETIFY')) {
      onSkip();
    }
  }, [onSkip]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<IdentifyMatch | null>(null);
  const [ambiguousMatch, setAmbiguousMatch] = useState<IdentifyMatch | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const requestCamera = async () => {
    setPhase('requesting');
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(ms);
      setPhase('ready');
    } catch (err) {
      logger.error('[OnboardingScan] camera denied', err);
      toast.error('No pudimos acceder a la camara', {
        description: 'Continuemos sin scan.',
      });
      onSkip();
    }
  };

  const captureAndCheck = async () => {
    if (!videoRef.current || !stream) return;
    setPhase('capturing');

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Error al capturar');
      setPhase('ready');
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhase('processing');

    const base64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const { data, error } = await supabase.functions.invoke('paw-shield-identify', {
        body: { species: 'DOG', image_base64: base64 },
      });
      if (error) throw error;
      const resp = data as IdentifyResponse;

      if (resp.status === 'service_error' || resp.status === 'no_match' || !resp.matches?.length) {
        // No hay duplicado — seguir al wizard tradicional.
        toast.info('Mascota nueva', { description: 'Sigamos creando su perfil.' });
        cleanup();
        onSkip();
        return;
      }

      const top = resp.matches[0];

      if (top.score >= HIGH) {
        setDuplicateMatch(top);
        setPhase('duplicate');
        onDuplicate?.(top);
        return;
      }

      if (top.score >= MIN) {
        setAmbiguousMatch(top);
        setPhase('ambiguous');
        return;
      }

      // Score bajo: no es duplicado.
      cleanup();
      onSkip();
    } catch (err) {
      logger.error('[OnboardingScan] identify fallo', err);
      toast.error('Error al verificar', {
        description: 'Continuemos sin scan.',
      });
      cleanup();
      onSkip();
    }
  };

  const cleanup = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  if (phase === 'intro') {
    return (
      <Card className="max-w-md mx-auto border-purple-200">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <ScanLine className="h-12 w-12 mx-auto text-purple-600" />
            <h2 className="text-xl font-bold">¿Tu mascota ya tiene perfil?</h2>
            <p className="text-sm text-muted-foreground">
              Antes de crearle uno nuevo, podemos verificar escaneando su hocico (3 segundos). Asi
              evitamos duplicados.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={requestCamera} className="w-full bg-purple-600 hover:bg-purple-700">
              <Camera className="h-4 w-4 mr-1.5" />
              Verificar con scan
            </Button>
            <Button onClick={onSkip} variant="ghost" className="w-full text-muted-foreground">
              Saltar y crear nuevo
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'duplicate' && duplicateMatch) {
    return (
      <Card className="max-w-md mx-auto border-amber-300 bg-amber-50">
        <CardContent className="p-6 space-y-4 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-600" />
          <h2 className="text-lg font-bold">Esta mascota ya esta registrada</h2>
          <p className="text-sm text-muted-foreground">
            Encontramos un perfil con biometria muy parecida (match {duplicateMatch.score}/100). Si
            es tuya, escribinos a <strong>pawfriendcl@gmail.com</strong> para iniciar la
            transferencia.
          </p>
          <Button onClick={onSkip} variant="outline" className="w-full">
            Crear perfil nuevo igual
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'ambiguous' && ambiguousMatch) {
    return (
      <Card className="max-w-md mx-auto border-blue-300 bg-blue-50">
        <CardContent className="p-6 space-y-4 text-center">
          {ambiguousMatch.pet_photo_url && (
            <img
              src={ambiguousMatch.pet_photo_url}
              alt={ambiguousMatch.pet_name}
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow"
            />
          )}
          <h2 className="text-lg font-bold">Encontramos algo parecido</h2>
          <p className="text-sm text-muted-foreground">
            ¿Es {ambiguousMatch.pet_name}? Match {ambiguousMatch.score}/100.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAmbiguousMatch(null);
                setPhase('ready');
              }}
              variant="outline"
              className="flex-1"
            >
              No, es otra mascota
            </Button>
            <Button
              onClick={() => {
                toast.info('Contactanos para transferencia', {
                  description: 'pawfriendcl@gmail.com',
                });
                cleanup();
                onSkip();
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Si, es la mia
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ready / capturing / processing / requesting
  return (
    <Card className="max-w-md mx-auto overflow-hidden">
      <div className="relative bg-black aspect-square">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-44 h-44 rounded-full border-4 border-white/60 shadow-lg" />
        </div>
        {(phase === 'capturing' || phase === 'processing') && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-sm text-white">
              {phase === 'capturing' ? 'Capturando...' : 'Verificando...'}
            </p>
          </div>
        )}
        {phase === 'requesting' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          Apunta al hocico. Si ya esta registrada, te avisamos.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              cleanup();
              onSkip();
            }}
            variant="outline"
            className="flex-1"
          >
            Saltar
          </Button>
          <Button
            onClick={captureAndCheck}
            disabled={phase !== 'ready'}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Camera className="h-4 w-4 mr-1.5" /> Capturar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
