import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useFeedPosts, type FeedPost } from '@/hooks/useFeedPosts';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { FeedPostCard } from '@/components/feed/FeedPost';
import { FeedStories } from '@/components/feed/FeedStories';
import { FeedCreatePost } from '@/components/feed/FeedCreatePost';
import { FeedSkeletonList } from '@/components/feed/FeedSkeleton';
import { FeedEmptyState } from '@/components/feed/FeedEmptyState';
import { POST_TYPES } from '@/lib/postTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Users, TrendingUp, Compass, Plus, Search, ArrowUp } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const FeedExplore = lazy(() =>
  import('@/components/feed/FeedExplore').then((m) => ({
    default: m.FeedExplore,
  }))
);

type FeedTab = 'all' | 'following' | 'popular' | 'explore';

const Feed = () => {
  const { user } = useAuth();
  const { filterBlocked } = useBlockedUsers();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  // Load profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  // Feed queries
  const feedType = activeTab === 'explore' ? 'popular' : activeTab;

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeedPosts({
    feedType: feedType as 'all' | 'following' | 'popular',
    filterType,
    search: searchQuery || undefined,
    enabled: activeTab !== 'explore',
  });

  // Realtime new posts banner
  const { newPostsCount, loadNewPosts } = useFeedRealtime();

  // Infinite scroll
  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Filter blocked users
  const allPosts = data?.pages.flatMap((p) => p.posts) || [];
  const filteredPosts = filterBlocked(allPosts, 'user_id');

  const handleHashtagClick = useCallback((tag: string) => {
    setSearchQuery(`#${tag}`);
    setActiveTab('all');
  }, []);

  return (
    <>
      <OnboardingTutorial onComplete={() => {}} />

      <PageHeader
        title="Comunidad"
        subtitle="Fotos y publicaciones de la comunidad"
        actions={
          profile ? (
            <Avatar className="h-10 w-10 border-2 border-primary shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-warm-gradient text-white font-semibold text-sm">
                {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : null
        }
      />

      <div className="w-full max-w-2xl mx-auto animate-fade-in">
        {/* Stories bar */}
        <div className="border-b">
          <FeedStories />
        </div>

        {/* New posts banner */}
        {newPostsCount > 0 && activeTab !== 'explore' && (
          <button
            onClick={loadNewPosts}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowUp className="h-4 w-4" />
            {newPostsCount} {newPostsCount === 1 ? 'publicacion nueva' : 'publicaciones nuevas'}
          </button>
        )}

        {/* Publish button */}
        <div className="px-4 pt-4 pb-2">
          <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
            <DialogTrigger asChild>
              <Button className="w-full bg-warm-gradient hover:opacity-90 h-11 rounded-xl text-sm font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Publicar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva publicacion</DialogTitle>
                <DialogDescription>Comparte momentos especiales con la comunidad</DialogDescription>
              </DialogHeader>
              <FeedCreatePost onSuccess={() => setShowCreatePost(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mascotas, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-2 focus:border-primary transition-all text-sm"
            />
          </div>
        </div>

        {/* Post type filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <Badge
            variant={filterType === null ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap shrink-0"
            onClick={() => setFilterType(null)}
          >
            Todos
          </Badge>
          {POST_TYPES.map((pt) => (
            <Badge
              key={pt.value}
              variant={filterType === pt.value ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setFilterType(filterType === pt.value ? null : pt.value)}
            >
              {pt.emoji} {pt.label}
            </Badge>
          ))}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as FeedTab)}
          className="w-full"
        >
          <div className="px-4 pb-2">
            <TabsList className="w-full bg-muted/50 p-1 rounded-xl">
              <TabsTrigger
                value="all"
                className="flex-1 rounded-lg text-xs data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Para ti
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="flex-1 rounded-lg text-xs data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <Users className="h-3.5 w-3.5 mr-1" />
                Siguiendo
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="flex-1 rounded-lg text-xs data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                Popular
              </TabsTrigger>
              <TabsTrigger
                value="explore"
                className="flex-1 rounded-lg text-xs data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <Compass className="h-3.5 w-3.5 mr-1" />
                Explorar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Feed content — Para ti, Siguiendo, Popular */}
          <TabsContent value="all" className="mt-0">
            <FeedList
              posts={filteredPosts}
              isLoading={isLoading}
              emptyType="all"
              sentinelRef={sentinelRef}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onCreatePost={() => setShowCreatePost(true)}
              onHashtagClick={handleHashtagClick}
            />
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {!user ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Inicia sesion para ver publicaciones de quienes sigues</p>
              </div>
            ) : (
              <FeedList
                posts={filteredPosts}
                isLoading={isLoading}
                emptyType="following"
                sentinelRef={sentinelRef}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                onCreatePost={() => setShowCreatePost(true)}
                onHashtagClick={handleHashtagClick}
              />
            )}
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <FeedList
              posts={filteredPosts}
              isLoading={isLoading}
              emptyType="popular"
              sentinelRef={sentinelRef}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onCreatePost={() => setShowCreatePost(true)}
              onHashtagClick={handleHashtagClick}
            />
          </TabsContent>

          {/* Explore grid */}
          <TabsContent value="explore" className="mt-0">
            <Suspense
              fallback={
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              }
            >
              <FeedExplore />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// ── Extracted feed list component ──────────────────────────────────────────

interface FeedListProps {
  posts: FeedPost[];
  isLoading: boolean;
  emptyType: 'all' | 'following' | 'popular';
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  onCreatePost: () => void;
  onHashtagClick: (tag: string) => void;
}

function FeedList({
  posts,
  isLoading,
  emptyType,
  sentinelRef,
  isFetchingNextPage,
  hasNextPage,
  onCreatePost,
  onHashtagClick,
}: FeedListProps) {
  if (isLoading) {
    return <FeedSkeletonList count={3} />;
  }

  if (posts.length === 0) {
    return (
      <FeedEmptyState
        type={emptyType}
        onAction={emptyType === 'all' || emptyType === 'following' ? onCreatePost : undefined}
      />
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <FeedPostCard key={post.id} post={post} onHashtagClick={onHashtagClick} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {isFetchingNextPage && <FeedSkeletonList count={2} />}

      {/* End of feed */}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Estas al dia — ya viste todas las publicaciones recientes 🐾
        </div>
      )}
    </div>
  );
}

export default Feed;
