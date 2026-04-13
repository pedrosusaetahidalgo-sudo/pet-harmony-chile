import { useNavigate } from 'react-router-dom';
import { Crown } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { track, EVENTS } from '@/lib/analytics';

interface PremiumNudgeProps {
  /** What feature triggered this nudge */
  feature: string;
  /** Short title explaining what's limited */
  title: string;
  /** More detail on the value of upgrading */
  description: string;
  /** Optional current/max usage to show progress */
  usage?: { current: number; max: number };
  /** Custom CTA text (default: "Desbloquear con Premium") */
  ctaText?: string;
  /** Compact inline variant vs full card */
  variant?: 'card' | 'inline';
}

export function PremiumNudge({
  feature,
  title,
  description,
  usage,
  ctaText = 'Desbloquear con Premium',
  variant = 'card',
}: PremiumNudgeProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: { source: `nudge_${feature}` },
    });
    navigate('/upgrade');
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2">
        <Crown className="h-4 w-4 text-purple-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-purple-900">{title}</p>
          <p className="text-[10px] text-purple-600">{description}</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2 flex-shrink-0"
        >
          Mejorar
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-purple-100 p-2 flex-shrink-0">
          <Crown className="h-5 w-5 text-purple-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      {usage && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Uso este mes</span>
            <span className="font-medium">
              {usage.current} / {usage.max}
            </span>
          </div>
          <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, (usage.current / usage.max) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleUpgrade}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
        size="sm"
      >
        <Crown className="h-3.5 w-3.5" />
        {ctaText}
      </Button>
    </div>
  );
}
