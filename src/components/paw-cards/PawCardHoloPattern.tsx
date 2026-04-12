import type { HoloPattern } from '@/lib/paw-cards';
import { HOLO_PATTERN_MAP } from '@/lib/paw-cards';

interface PawCardHoloPatternProps {
  pattern: HoloPattern;
}

export function PawCardHoloPattern({ pattern }: PawCardHoloPatternProps) {
  const config = HOLO_PATTERN_MAP[pattern];
  if (!config) return null;

  return <div className={`paw-holo-base ${config.cssClass}`} aria-hidden="true" />;
}
