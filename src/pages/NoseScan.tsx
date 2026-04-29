/**
 * /nose-scan — Pagina publica para identificar una mascota perdida via huella nasal.
 *
 * Refactor Maestro Fase 1 §6.2 — Pilar 1 Trinidad del Corazon.
 *
 * Flujo:
 *   1. Quien encuentra una mascota abre /nose-scan (sin login)
 *   2. Saca foto de la nariz con la camara o sube una desde galeria
 *   3. Edge fn nose-print-match calcula similarity y devuelve top-3
 *   4. Si hay match con consent (lost_at IS NOT NULL), revela contacto
 *   5. Si hay match sin consent, sugiere escribir a hola@pawfriend.cl
 *   6. Si no hay match, sugiere reportar la mascota encontrada en otro flujo
 *
 * Acceso publico (verify_jwt=false en la edge fn). No hay login requerido.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, AlertTriangle, Phone, ArrowLeft, RotateCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';
import { cn } from '@/lib/utils';
import { errorMessageForUser } from '@/lib/errors';

type Phase = 'intro' | 'capturing' | 'review' | 'searching' | 'results' | 'error';

interface MatchResult {
  pet_id: string;
  similarity: number;
  pet: {
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
  };
  lost: boolean;
  owner_contact?: { type: 'phone' | 'email'; value: string };
  message: string;
}

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://gwailbjlvevkhwcrovfd.supabase.co';

export default function NoseScan() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flagEnabled = isFeatureEnabled('NOSE_PRINT_PUBLIC_SCAN');

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const requestCamera = async () => {
    setError(null);
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
    } catch {
      setError('No pudimos acceder a la cámara. Probá subir una foto desde galería.');
      setPhase('error');
    }
  };

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const size = Math.min(w, h);
    const sx = (w - size) / 2;
    const sy = (h - size) / 2;

    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl.replace(/^data:image\/jpeg;base64,/, ''));
    setPhase('review');

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.replace(/^data:[^;]+;base64,/, ''));
      setPhase('review');
    };
    reader.readAsDataURL(file);
  };

  const search = async () => {
    if (!imageBase64) return;
    setPhase('searching');
    setError(null);

    trackRefactor(RefactorEvent.nosePrintMatchAttempted);

    try {
      // Paw Shield · Petify (2026-04-29). Reemplaza el modelo propio DINOv2.
      // Test interno: 100% top-1 con 3 fotos registradas por pet.
      const res = await fetch(`${SUPABASE_URL}/functions/v1/paw-shield-identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          species: 'DOG', // TODO: detectar especie desde la foto o pedir al usuario
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as {
        status: 'match' | 'ambiguous' | 'no_match' | 'service_error';
        matches?: Array<{
          pet_id: string;
          pet_name: string;
          pet_photo_url: string | null;
          species: string;
          score: number;
          comuna?: string | null;
        }>;
      };

      // Adaptamos la nueva respuesta al MatchResult legacy del UI.
      const found: MatchResult[] = (json.matches ?? []).map((m) => ({
        pet_id: m.pet_id,
        similarity: m.score / 100, // Petify devuelve 0-100, UI legacy usa 0-1
        pet: {
          name: m.pet_name,
          species: m.species,
          breed: null,
          photo_url: m.pet_photo_url,
        },
        lost: false, // hint: requiere cruzar con lost_pets en una iteracion futura
        message:
          json.status === 'ambiguous'
            ? 'Hay varias mascotas parecidas. Revisa cada una.'
            : 'Encontramos una coincidencia.',
      }));
      setMatches(found);

      if (found.length > 0) {
        trackRefactor(RefactorEvent.nosePrintMatchFound, {
          count: found.length,
          top_similarity: found[0]?.similarity,
        });
      } else {
        trackRefactor(RefactorEvent.nosePrintMatchNotFound);
      }

      setPhase('results');
    } catch (err) {
      const msg = errorMessageForUser(err);
      setError(`No pudimos buscar: ${msg}`);
      setPhase('error');
    }
  };

  const reset = () => {
    setImageBase64(null);
    setImagePreview(null);
    setMatches([]);
    setError(null);
    setPhase('intro');
  };

  if (!flagEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold">Próximamente</h1>
          <p className="text-sm text-muted-foreground">
            El escáner público de huella nasal estará disponible pronto. Si encontraste una mascota
            perdida, escríbenos a hola@pawfriend.cl.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Identificar mascota perdida · Paw Friend</title>
        <meta
          name="description"
          content="Encontraste una mascota perdida? Sacale una foto de la nariz y nosotros buscamos a su dueño en nuestra base de huellas biométricas."
        />
      </Helmet>

      <header className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-base font-semibold">Identificar mascota perdida</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {phase === 'intro' && (
          <Card className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">¿Encontraste una mascota?</h2>
              <p className="text-sm text-muted-foreground">
                Sacale una foto de la nariz y buscamos en nuestra base de huellas biométricas. Si
                está registrada y reportada como perdida, te conectamos con su dueño.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={requestCamera} className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Sacar foto con cámara
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                Subir desde galería
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Subir foto de huella nasal"
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Solo usamos la foto para el matching. No la guardamos.
            </p>
          </Card>
        )}

        {phase === 'capturing' && (
          <Card className="overflow-hidden">
            <div className="relative bg-black aspect-square">
              <canvas ref={canvasRef} className="hidden" aria-label="Captura de huella nasal" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Vista de camara para escanear huella nasal"
                className="w-full h-full object-cover"
              >
                <track kind="captions" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2/3 aspect-square rounded-full border-4 border-white/60 shadow-[0_0_0_999px_rgba(0,0,0,0.4)]" />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow">
                Centrá la nariz en el círculo
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={capture} className="flex-1 gap-2">
                <Camera className="h-4 w-4" />
                Capturar
              </Button>
            </div>
          </Card>
        )}

        {phase === 'review' && imagePreview && (
          <Card className="overflow-hidden">
            <div className="aspect-square bg-black flex items-center justify-center">
              <img src={imagePreview} alt="Captura" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="flex-1 gap-2">
                  <RotateCw className="h-4 w-4" />
                  Otra
                </Button>
                <Button onClick={search} className="flex-1 gap-2">
                  <Search className="h-4 w-4" />
                  Buscar match
                </Button>
              </div>
            </div>
          </Card>
        )}

        {phase === 'searching' && (
          <Card className="p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Buscando coincidencias…</p>
          </Card>
        )}

        {phase === 'results' && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <Card className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                  <Search className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold">Sin coincidencias</h2>
                <p className="text-sm text-muted-foreground">
                  No encontramos esta mascota en nuestra base. Probá sacar otra foto con mejor luz,
                  o reportala como mascota encontrada para ayudar a quien la busque.
                </p>
                <Button onClick={reset} variant="outline" className="gap-2">
                  <RotateCw className="h-4 w-4" />
                  Probar de nuevo
                </Button>
              </Card>
            ) : (
              <>
                <h2 className="text-base font-semibold">
                  Encontramos {matches.length}{' '}
                  {matches.length === 1 ? 'coincidencia' : 'coincidencias'}
                </h2>
                {matches.map((m) => (
                  <Card key={m.pet_id} className="p-4 space-y-3">
                    <div className="flex gap-3">
                      {m.pet.photo_url && (
                        <img
                          src={m.pet.photo_url}
                          alt={m.pet.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{m.pet.name}</h3>
                          {m.lost && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                              Perdida
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.pet.species}
                          {m.pet.breed ? ` · ${m.pet.breed}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Match: {Math.round(m.similarity * 100)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-sm">{m.message}</p>
                    {m.owner_contact && (
                      <a
                        href={
                          m.owner_contact.type === 'phone'
                            ? `tel:${m.owner_contact.value}`
                            : `mailto:${m.owner_contact.value}`
                        }
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-800 rounded-md text-sm font-medium"
                      >
                        <Phone className="h-4 w-4" />
                        Llamar al dueño
                      </a>
                    )}
                  </Card>
                ))}
                <Button onClick={reset} variant="outline" className="w-full gap-2">
                  <RotateCw className="h-4 w-4" />
                  Buscar otra mascota
                </Button>
              </>
            )}
          </div>
        )}

        {phase === 'error' && (
          <Card className="p-6 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className={cn('h-5 w-5 shrink-0 text-amber-600 mt-0.5')} />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Algo salió mal</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button onClick={reset} className="w-full gap-2">
              <RotateCw className="h-4 w-4" />
              Reintentar
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
