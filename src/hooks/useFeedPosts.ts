import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FeedPost {
  id: string;
  user_id: string;
  pet_id: string | null;
  content: string;
  image_url: string | null;
  post_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  owner_name: string | null;
  owner_avatar: string | null;
  pet_name: string | null;
  pet_photo: string | null;
  is_liked: boolean;
  is_saved: boolean;
}

interface UseFeedPostsOptions {
  feedType: 'all' | 'following' | 'popular';
  filterType?: string | null;
  search?: string;
  enabled?: boolean;
}

const PAGE_SIZE = 20;

async function fetchFeedPage(
  userId: string | undefined,
  cursor: string | null,
  feedType: string,
  filterType?: string | null,
  search?: string
): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  // Build query with joins — works without the RPC being deployed
  // Bug fix 2026-04-21: el join `profiles:user_id (...)` fallaba silencioso
  // porque posts.user_id tiene FK a auth.users (NO a profiles). PostgREST
  // no resolvia la relacion → 0 rows devueltas → Feed vacio para todos.
  // Solucion: quitar el join y hacer batch fetch de profiles aparte,
  // merge manual en JS (ver bloque despues del query).
  let query = supabase
    .from('posts')
    .select(
      `
      id,
      user_id,
      pet_id,
      content,
      image_url,
      post_type,
      likes_count,
      comments_count,
      created_at,
      pets:pet_id (
        name,
        photo_url
      )
    `
    )
    .limit(PAGE_SIZE);

  // Cursor pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Filter by post type
  if (filterType) {
    query = query.eq('post_type', filterType);
  }

  // Search
  if (search?.trim()) {
    query = query.or(`content.ilike.%${search}%,pets.name.ilike.%${search}%`);
  }

  // Order
  if (feedType === 'popular') {
    query = query.order('likes_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) return { posts: [], nextCursor: null };

  // For "following" feed, we need to filter by followed users
  type PostRow = NonNullable<typeof data>[number];
  let filteredData: PostRow[] = data || [];

  if (feedType === 'following' && userId) {
    const { data: followingData } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = new Set((followingData || []).map((f) => f.following_id));
    filteredData = filteredData.filter((p) => followingIds.has(p.user_id));
  }

  // Batch fetch profiles for all post authors (2026-04-21 fix).
  // posts.user_id → auth.users, no FK directa a profiles, asi que el
  // join implicito fallaba. Hacemos query separada via profiles.id
  // (profiles.id === auth.users.id en este schema).
  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  if (filteredData.length > 0) {
    const uniqueUserIds = Array.from(new Set(filteredData.map((p) => p.user_id)));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', uniqueUserIds);
    for (const pr of profilesData ?? []) {
      profileMap.set(pr.id, {
        display_name: pr.display_name,
        avatar_url: pr.avatar_url,
      });
    }
  }

  // Check liked/saved status for current user in batch
  let likedSet = new Set<string>();
  let savedSet = new Set<string>();

  if (userId && filteredData.length > 0) {
    const postIds = filteredData.map((p) => p.id);

    const likesRes = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    likedSet = new Set((likesRes.data || []).map((l) => l.post_id));

    // post_saves may not exist yet (migration pending)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savesClient = (supabase as any).from('post_saves');
      const savesRes = await savesClient
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);
      if (savesRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savedSet = new Set((savesRes.data as any[]).map((s: { post_id: string }) => s.post_id));
      }
    } catch {
      // Table doesn't exist yet — leave savedSet empty
    }
  }

  // Normalize the response
  const posts: FeedPost[] = filteredData.map((p) => {
    const profile = profileMap.get(p.user_id);
    return {
      id: p.id,
      user_id: p.user_id,
      pet_id: p.pet_id,
      content: p.content,
      image_url: p.image_url,
      post_type: p.post_type,
      likes_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
      created_at: p.created_at,
      owner_name: profile?.display_name ?? null,
      owner_avatar: profile?.avatar_url ?? null,
      pet_name: (p.pets as unknown as { name: string | null } | null)?.name || null,
      pet_photo: (p.pets as unknown as { photo_url: string | null } | null)?.photo_url || null,
      is_liked: likedSet.has(p.id),
      is_saved: savedSet.has(p.id),
    };
  });

  const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].created_at : null;

  return { posts, nextCursor };
}

export function useFeedPosts({
  feedType,
  filterType,
  search,
  enabled = true,
}: UseFeedPostsOptions) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-posts', feedType, filterType, search || ''],
    queryFn: ({ pageParam }) =>
      fetchFeedPage(user?.id, pageParam as string | null, feedType, filterType, search),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: feedType === 'popular' ? 60_000 : 30_000,
    refetchOnWindowFocus: true,
  });
}
