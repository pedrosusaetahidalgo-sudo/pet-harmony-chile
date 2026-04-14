import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { FeedPost } from './useFeedPosts';

export function useFeedActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Optimistic update helper — mutates cached feed pages
  interface FeedPage {
    posts: FeedPost[];
    nextCursor: string | null;
  }
  interface FeedPages {
    pages: FeedPage[];
    pageParams: unknown[];
  }

  const updatePostInCache = (postId: string, updater: (post: FeedPost) => FeedPost) => {
    queryClient.setQueriesData<FeedPages>({ queryKey: ['feed-posts'] }, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) => (p.id === postId ? updater(p) : p)),
        })),
      };
    });
  };

  const toggleLike = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['feed-posts'] });
      updatePostInCache(postId, (p) => ({
        ...p,
        is_liked: !isLiked,
        likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
      }));
    },
    onError: (_err, { postId, isLiked }) => {
      updatePostInCache(postId, (p) => ({
        ...p,
        is_liked: isLiked,
        likes_count: isLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
      }));
      toast({
        variant: 'destructive',
        title: 'No se pudo procesar tu like',
      });
    },
  });

  const toggleSave = useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      // post_saves — table created by migration, not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savesTable = (supabase as any).from('post_saves');
      try {
        if (isSaved) {
          const { error } = await savesTable.delete().eq('post_id', postId).eq('user_id', user.id);
          if (error) throw error;
        } else {
          const { error } = await savesTable.insert({ post_id: postId, user_id: user.id });
          if (error) throw error;
        }
      } catch (err: unknown) {
        // Silently ignore if table doesn't exist yet
        if (err && typeof err === 'object' && 'code' in err && err.code === '42P01') return;
        throw err;
      }
    },
    onMutate: async ({ postId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ['feed-posts'] });
      updatePostInCache(postId, (p) => ({
        ...p,
        is_saved: !isSaved,
      }));
    },
    onError: (_err, { postId, isSaved }) => {
      updatePostInCache(postId, (p) => ({
        ...p,
        is_saved: isSaved,
      }));
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar la publicación',
      });
    },
  });

  const reportPost = useMutation({
    mutationFn: async ({
      postId,
      reason,
      details,
    }: {
      postId: string;
      reason: string;
      details?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('content_reports').insert({
        post_id: postId,
        reporter_id: user.id,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Reporte enviado', description: 'Revisaremos esta publicación' });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'No se pudo enviar el reporte',
      });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast({ title: 'Publicación eliminada' });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar la publicación',
      });
    },
  });

  return { toggleLike, toggleSave, reportPost, deletePost };
}
