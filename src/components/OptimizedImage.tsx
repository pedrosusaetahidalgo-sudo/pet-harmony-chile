import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PawPrint, Dog, Cat } from '@/lib/icons';

type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ImageShape = 'circle' | 'square' | 'rounded';

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  size?: ImageSize;
  shape?: ImageShape;
  /** Species-aware fallback icon for pets */
  species?: string;
  /** Text initials fallback (for user avatars) */
  initials?: string;
  className?: string;
}

const SIZE_CLASSES: Record<ImageSize, string> = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
};

const SHAPE_CLASSES: Record<ImageShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-lg',
};

function FallbackIcon({ species, initials }: { species?: string; initials?: string }) {
  if (initials) {
    return (
      <span className="text-sm font-semibold text-muted-foreground select-none">{initials}</span>
    );
  }

  const iconClass = 'h-1/2 w-1/2';
  switch (species) {
    case 'perro':
      return <Dog className={cn(iconClass, 'text-amber-400')} />;
    case 'gato':
      return <Cat className={cn(iconClass, 'text-purple-400')} />;
    default:
      return <PawPrint className={cn(iconClass, 'text-muted-foreground/40')} />;
  }
}

const SPECIES_BG: Record<string, string> = {
  perro: 'bg-amber-50',
  gato: 'bg-purple-50',
};

export function OptimizedImage({
  src,
  alt,
  size = 'md',
  shape = 'rounded',
  species,
  initials,
  className,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !src || error;
  const fallbackBg = species ? (SPECIES_BG[species] ?? 'bg-muted') : 'bg-muted';

  return (
    <div
      className={cn(
        'relative overflow-hidden flex-shrink-0 flex items-center justify-center',
        SIZE_CLASSES[size],
        SHAPE_CLASSES[shape],
        showFallback ? fallbackBg : 'bg-muted',
        className
      )}
    >
      {!showFallback && (
        <>
          {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <img
            src={src!}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'w-full h-full object-cover object-center transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      )}
      {showFallback && <FallbackIcon species={species} initials={initials} />}
    </div>
  );
}
