import { useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, QrCode } from '@/lib/icons';

interface PetQRDisplayProps {
  petId: string;
  petName: string;
}

/**
 * Muestra el codigo QR de la ficha clinica de una mascota.
 * Incluye botones para descargar la imagen y compartir el enlace.
 */
export function PetQRDisplay({ petId, petName }: PetQRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const clinicalUrl = `https://pawfriend.cl/ficha/${petId}`;

  const handleDownload = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${petName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    toast.success('QR descargado');
  }, [petName]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha clínica de ${petName} — Paw Friend`,
          url: clinicalUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(clinicalUrl);
        toast.success('Enlace copiado al portapapeles');
      } catch {
        toast.error('No se pudo copiar el enlace');
      }
    }
  }, [petName, clinicalUrl]);

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4 text-purple-600" />
          Código QR de {petName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div ref={qrRef} className="p-2 bg-white rounded-lg border border-purple-100 flex-shrink-0">
          <QRCodeCanvas value={clinicalUrl} size={100} level="M" includeMargin={false} />
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <p className="text-sm text-muted-foreground">
            Escanea o comparte este QR para acceder a la ficha de {petName}.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 h-8 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
