import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';

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
    if (!text.trim() || submitting) return;
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

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t">
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
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        disabled={submitting}
      />
      {text.trim() && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-primary font-semibold text-sm hover:opacity-70 transition-opacity"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
