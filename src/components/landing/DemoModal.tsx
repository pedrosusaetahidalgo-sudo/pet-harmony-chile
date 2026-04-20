import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal con video demo del producto. Por ahora muestra el `hero-pet.mp4`
 * con controles activos hasta que Pedro grabe un walkthrough real (ver
 * masterplan §15 — backlog A6 "Grabar video demo de 60s").
 *
 * Cuando esté el video real:
 *   1. Subir `public/landing/demo-walkthrough.mp4` (< 5 MB)
 *   2. Cambiar src abajo
 *   3. Eliminar TODO comment
 */
export function DemoModal({ open, onOpenChange }: DemoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-0 bg-neutral-950 p-0 sm:rounded-2xl">
        <VisuallyHidden asChild>
          <DialogTitle>Demo de Paw Friend</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden asChild>
          <DialogDescription>
            Video corto mostrando el flujo principal de Paw Friend.
          </DialogDescription>
        </VisuallyHidden>
        <div className="relative aspect-video w-full">
          {/* TODO(landing): reemplazar por demo-walkthrough.mp4 (60s flow real) cuando exista */}
          <video
            className="h-full w-full rounded-2xl bg-black object-cover"
            controls
            playsInline
            preload="metadata"
            poster="/paw-friend-assets-v2/social/og_image.jpg"
          >
            <source src="/videos/hero-pet.mp4" type="video/mp4" />
            {/* Track vacío hasta tener captions reales (video sin audio por ahora) */}
            <track kind="captions" srcLang="es" label="Español" default />
            Tu navegador no soporta video HTML5.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
