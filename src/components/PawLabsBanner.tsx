import { FlaskConical } from '@/lib/icons';

interface PawLabsBannerProps {
  /** Short description of what the feature does */
  description?: string;
}

/**
 * Reusable banner for features in "Paw Labs" (beta) status.
 * Shows a clear indicator that the feature is experimental.
 */
export function PawLabsBanner({
  description = 'Estamos afinando esta experiencia. Tu feedback nos ayuda a mejorar.',
}: PawLabsBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3">
      <FlaskConical className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-violet-800">Paw Labs — Beta</p>
        <p className="text-xs text-violet-600 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
