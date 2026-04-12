import { useRef, useCallback, useState } from 'react';

interface UseDoubleTapLikeOptions {
  onDoubleTap: () => void;
  delay?: number;
}

export function useDoubleTapLike({ onDoubleTap, delay = 300 }: UseDoubleTapLikeOptions) {
  const lastTapRef = useRef(0);
  const [showHeart, setShowHeart] = useState(false);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < delay) {
      onDoubleTap();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, delay]);

  return { handleTap, showHeart };
}
