import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from '@/lib/icons';
import { track, EVENTS } from '@/lib/analytics';

interface ProUpgradeCTAProps {
  variant?: 'inline' | 'banner' | 'minimal';
  context?: string;
}

/**
 * CTA contextual para invitar al user B2C a sostener Paw Friend como Paw
 * Member. El nombre "ProUpgrade" se conserva por compatibilidad pero con
 * el pivot 2026-04-19 ya no "desbloquea" nada — la app es 100% gratis.
 * Navega a /paw-member (no /upgrade, que fue descontinuada).
 */
export function ProUpgradeCTA({ variant = 'inline', context = 'unknown' }: ProUpgradeCTAProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: { variant, context },
    });
    navigate('/paw-member');
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        className="text-xs text-violet-600 hover:text-violet-700 font-medium hover:underline flex items-center gap-1"
      >
        <Heart className="h-3 w-3 fill-violet-500 text-violet-500" />
        Hacerme Paw Member →
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 via-violet-100/50 to-fuchsia-50">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-violet-200 p-2.5 flex-shrink-0">
              <Heart className="h-5 w-5 text-violet-700 fill-violet-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-violet-900">Hazte Paw Member 💛</p>
              <p className="text-xs text-violet-700/80">
                Badge + descuentos de alianzas. La app sigue gratis para todos.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleClick}
            className="bg-violet-600 hover:bg-violet-700 text-white flex-shrink-0"
          >
            Ver detalles
          </Button>
        </CardContent>
      </Card>
    );
  }

  // inline (default)
  return (
    <Card
      className="border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div className="rounded-full bg-violet-100 p-2 flex-shrink-0">
          <Heart className="h-4 w-4 text-violet-600 fill-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-violet-800">Sostener Paw Friend</p>
          <p className="text-xs text-muted-foreground">
            Paw Member: badge + acceso a descuentos de alianzas
          </p>
        </div>
        <span className="text-xs text-violet-500 font-medium flex-shrink-0">Ver más →</span>
      </CardContent>
    </Card>
  );
}
