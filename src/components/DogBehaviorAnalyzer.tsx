import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Video, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BehaviorAnalysis {
  estado_emocional: string;
  lenguaje_corporal: {
    postura: string;
    cola: string;
    orejas: string;
    expresion_facial: string;
  };
  interpretacion: string;
  recomendaciones: string[];
  nivel_alerta: "bajo" | "medio" | "alto";
}

export const DogBehaviorAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BehaviorAnalysis | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFramesFromVideo = async (videoFile: File, numFrames = 5): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const duration = video.duration;
        const interval = duration / numFrames;
        const frames: string[] = [];
        let currentFrame = 0;

        const captureFrame = () => {
          if (currentFrame >= numFrames) {
            resolve(frames);
            return;
          }

          const time = currentFrame * interval;
          video.currentTime = time;
        };

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          currentFrame++;
          captureFrame();
        };

        captureFrame();
      };

      video.onerror = () => {
        reject(new Error('Error al cargar el video'));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un video
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, sube un archivo de video válido');
      return;
    }

    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('El video es muy grande. Máximo 50MB');
      return;
    }

    setVideoPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      toast.info('Extrayendo frames del video...');
      const frames = await extractFramesFromVideo(file, 5);
      
      toast.info('Analizando lenguaje corporal con IA...');
      const { data, error } = await supabase.functions.invoke('analyze-dog-behavior', {
        body: { videoFrames: frames }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      toast.success('¡Análisis completado!');
    } catch (error: any) {
      console.error('Error al analizar el video:', error);
      toast.error(error.message || 'Error al analizar el video');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAlertVariant = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return 'destructive';
      case 'medio':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return <AlertCircle className="h-4 w-4" />;
      case 'medio':
        return <Info className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Analizador de Lenguaje Corporal Canino
          </CardTitle>
          <CardDescription>
            Sube un video de tu perro y la IA analizará su lenguaje corporal para ayudarte a entender qué está comunicando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-8 hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              disabled={isAnalyzing}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="w-full max-w-xs"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Video
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Formatos: MP4, MOV, AVI (máx. 50MB)
            </p>
          </div>

          {videoPreview && (
            <div className="rounded-lg overflow-hidden border border-border">
              <video
                ref={videoRef}
                src={videoPreview}
                controls
                className="w-full max-h-96 object-contain bg-black"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-2 border-primary/20 shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle>Análisis del Lenguaje Corporal</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-sm">
                Estado: {analysis.estado_emocional}
              </Badge>
              <Badge variant={analysis.nivel_alerta === 'alto' ? 'destructive' : 'default'}>
                Nivel de Alerta: {analysis.nivel_alerta.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lenguaje Corporal Detallado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  🐕 Postura
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.lenguaje_corporal.postura}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  🐾 Cola
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.lenguaje_corporal.cola}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  👂 Orejas
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.lenguaje_corporal.orejas}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  😊 Expresión Facial
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.lenguaje_corporal.expresion_facial}</p>
              </div>
            </div>

            {/* Interpretación */}
            <Alert variant={getAlertVariant(analysis.nivel_alerta)}>
              {getAlertIcon(analysis.nivel_alerta)}
              <AlertTitle>Interpretación</AlertTitle>
              <AlertDescription className="mt-2">
                {analysis.interpretacion}
              </AlertDescription>
            </Alert>

            {/* Recomendaciones */}
            {analysis.recomendaciones && analysis.recomendaciones.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">📋 Recomendaciones</h4>
                <ul className="space-y-2">
                  {analysis.recomendaciones.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
