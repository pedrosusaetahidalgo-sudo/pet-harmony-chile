import { useState, useRef } from 'react';
import { Camera, AlertTriangle, Loader2, Upload, Eye } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAISkill } from '@/hooks/useAISkill';
import { AIDisclaimer } from './AIDisclaimer';
import { AIRateLimitState } from './AIRateLimitState';
import { AIErrorState } from './AIErrorState';

interface WoundResponse {
  description: string;
  urgency: 'rojo' | 'naranja' | 'amarillo' | 'verde';
  urgency_label: string;
  observations: string[];
  recommended_action: string;
  show_directory: boolean;
  image_quality: string;
  disclaimer: string;
  pet_name: string;
  remaining: number;
}

interface Props {
  petId: string;
  petName: string;
  onShowDirectory?: () => void;
}

const URGENCY_CONFIG = {
  rojo: {
    bg: 'bg-red-50 border-red-300',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },
  naranja: {
    bg: 'bg-orange-50 border-orange-300',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
  },
  amarillo: {
    bg: 'bg-amber-50 border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  verde: {
    bg: 'bg-green-50 border-green-300',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
};

export function WoundVision({ petId, petName, onShowDirectory }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [userDescription, setUserDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, isRateLimited, invoke, reset } = useAISkill<
    { image_base64: string; pet_id: string; description?: string },
    WoundResponse
  >({
    functionName: 'wound-vision',
    skillLabel: 'Evaluacion Visual',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es muy grande (max 10 MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      // Strip data:image/...;base64, prefix
      setImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (!imageBase64) return;
    invoke({
      image_base64: imageBase64,
      pet_id: petId,
      description: userDescription.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
    setImagePreview(null);
    setImageBase64(null);
    setUserDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (data) {
    const urgConfig = URGENCY_CONFIG[data.urgency] || URGENCY_CONFIG.amarillo;

    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Evaluacion visual de {petName}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleReset}>
              Nueva foto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Urgency result */}
          <div className={`p-3 rounded-lg border-2 ${urgConfig.bg}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`h-3 w-3 rounded-full ${urgConfig.dot}`} />
              {data.urgency === 'rojo' && <AlertTriangle className="h-4 w-4 text-red-600" />}
              <span className={`text-sm font-semibold ${urgConfig.text}`}>
                {data.urgency_label}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${urgConfig.text}`}>{data.description}</p>
          </div>

          {/* Observations */}
          {data.observations.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Observaciones
              </p>
              {data.observations.map((obs, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  - {obs}
                </p>
              ))}
            </div>
          )}

          {/* Recommended action */}
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-semibold uppercase text-blue-700 mb-0.5">
              Accion recomendada
            </p>
            <p className="text-xs text-blue-800">{data.recommended_action}</p>
          </div>

          {/* Image quality */}
          <Badge variant="outline" className="text-[10px]">
            Calidad de imagen: {data.image_quality}
          </Badge>

          {/* Directory CTA */}
          {data.show_directory && onShowDirectory && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={onShowDirectory}
            >
              Buscar veterinario en el directorio
            </Button>
          )}

          <AIDisclaimer type="medical" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-600" />
          Evaluacion visual de {petName}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            IA
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Sube una foto de la herida o lesion de {petName} para evaluar la urgencia.
        </p>

        {/* Image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-7 text-[10px]"
              onClick={() => fileInputRef.current?.click()}
            >
              Cambiar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-36 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">
              Toca para subir una foto (max 10 MB)
            </span>
          </button>
        )}

        {/* Optional description */}
        <Input
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          placeholder="Opcional: describe que ves..."
          className="text-xs h-9"
          disabled={isLoading}
        />

        <Button
          onClick={handleAnalyze}
          disabled={!imageBase64 || isLoading || isRateLimited}
          className="w-full h-9 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <Eye className="h-3.5 w-3.5 mr-1.5" />
          )}
          Evaluar con IA
        </Button>

        {isRateLimited && <AIRateLimitState skillLabel="Evaluacion Visual" />}
        {error && <AIErrorState message={error} />}

        <AIDisclaimer type="medical" />
      </CardContent>
    </Card>
  );
}
