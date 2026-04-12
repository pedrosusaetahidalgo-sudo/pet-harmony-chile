import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFeedRealtime() {
  const [newPostsCount, setNewPostsCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        () => {
          setNewPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNewPosts = useCallback(() => {
    setNewPostsCount(0);
    queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
  }, [queryClient]);

  const dismissNewPosts = useCallback(() => {
    setNewPostsCount(0);
  }, []);

  return { newPostsCount, loadNewPosts, dismissNewPosts };
}
