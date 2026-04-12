import { useState } from 'react';
import { useFeedPosts, type FeedPost } from '@/hooks/useFeedPosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { FeedPostCard } from './FeedPost';
import { FeedEmptyState } from './FeedEmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function FeedExplore() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeedPosts({
    feedType: 'popular',
  });

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const allPosts = data?.pages.flatMap((p) => p.posts) || [];
  // Only show posts that have images for the grid view
  const postsWithImages = allPosts.filter((p) => p.image_url || p.pet_photo);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (postsWithImages.length === 0) {
    return <FeedEmptyState type="explore" />;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {postsWithImages.map((post, i) => {
          // Every 10th item spans 2 columns
          const isLarge = i % 10 === 4;

          return (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className={`relative aspect-square overflow-hidden bg-muted group ${
                isLarge ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <img
                src={post.image_url || post.pet_photo || ''}
                alt={post.pet_name || 'Post'}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Hover overlay with likes/comments */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-4 text-white text-sm font-semibold">
                  <span>&#9829; {post.likes_count}</span>
                  <span>&#128172; {post.comments_count}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {/* Post detail dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-y-auto max-h-[90vh]">
          {selectedPost && <FeedPostCard post={selectedPost} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
