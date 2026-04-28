/**
 * MemorialShareCard — genera imagen 1080×1080 compartible en redes.
 *
 * Refactor Maestro Fase 1 §6.6 (Memorial viral).
 *
 * El user toca "Descargar imagen" en /memoria/:petId. Generamos un canvas
 * con la foto de la mascota, su nombre, fechas y paleta brand v2 soft.
 * Format Instagram square (1080×1080) — funciona para post, stories y WhatsApp.
 *
 * No usa libs externas (Canvas API nativa). Sin server-side.
 */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessageForUser } from '@/lib/errors';

interface MemorialShareCardProps {
  petName: string;
  photoUrl: string | null;
  birthYear: number | null;
  passedYear: number | null;
  bio?: string | null;
}

const SIZE = 1080;

export function MemorialShareCard({
  petName,
  photoUrl,
  birthYear,
  passedYear,
  bio,
}: MemorialShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  /** Dibuja todo en el canvas y devuelve dataURL. */
  async function generate(): Promise<string> {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas no disponible');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Context no disponible');

    // ── Background: gradient soft (purple → rose, brand v2) ──────────────
    const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bgGrad.addColorStop(0, '#f3e8ff'); // purple-100
    bgGrad.addColorStop(0.5, '#fdf2f8'); // pink-50
    bgGrad.addColorStop(1, '#fef3c7'); // amber-100
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── Decoración: huella sutil top-right ──────────────────────────────
    ctx.font = '160px sans-serif';
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)'; // purple-500 con alpha
    ctx.fillText('🐾', SIZE - 200, 200);
    ctx.fillStyle = 'rgba(244, 114, 182, 0.08)';
    ctx.font = '120px sans-serif';
    ctx.fillText('🤍', 80, SIZE - 120);

    // ── Marco circular para foto (centrado, 460px diametro) ──────────────
    const photoSize = 460;
    const photoX = SIZE / 2;
    const photoY = SIZE / 2 - 80;

    // Sombra suave detrás de la foto
    ctx.beginPath();
    ctx.arc(photoX, photoY, photoSize / 2 + 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.fill();

    // Foto (con clip circular)
    if (photoUrl) {
      try {
        const img = await loadImage(photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        // Cover fit: calcular crop para llenar el círculo
        const ratio = Math.max(photoSize / img.width, photoSize / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        ctx.drawImage(img, photoX - drawW / 2, photoY - drawH / 2, drawW, drawH);
        ctx.restore();
      } catch {
        // Fallback: emoji corazón si no pudimos cargar la foto (CORS, 404)
        ctx.beginPath();
        ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.font = '200px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💜', photoX, photoY);
      }
    } else {
      // Sin foto → corazón
      ctx.beginPath();
      ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.font = '200px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💜', photoX, photoY);
    }

    // Borde blanco grueso del círculo
    ctx.beginPath();
    ctx.arc(photoX, photoY, photoSize / 2, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // ── Texto: "En memoria de" arriba ───────────────────────────────────
    ctx.fillStyle = 'rgba(88, 28, 135, 0.7)'; // purple-900 alpha
    ctx.font = '600 38px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EN MEMORIA DE', SIZE / 2, 90);

    // ── Nombre de la mascota (grande) ───────────────────────────────────
    ctx.fillStyle = '#581c87'; // purple-900
    ctx.font = 'bold 96px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(petName, SIZE / 2, 170);

    // ── Fechas (debajo del círculo) ─────────────────────────────────────
    const datesY = photoY + photoSize / 2 + 80;
    if (birthYear || passedYear) {
      ctx.fillStyle = '#9333ea'; // purple-600
      ctx.font = '600 56px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const dateText = `${birthYear ?? '?'}  —  ${passedYear ?? '?'}`;
      ctx.fillText(dateText, SIZE / 2, datesY);
    }

    // ── Bio corta (si existe, máx 80 chars) ─────────────────────────────
    if (bio) {
      const trimmed = bio.length > 80 ? bio.slice(0, 80) + '…' : bio;
      ctx.fillStyle = 'rgba(88, 28, 135, 0.7)';
      ctx.font = 'italic 32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Wrap simple a 2 líneas
      const words = trimmed.split(' ');
      let line1 = '';
      let line2 = '';
      for (const w of words) {
        if ((line1 + ' ' + w).length < 50) line1 = line1 ? `${line1} ${w}` : w;
        else line2 = line2 ? `${line2} ${w}` : w;
      }
      ctx.fillText(`"${line1}`, SIZE / 2, datesY + 70);
      if (line2) ctx.fillText(`${line2}"`, SIZE / 2, datesY + 110);
      else if (line1) {
        // cerrar la comilla en una línea
        ctx.fillText(`"${line1}"`, SIZE / 2, datesY + 70);
      }
    }

    // ── Footer: pawfriend.cl ────────────────────────────────────────────
    ctx.fillStyle = 'rgba(88, 28, 135, 0.5)';
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
      link.download = `memorial-${petName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Imagen de ${petName} descargada`);
    } catch (err) {
      const msg = errorMessageForUser(err);
      toast.error(`No pudimos generar la imagen: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Canvas oculto, solo para generar la imagen */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <Button
        onClick={handleDownload}
        disabled={generating}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando…
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" />
            Descargar imagen
          </>
        )}
      </Button>
    </>
  );
}

/** Carga una imagen con CORS para que canvas pueda usarla. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
