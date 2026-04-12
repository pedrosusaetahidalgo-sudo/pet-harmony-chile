import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface FeedCommentsProps {
  postId: string;
  commentsCount: number;
  onViewAll: () => void;
}

export function FeedComments({ postId, commentsCount, onViewAll }: FeedCommentsProps) {
  const [previewComments, setPreviewComments] = useState<Comment[]>([]);

  const loadPreview = useCallback(async () => {
    const { data } = await supabase
      .from('post_comments')
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        profiles!post_comments_user_id_profiles_fkey (
          display_name,
          avatar_url
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(2);

    if (data) {
      setPreviewComments((data as unknown as Comment[]).reverse());
    }
  }, [postId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  return (
    <div className="px-4 pb-1">
      {/* "Ver los N comentarios" link */}
      {commentsCount > 2 && (
        <button
          className="text-sm text-muted-foreground hover:underline mb-1 block"
          onClick={onViewAll}
        >
          Ver los {commentsCount} comentarios
        </button>
      )}

      {/* Preview of latest comments */}
      {previewComments.map((comment) => (
        <p key={comment.id} className="text-sm leading-relaxed">
          <span className="font-semibold mr-1">{comment.profiles?.display_name || 'Usuario'}</span>
          <span className="text-muted-foreground">
            {comment.content.length > 100 ? comment.content.slice(0, 100) + '...' : comment.content}
          </span>
        </p>
      ))}

      {/* If few comments, show "view all" only when there are some */}
      {commentsCount > 0 && commentsCount <= 2 && (
        <button
          className="text-sm text-muted-foreground hover:underline mt-0.5 block"
          onClick={onViewAll}
        >
          Ver comentarios
        </button>
      )}
    </div>
  );
}
