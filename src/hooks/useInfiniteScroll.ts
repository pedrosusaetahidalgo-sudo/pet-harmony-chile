import { useEffect, useRef, useCallback, type RefObject } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '400px',
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement> {
  // React 18.3 infiere `RefObject<T | null>` de `useRef<T>(null)` (overload
  // resolution) — incompatible con `<div ref={...}>` que pide `Ref<T>`.
  // Cast unico aqui para que las dos callsites (Feed, FeedExplore) no
  // tengan que castear individualmente.
  const sentinelRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect, rootMargin]);

  return sentinelRef;
}
