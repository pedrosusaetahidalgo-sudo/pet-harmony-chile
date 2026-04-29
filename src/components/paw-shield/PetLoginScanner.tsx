/**
 * PetLoginScanner — "Pet Login" #7 RICE 180.
 *
 * Spec docs-raiz/PAW_SHIELD_IDEAS_BANK.md §7:
 *   El dueño abre la app, escanea hocico → se abre directo la ficha del pet
 *   (sin elegir de lista). UX delight para multi-pet owners.
 *
 * Logica:
 *   1. Pide camara, captura 1 foto (no video — esto NO es enrollment).
 *   2. Llama paw-shield-identify (publico, no requiere auth body).
 *   3. Cruza match.pet_id contra mascotas del user (cliente).
 *   4. Si match >=95 + cruza con pet del user → navigate a /ficha/{petId}.
 *   5. Si match 80-94 → muestra "¿es {name}?" con foto + confirmar.
 *   6. Si no match o no es del user → toast + cierra.
 *
 * Solo se monta si:
 *   - Flag PAW_SHIELD_PETIFY=true.
 *   - User tiene >=2 mascotas con petify_pet_id (con 1 sola no aporta).
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Loader2, X, Check, ScanLine } from '@/lib/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface IdentifyMatch {
  pet_id: string | null;
  pet_name: string;
  pet_photo_url: string | null;
  species: string;
  score: number;
  comuna?: string | null;
  _petify_id?: string;
}

interface IdentifyResponse {
  status: 'match' | 'ambiguous' | 'no_match' | 'service_error';
  matches?: IdentifyMatch[];
  gap?: number;
  message?: string;
}

interface OwnedPet {
  id: string;
  name: string;
  petify_pet_id: string | null;
}

const HIGH_CONFIDENCE = 95;
const MIN_CONFIDENCE = 80;

interface PetLoginScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mascotas del user logueado para cruzar match con ownership. */
  ownedPets: OwnedPet[];
}

type Phase = 'requesting' | 'ready' | 'capturing' | 'processing' | 'confirming';

export function PetLoginScanner({ open, onOpenChange, ownedPets }: PetLoginScannerProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('requesting');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<IdentifyMatch | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup stream al cerrar.
  useEffect(() => {
    if (!open && stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setPhase('requesting');
      setConfirmCandidate(null);
    }
  }, [open, stream]);

  // Pedir camara al abrir.
  useEffect(() => {
    if (!open) return;
    if (stream) return;
    let cancelled = false;
    (async () => {
      setPhase('requesting');
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          ms.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(ms);
        setPhase('ready');
      } catch (err) {
        logger.error('[PetLogin] camera denied', err);
        toast.error('No pudimos acceder a la camara', {
          description: 'Revisa permisos en tu navegador.',
        });
        onOpenChange(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, stream, onOpenChange]);

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const captureAndIdentify = async () => {
    if (!videoRef.current || !stream) return;
    setPhase('capturing');

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('No pudimos capturar la foto');
      setPhase('ready');
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhase('processing');

    // canvas → base64 JPEG.
    const base64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      // Inferir especie del cohort de pets del user (asumimos DOG si mayoritario).
      // Si tiene mix, default DOG. Si fuera necesario podriamos pedir al user.
      const dogCount = ownedPets.length; // placeholder, no tenemos species aqui
      void dogCount;
      const species: 'DOG' | 'CAT' = 'DOG';

      const { data, error } = await supabase.functions.invoke('paw-shield-identify', {
        body: { species, image_base64: base64 },
      });

      if (error) throw error;
      const resp = data as IdentifyResponse;

      if (resp.status === 'no_match' || !resp.matches || resp.matches.length === 0) {
        toast.info('No encontramos coincidencia', {
          description: 'Probemos con mejor luz o de mas cerca.',
        });
        setPhase('ready');
        return;
      }

      if (resp.status === 'service_error') {
        toast.error('Servicio biometrico no disponible', {
          description: 'Intenta en unos minutos.',
        });
        setPhase('ready');
        return;
      }

      // Buscar el primer match que sea pet del user (ownership match).
      const ownedIds = new Set(ownedPets.map((p) => p.id));
      const ownedMatch = resp.matches.find((m) => m.pet_id && ownedIds.has(m.pet_id));

      if (!ownedMatch) {
        toast.info('Esta mascota no esta en tu cuenta', {
          description:
            'Encontramos un match pero no es tuya. Si estas buscando una mascota perdida, prueba /nose-scan.',
        });
        setPhase('ready');
        return;
      }

      // Match alto + ownership → navigate directo.
      if (ownedMatch.score >= HIGH_CONFIDENCE) {
        toast.success(`Abriendo ficha de ${ownedMatch.pet_name}`);
        onOpenChange(false);
        navigate(`/ficha/${ownedMatch.pet_id}`);
        return;
      }

      // Match medio → confirmar.
      if (ownedMatch.score >= MIN_CONFIDENCE) {
        setConfirmCandidate(ownedMatch);
        setPhase('confirming');
        return;
      }

      // Match bajo → reintenta.
      toast.info('Match poco confiable', {
        description: 'Intenta con foto mas nitida del hocico.',
      });
      setPhase('ready');
    } catch (err) {
      logger.error('[PetLogin] identify fallo', err);
      toast.error('Error al identificar', {
        description: err instanceof Error ? err.message : 'Reintenta.',
      });
      setPhase('ready');
    }
  };

  const acceptConfirm = () => {
    if (!confirmCandidate?.pet_id) return;
    onOpenChange(false);
    navigate(`/ficha/${confirmCandidate.pet_id}`);
  };

  const rejectConfirm = () => {
    setConfirmCandidate(null);
    setPhase('ready');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 text-purple-600" />
            Buscar mi mascota
          </DialogTitle>
        </DialogHeader>

        {phase === 'confirming' && confirmCandidate ? (
          <Card className="m-3 mt-2 border-amber-300 bg-amber-50">
            <CardContent className="p-4 text-center space-y-3">
              {confirmCandidate.pet_photo_url && (
                <img
                  src={confirmCandidate.pet_photo_url}
                  alt={confirmCandidate.pet_name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow"
                />
              )}
              <p className="font-semibold text-lg">¿Es {confirmCandidate.pet_name}?</p>
              <p className="text-xs text-muted-foreground">
                Match {confirmCandidate.score}/100. Confirma para abrir su ficha.
              </p>
              <div className="flex gap-2 pt-1">
                <Button onClick={rejectConfirm} variant="outline" className="flex-1">
                  <X className="h-4 w-4 mr-1.5" /> No
                </Button>
                <Button
                  onClick={acceptConfirm}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Check className="h-4 w-4 mr-1.5" /> Sí
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative bg-black aspect-square">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Vista previa de camara para login con huella nasal"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 rounded-full border-4 border-white/60 shadow-lg" />
              </div>
              {(phase === 'capturing' || phase === 'processing') && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <p className="text-sm text-white">
                    {phase === 'capturing' ? 'Capturando...' : 'Identificando...'}
                  </p>
                </div>
              )}
              {phase === 'requesting' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Apunta al hocico de tu mascota. Si la reconocemos abrimos su ficha directo.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={captureAndIdentify}
                  disabled={phase !== 'ready'}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Camera className="h-4 w-4 mr-1.5" />
                  Capturar
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
