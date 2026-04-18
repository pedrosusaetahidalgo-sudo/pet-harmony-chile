import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MapPin, PawPrint } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useFollows } from '@/hooks/useFollows';
import { UserPlus, UserCheck, Loader2 } from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PostComments } from '@/components/PostComments';
import { logger } from '@/lib/logger';

interface PetCardProps {
  postId: string;
  petName: string;
  petImage: string;
  ownerName: string;
  ownerAvatar?: string;
  ownerId?: string;
  location?: string;
  description: string;
  likes?: number;
  comments?: number;
  tags?: string[];
  timeAgo?: string;
}

const PetCard = ({
  postId,
  petName,
  petImage,
  ownerName,
  ownerAvatar,
  ownerId,
  location,
  description,
  likes: initialLikes = 0,
  comments: initialComments = 0,
  tags = [],
  timeAgo,
}: PetCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const { followStatus, follow, unfollow, isFollowing: isFollowLoading } = useFollows(ownerId);

  // Demo cards usan ids ficticios ("example-1") que no son UUIDs reales.
  // Saltar todas las queries a Supabase si el postId no es un UUID válido.
  const isRealPost = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);

  useEffect(() => {
    if (user && isRealPost) {
      checkIfLiked();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkIfLiked depends on user/postId/isRealPost from closure; listed deps are sufficient
  }, [user, postId, isRealPost]);

  const checkIfLiked = async () => {
    if (!user || !isRealPost) return;

    try {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      setLiked(!!data);
    } catch (error) {
      // No like found
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRealPost) {
      // Demo card: solo toggle visual local, sin tocar Supabase
      setLiked((v) => !v);
      setLikesCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
      return;
    }
    if (!user) {
      toast.error('Inicia sesión', { description: 'Debes iniciar sesión para dar like' });
      return;
    }

    try {
      if (liked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);

        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: user.id,
        });

        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
      toast.error('Algo salió mal', { description: 'No se pudo procesar tu like' });
    }
  };

  const handleOwnerClick = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (ownerId) {
      navigate(`/user/${ownerId}`);
    }
  };

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border hover:border-primary/20 rounded-xl bg-card">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleOwnerClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOwnerClick();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Avatar className="h-9 w-9 border-2 border-primary shadow-sm">
                <AvatarImage src={ownerAvatar} alt={ownerName} />
                <AvatarFallback className="bg-warm-gradient text-white font-semibold text-sm">
                  {(() => {
                    // Show initials from real name (e.g., "Maria Lopez" -> "M.L.")
                    const nameParts = ownerName.trim().split(/\s+/);
                    if (nameParts.length >= 2) {
                      return `${nameParts[0][0].toUpperCase()}.${nameParts[nameParts.length - 1][0].toUpperCase()}.`;
                    }
                    return ownerName.charAt(0).toUpperCase();
                  })()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate hover:underline">{ownerName}</p>
                {timeAgo && <p className="text-xs text-muted-foreground truncate">{timeAgo}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <MapPin className="h-3 w-3" />
                  <span className="hidden sm:inline">{location}</span>
                </div>
              )}
              {/* Follow/Unfollow Button */}
              {ownerId && user && user.id !== ownerId && followStatus && (
                <Button
                  variant={followStatus.isFollowing ? 'outline' : 'default'}
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (followStatus.isFollowing) {
                      unfollow();
                    } else {
                      follow();
                    }
                  }}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : followStatus.isFollowing ? (
                    <>
                      <UserCheck className="h-3 w-3 mr-1" />
                      Siguiendo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Seguir
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100">
            {petImage ? (
              <img
                src={petImage}
                alt={petName}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            ) : (
              // Sin foto: huella estilizada en vez del placeholder de silueta
              // humana del browser, que se veía gigante y fuera de contexto.
              <div className="w-full h-full flex items-center justify-center">
                <PawPrint className="h-16 w-16 text-amber-300" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-muted/50 gap-1"
                  onClick={handleLike}
                >
                  <Heart
                    className={`h-4 w-4 transition-all ${liked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  <span className="text-xs font-medium">{likesCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-muted/50 gap-1"
                  onClick={handleCommentsClick}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">{commentsCount}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-muted/50">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Description and Tags */}
            <div className="space-y-2 border-t pt-2">
              <p className="text-xs leading-relaxed">
                <span className="font-bold">{ownerName}</span>{' '}
                <span className="text-muted-foreground">{description}</span>
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Comments Dialog */}
        <Dialog open={showComments} onOpenChange={setShowComments}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Comentarios</DialogTitle>
              <DialogDescription>Publicación de {ownerName}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <PostComments
                postId={postId}
                onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
};

export default PetCard;
