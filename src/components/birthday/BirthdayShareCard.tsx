/**
 * BirthdayShareCard — imagen 1080×1080 para celebrar cumpleaños de mascota.
 *
 * Refactor Maestro §2.8.3 (CASCADE_BIRTHDAY_AUTO).
 *
 * Reusa el patron de MemorialShareCard (Canvas API nativa, sin libs).
 * Tonos festivos (amber + rose) en lugar de soft (purple + amber del memorial).
 *
 * Uso: el botón aparece en el card del pet cuando estamos a ±7 días del
 * cumpleaños (cumple próximo o muy reciente).
 */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cake, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BirthdayShareCardProps {
  petName: string;
  photoUrl: string | null;
  birthDate: string | null;
}

const SIZE = 1080;

export function BirthdayShareCard({ petName, photoUrl, birthDate }: BirthdayShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const ageYears = birthDate
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
      )
    : null;

  async function generate(): Promise<string> {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas no disponible');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Context no disponible');

    // Background festivo: amber → rose → purple
    const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bgGrad.addColorStop(0, '#fef3c7'); // amber-100
    bgGrad.addColorStop(0.5, '#fce7f3'); // pink-100
    bgGrad.addColorStop(1, '#f3e8ff'); // purple-100
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Confeti/decoración
    ctx.font = '120px sans-serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)'; // amber
    ctx.fillText('🎂', SIZE - 200, 180);
    ctx.fillStyle = 'rgba(244, 114, 182, 0.15)';
    ctx.font = '100px sans-serif';
    ctx.fillText('🎉', 90, SIZE - 150);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.font = '90px sans-serif';
    ctx.fillText('🎈', SIZE - 170, SIZE - 100);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.font = '80px sans-serif';
    ctx.fillText('✨', 100, 250);

    // Foto circular centro
    const photoSize = 460;
    const photoX = SIZE / 2;
    const photoY = SIZE / 2 - 60;

    // Sombra
    ctx.beginPath();
    ctx.arc(photoX, photoY, photoSize / 2 + 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
    ctx.fill();

    if (photoUrl) {
      try {
        const img = await loadImage(photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const ratio = Math.max(photoSize / img.width, photoSize / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        ctx.drawImage(img, photoX - drawW / 2, photoY - drawH / 2, drawW, drawH);
        ctx.restore();
      } catch {
        ctx.beginPath();
        ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.font = '200px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎂', photoX, photoY);
      }
    } else {
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.font = '200px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎂', photoX, photoY);
    }

    // Borde dorado del círculo
    ctx.beginPath();
    ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#fbbf24'; // amber-400
    ctx.stroke();

    // Texto "FELIZ CUMPLEAÑOS"
    ctx.fillStyle = 'rgba(124, 45, 18, 0.85)'; // amber-900
    ctx.font = '700 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉  FELIZ CUMPLEAÑOS  🎉', SIZE / 2, 100);

    // Nombre
    ctx.fillStyle = '#7c2d12'; // amber-900 más oscuro
    ctx.font = 'bold 110px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(petName, SIZE / 2, 200);

    // Edad
    const datesY = photoY + photoSize / 2 + 90;
    if (ageYears) {
      ctx.fillStyle = '#9333ea'; // purple-600
      ctx.font = 'bold 72px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ageYears}  ${ageYears === 1 ? 'año' : 'años'}`, SIZE / 2, datesY);
    }

    // Footer
    ctx.fillStyle = 'rgba(124, 45, 18, 0.5)';
    ctx.font = '600 30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('pawfriend.cl', SIZE / 2, SIZE - 60);

    return canvas.toDataURL('image/png');
  }

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const dataUrl = await generate();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `cumple-${petName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Imagen de cumpleaños de ${petName} descargada 🎂`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No pudimos generar la imagen: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <Button
        onClick={handleDownload}
        disabled={generating}
        size="sm"
        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando…
          </>
        ) : (
          <>
            <Cake className="h-4 w-4" />
            Compartir cumple
          </>
        )}
      </Button>
    </>
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
