import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useFeedActions } from '@/hooks/useFeedActions';
import type { FeedPost as FeedPostType } from '@/hooks/useFeedPosts';
import { FeedPostHeader } from './FeedPostHeader';
import { FeedPostMedia } from './FeedPostMedia';
import { FeedPostActions } from './FeedPostActions';
import { FeedPostCaption } from './FeedPostCaption';
import { FeedComments } from './FeedComments';
import { FeedCommentInput } from './FeedCommentInput';
import { PostComments } from '@/components/PostComments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'misinformation', label: 'Informacion falsa' },
  { value: 'other', label: 'Otro' },
] as const;

interface FeedPostCardProps {
  post: FeedPostType;
  onHashtagClick?: (tag: string) => void;
}

export function FeedPostCard({ post, onHashtagClick }: FeedPostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleLike, toggleSave, reportPost, deletePost } = useFeedActions();
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleLike = () => {
    if (!user) {
      toast.error('Inicia sesion para dar like');
      return;
    }
    toggleLike.mutate({ postId: post.id, isLiked: post.is_liked });
  };

  const handleSave = () => {
    if (!user) return;
    toggleSave.mutate({ postId: post.id, isSaved: post.is_saved });
  };

  const handleShare = () => {
    const url = window.location.origin + '/feed';
    if (navigator.share) {
      navigator.share({ title: 'Mira esta publicación en Paw Friend', url });
    } else {
      navigator.clipboard.writeText(url);
      toast('Enlace copiado');
    }
  };

  const handleReport = (reason: string) => {
    reportPost.mutate({ postId: post.id, reason });
    setShowReport(false);
  };

  const handleDelete = () => {
    if (window.confirm('¿Seguro que quieres eliminar esta publicación?')) {
      deletePost.mutate(post.id);
    }
  };

  return (
    <>
      <article className="bg-card border-b last:border-b-0 sm:rounded-xl sm:border sm:mb-4 overflow-hidden">
        <FeedPostHeader
          userId={post.user_id}
          ownerName={post.owner_name}
          ownerAvatar={post.owner_avatar}
          petName={post.pet_name}
          postType={post.post_type}
          createdAt={post.created_at}
          onReport={() => setShowReport(true)}
          onDelete={user?.id === post.user_id ? handleDelete : undefined}
        />

        <FeedPostMedia
          imageUrl={post.image_url}
          petPhoto={post.pet_photo}
          petName={post.pet_name}
          isLiked={post.is_liked}
          onDoubleTapLike={handleLike}
        />

        <FeedPostActions
          likesCount={post.likes_count}
          commentsCount={post.comments_count}
          isLiked={post.is_liked}
          isSaved={post.is_saved}
          onLike={handleLike}
          onComment={() => setShowComments(true)}
          onShare={handleShare}
          onSave={handleSave}
        />

        <FeedPostCaption
          ownerName={post.owner_name}
          petName={post.pet_name}
          content={post.content}
          onHashtagClick={onHashtagClick}
        />

        <FeedComments
          postId={post.id}
          commentsCount={post.comments_count}
          onViewAll={() => setShowComments(true)}
        />

        <FeedCommentInput postId={post.id} />
      </article>

      {/* Full comments dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comentarios</DialogTitle>
            <DialogDescription>
              Publicación de {post.pet_name || post.owner_name || 'Usuario'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <PostComments postId={post.id} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reportar publicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <Button
                key={r.value}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReport(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
