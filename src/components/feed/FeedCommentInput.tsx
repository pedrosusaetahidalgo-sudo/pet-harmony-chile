import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';

const COMMENT_MAX_LENGTH = 500;

interface FeedCommentInputProps {
  postId: string;
}

export function FeedCommentInput({ postId }: FeedCommentInputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    if (trimmed.length > COMMENT_MAX_LENGTH) {
      toast({
        variant: 'destructive',
        title: `El comentario no puede superar los ${COMMENT_MAX_LENGTH} caracteres`,
      });
      return;
    }
    setSubmitting(true);

    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: text.trim(),
      });
      if (error) throw error;

      setText('');
      // Invalidate feed to refresh comment counts
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    } catch {
      toast({
        variant: 'destructive',
        title: 'No se pudo publicar el comentario',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > COMMENT_MAX_LENGTH * 0.9;
  const isOverLimit = charCount > COMMENT_MAX_LENGTH;

  return (
    <div className="px-4 py-2 border-t">
      <div className="flex items-center gap-2">
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Comentario
        </label>
        <input
          id={`comment-${postId}`}
          type="text"
          placeholder="Agrega un comentario..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          maxLength={COMMENT_MAX_LENGTH}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          disabled={submitting}
        />
        {text.trim() && (
          <button
            onClick={handleSubmit}
            disabled={submitting || isOverLimit}
            className="text-primary font-semibold text-sm hover:opacity-70 transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
      {charCount > 0 && (
        <p
          className={`text-xs mt-1 text-right ${isOverLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}
        >
          {charCount}/{COMMENT_MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
