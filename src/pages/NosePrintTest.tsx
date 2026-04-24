/**
 * NosePrintTest — pagina publica de captura guiada de fotos de nariz
 *
 * Distribuible via link a amigos/testers para crowdsourcing del dataset
 * con protocolo estandarizado (mas consistencia que fotos de WhatsApp).
 *
 * Ruta: /nose-print-test (PUBLICA, no requiere login)
 *
 * Flujo:
 * 1. Form inicial: datos del dueño + mascota
 * 2. Captura guiada con webcam:
 *    - Permiso de camara
 *    - Overlay circular centrando la nariz
 *    - 3 fases: frontal / perfil / cerca
 *    - ~9-15 frames auto-capturados
 * 3. Preview de fotos + confirmar
 * 4. Upload a Supabase Storage + crear fila en nose_print_test_sessions
 * 5. Mensaje de agradecimiento
 *
 * No hay persistencia local mas alla del form. Al cerrar la pestaña se
 * pierde. Deliberado: queremos dataset para entrenar, no retener user.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Camera, Check, Heart, AlertCircle, RefreshCw, Upload } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Phase =
  | 'form'
  | 'permission'
  | 'capture_frontal'
  | 'capture_left'
  | 'capture_right'
  | 'review'
  | 'uploading'
  | 'done';

const FRAMES_PER_PHASE = 3; // 3 frontales + 3 izquierda + 3 derecha = 9 frames totales
const CAPTURE_INTERVAL_MS = 800; // Tiempo entre frames dentro de una fase

interface FormData {
  owner_name: string;
  owner_email: string;
  owner_location: string;
  pet_name: string;
  pet_species: 'perro' | 'gato' | 'otro';
  pet_breed: string;
  pet_age_months: string;
  pet_sex: 'macho' | 'hembra' | 'desconocido';
}

interface CapturedFrame {
  blob: Blob;
  dataUrl: string;
  phase: string;
  timestamp: number;
}

export default function NosePrintTest() {
  const [phase, setPhase] = useState<Phase>('form');
  const [formData, setFormData] = useState<FormData>({
    owner_name: '',
    owner_email: '',
    owner_location: '',
    pet_name: '',
    pet_species: 'perro',
    pet_breed: '',
    pet_age_months: '',
    pet_sex: 'desconocido',
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // Conectar stream al video cuando ambos esten listos
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value as FormData[typeof field] }));
  };

  const isFormValid = formData.owner_name.trim() && formData.pet_name.trim();

  // ─────────────────────────────────────────────────────────────────────
  // Pedir permiso de camara
  // ─────────────────────────────────────────────────────────────────────
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
      setPhase('capture_frontal');
    } catch (err) {
      console.error('Camera access error:', err);
      setError(
        'No pudimos acceder a la cámara. Verificá que le diste permiso y que no esté siendo usada por otra app.'
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Capturar frames automaticamente en la fase actual
  // ─────────────────────────────────────────────────────────────────────
  const captureFrame = useCallback((phaseLabel: string): Promise<CapturedFrame | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        resolve(null);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({
            blob,
            dataUrl,
            phase: phaseLabel,
            timestamp: Date.now(),
          });
        },
        'image/jpeg',
        0.85
      );
    });
  }, []);

  const runCapturePhase = useCallback(
    async (phaseLabel: string, targetFrames: number) => {
      const captured: CapturedFrame[] = [];
      for (let i = 0; i < targetFrames; i++) {
        setCaptureProgress((i / targetFrames) * 100);
        const frame = await captureFrame(phaseLabel);
        if (frame) captured.push(frame);
        await new Promise((r) => setTimeout(r, CAPTURE_INTERVAL_MS));
      }
      setCaptureProgress(100);
      setFrames((prev) => [...prev, ...captured]);
      setCaptureProgress(0);
    },
    [captureFrame]
  );

  // Efecto: disparar captura cuando cambia a una fase de captura
  useEffect(() => {
    if (phase === 'capture_frontal') {
      const timer = setTimeout(() => {
        runCapturePhase('frontal', FRAMES_PER_PHASE).then(() => {
          setPhase('capture_left');
        });
      }, 2000); // 2s de preparacion
      return () => clearTimeout(timer);
    }
    if (phase === 'capture_left') {
      const timer = setTimeout(() => {
        runCapturePhase('left', FRAMES_PER_PHASE).then(() => {
          setPhase('capture_right');
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (phase === 'capture_right') {
      const timer = setTimeout(() => {
        runCapturePhase('right', FRAMES_PER_PHASE).then(() => {
          setPhase('review');
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, runCapturePhase]);

  // ─────────────────────────────────────────────────────────────────────
  // Upload
  // ─────────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    setPhase('uploading');
    setUploadProgress(0);

    try {
      const sessionId = crypto.randomUUID();
      const photoUrls: string[] = [];

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const fileName = `${sessionId}/${frame.phase}_${i}_${frame.timestamp}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('nose-print-tests')
          .upload(fileName, frame.blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continuar con las demas fotos
        } else {
          const { data } = supabase.storage.from('nose-print-tests').getPublicUrl(fileName);
          photoUrls.push(data.publicUrl);
        }

        setUploadProgress(((i + 1) / frames.length) * 100);
      }

      // Crear registro en DB
      const { error: dbError } = await supabase.from('nose_print_test_sessions').insert({
        id: sessionId,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email || null,
        owner_location: formData.owner_location || null,
        pet_name: formData.pet_name,
        pet_species: formData.pet_species,
        pet_breed: formData.pet_breed || null,
        pet_age_months: formData.pet_age_months ? parseInt(formData.pet_age_months) : null,
        pet_sex: formData.pet_sex,
        protocol_version: 'v1',
        num_frames_captured: frames.length,
        num_frames_uploaded: photoUrls.length,
        photo_urls: photoUrls,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
      });

      if (dbError) {
        console.error('DB insert error:', dbError);
        throw new Error('No pudimos guardar tu contribución. Intentá de nuevo.');
      }

      setPhase('done');
      toast.success('¡Gracias por tu contribución!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      setPhase('review');
    }
  };

  const restart = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setFrames([]);
    setCaptureProgress(0);
    setUploadProgress(0);
    setError(null);
    setPhase('form');
  };

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Test Nose Print — Paw Friend</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-8">
        <div className="container max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl">🐾</span>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                Paw Friend
              </span>
            </div>
            <h1 className="text-2xl font-bold">Test biométrico nasal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ayudanos a mejorar el reconocimiento de mascotas
            </p>
          </div>

          {/* Phase: FORM */}
          {phase === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle>Contanos sobre vos y tu mascota</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Solo para investigación. No compartimos tus datos.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="owner_name">Tu nombre *</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => updateForm('owner_name', e.target.value)}
                    placeholder="Pedro"
                  />
                </div>
                <div>
                  <Label htmlFor="owner_email">Email (opcional)</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => updateForm('owner_email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Por si queremos avisarte los resultados
                  </p>
                </div>
                <div>
                  <Label htmlFor="owner_location">Ciudad/comuna (opcional)</Label>
                  <Input
                    id="owner_location"
                    value={formData.owner_location}
                    onChange={(e) => updateForm('owner_location', e.target.value)}
                    placeholder="Santiago Centro"
                  />
                </div>
                <div className="border-t pt-3">
                  <Label htmlFor="pet_name">Nombre de tu mascota *</Label>
                  <Input
                    id="pet_name"
                    value={formData.pet_name}
                    onChange={(e) => updateForm('pet_name', e.target.value)}
                    placeholder="Firulais"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Especie</Label>
                    <Select
                      value={formData.pet_species}
                      onValueChange={(v) => updateForm('pet_species', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perro">🐶 Perro</SelectItem>
                        <SelectItem value="gato">🐱 Gato</SelectItem>
                        <SelectItem value="otro">🐾 Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <Select
                      value={formData.pet_sex}
                      onValueChange={(v) => updateForm('pet_sex', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="macho">Macho</SelectItem>
                        <SelectItem value="hembra">Hembra</SelectItem>
                        <SelectItem value="desconocido">No sé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="pet_breed">Raza (aprox)</Label>
                  <Input
                    id="pet_breed"
                    value={formData.pet_breed}
                    onChange={(e) => updateForm('pet_breed', e.target.value)}
                    placeholder="Mestizo, Golden, Siamés..."
                  />
                </div>
                <div>
                  <Label htmlFor="pet_age_months">Edad aproximada (meses)</Label>
                  <Input
                    id="pet_age_months"
                    type="number"
                    inputMode="numeric"
                    value={formData.pet_age_months}
                    onChange={(e) => updateForm('pet_age_months', e.target.value)}
                    placeholder="36"
                  />
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setPhase('permission')}
                  disabled={!isFormValid}
                >
                  Continuar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Phase: PERMISSION */}
          {phase === 'permission' && (
            <Card>
              <CardContent className="pt-6 space-y-4 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                  <Camera className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold">Necesitamos la cámara</h2>
                <p className="text-sm text-muted-foreground">
                  Vamos a capturar varias fotos de la nariz de <strong>{formData.pet_name}</strong>{' '}
                  desde distintos ángulos. Todo se hace automáticamente.
                </p>
                <div className="bg-muted/50 rounded-lg p-3 text-left text-xs space-y-1">
                  <p className="font-semibold">Tips para buena captura:</p>
                  <p>• Acercá el celular a ~15cm de la nariz</p>
                  <p>• Luz natural si es posible</p>
                  <p>• Mantené el enfoque nítido</p>
                  <p>• Tardará unos 20 segundos</p>
                </div>
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 text-left flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <Button className="w-full" size="lg" onClick={requestCamera}>
                  <Camera className="mr-2 h-5 w-5" />
                  Permitir cámara
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Phase: CAPTURE (any) */}
          {(phase === 'capture_frontal' ||
            phase === 'capture_left' ||
            phase === 'capture_right') && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black aspect-[3/4]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay circular guia */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={cn(
                        'w-48 h-48 rounded-full border-4 transition-colors',
                        captureProgress > 0 ? 'border-green-400 animate-pulse' : 'border-white/80'
                      )}
                    />
                  </div>
                  {/* Instruction overlay */}
                  <div className="absolute top-4 left-4 right-4 text-center">
                    <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                      <p className="text-white text-sm font-medium">
                        {phase === 'capture_frontal' && '📸 Mantené la nariz al frente'}
                        {phase === 'capture_left' && '◀ Gira ligeramente a la izquierda'}
                        {phase === 'capture_right' && '▶ Gira ligeramente a la derecha'}
                      </p>
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <Progress value={captureProgress} className="h-2 bg-white/30" />
                    <p className="text-white text-xs text-center mt-2 font-medium">
                      {captureProgress > 0
                        ? `Capturando... ${Math.round(captureProgress)}%`
                        : 'Preparando...'}
                    </p>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          )}

          {/* Phase: REVIEW */}
          {phase === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle>Revisá tus capturas</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {frames.length} fotos capturadas. Si están borrosas o no se ve bien la nariz,
                  podés repetir.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {frames.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded overflow-hidden">
                      <img
                        src={f.dataUrl}
                        alt={`Frame ${i}`}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-1 left-1 text-[9px] px-1.5 h-4">
                        {f.phase}
                      </Badge>
                    </div>
                  ))}
                </div>
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={restart}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Repetir
                  </Button>
                  <Button className="flex-1" onClick={handleUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phase: UPLOADING */}
          {phase === 'uploading' && (
            <Card>
              <CardContent className="pt-6 space-y-4 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-purple-600 animate-pulse" />
                </div>
                <h2 className="text-lg font-bold">Subiendo {frames.length} fotos...</h2>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
              </CardContent>
            </Card>
          )}

          {/* Phase: DONE */}
          {phase === 'done' && (
            <Card>
              <CardContent className="pt-6 space-y-4 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">¡Gracias {formData.owner_name}!</h2>
                <p className="text-sm text-muted-foreground">
                  Las fotos de <strong>{formData.pet_name}</strong> nos ayudan a mejorar el sistema
                  biométrico de Paw Friend. Cuando esté listo, te avisaremos.
                </p>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <Heart className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-xs text-purple-900">
                    Paw Friend busca reemplazar el chip implantado por biometría no invasiva. Vos
                    acabás de contribuir al dataset chileno más grande de narices de mascotas.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={restart}>
                  Agregar otra mascota
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
