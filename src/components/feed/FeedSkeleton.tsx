import { Skeleton } from '@/components/ui/skeleton';

export function FeedPostSkeleton() {
  return (
    <div className="bg-card border-b sm:rounded-xl sm:border sm:mb-4 overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" />

      {/* Actions skeleton */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function FeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <FeedPostSkeleton key={i} />
      ))}
    </div>
  );
}
