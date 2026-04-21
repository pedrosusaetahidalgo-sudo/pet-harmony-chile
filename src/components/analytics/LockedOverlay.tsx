import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from '@/lib/icons';
import { track, EVENTS } from '@/lib/analytics';

interface LockedOverlayProps {
  locked: boolean;
  title?: string;
  description?: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

/**
 * Overlay de bloqueo para analytics avanzada en B2B vet. Cuando locked=true
 * renderiza children borrosos + CTA para subir de plan. Destino default:
 * /provider/upgrade (la pagina transaccional de planes para vets). La ruta
 * /upgrade fue descontinuada en el pivot 2026-04-19.
 */
export function LockedOverlay({
  locked,
  title = 'Disponible en un plan superior',
  description = 'Mejora tu plan de veterinario para ver este analytics',
  onUpgrade,
  children,
}: LockedOverlayProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: { source: 'locked_overlay' },
    });
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/provider/upgrade');
    }
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)' }}>
        {children}
      </div>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="rounded-full bg-purple-100 p-3">
          <Lock className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{description}</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
        >
          Ver planes
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
