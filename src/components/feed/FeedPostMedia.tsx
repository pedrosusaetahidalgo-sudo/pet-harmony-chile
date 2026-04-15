import { useState } from 'react';
import { PawPrint, Heart } from '@/lib/icons';
import { useDoubleTapLike } from '@/hooks/useDoubleTapLike';
import { cn } from '@/lib/utils';

interface FeedPostMediaProps {
  imageUrl: string | null;
  petPhoto: string | null;
  petName: string | null;
  isLiked: boolean;
  onDoubleTapLike: () => void;
}

export function FeedPostMedia({
  imageUrl,
  petPhoto,
  petName,
  isLiked,
  onDoubleTapLike,
}: FeedPostMediaProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const src = imageUrl || petPhoto;

  const { handleTap, showHeart } = useDoubleTapLike({
    onDoubleTap: () => {
      if (!isLiked) onDoubleTapLike();
    },
  });

  if (!src) {
    return (
      <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center">
        <PawPrint className="h-16 w-16 text-purple-200 dark:text-purple-800" />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Doble tap para dar like"
      className="relative bg-black/5 dark:bg-white/5 select-none"
      style={{ touchAction: 'manipulation' }}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleTap();
      }}
    >
      {/* Placeholder while loading */}
      {!imgLoaded && (
        <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 animate-pulse" />
      )}

      <img
        src={src}
        alt={petName || 'Publicacion'}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        className={cn(
          'w-full object-cover transition-opacity duration-300 aspect-video',
          imgLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0',
          // No forzar aspect-ratio cuadrado: mostrar la imagen en su ratio real
          // pero con un max-height para que no sea infinita
          'max-h-[600px]'
        )}
      />

      {/* Double-tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Heart
            className="h-24 w-24 text-white fill-white drop-shadow-lg animate-ping"
            style={{
              animation: 'feedHeartPop 0.8s ease-out forwards',
            }}
          />
        </div>
      )}
    </div>
  );
}
