import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Bookmark } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface FeedPostActionsProps {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

export function FeedPostActions({
  likesCount,
  commentsCount,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onShare,
  onSave,
}: FeedPostActionsProps) {
  return (
    <div className="px-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center -ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 hover:bg-transparent"
            onClick={onLike}
          >
            <Heart
              className={cn(
                'h-6 w-6 transition-all',
                isLiked ? 'fill-red-500 text-red-500 scale-110' : 'hover:text-red-400'
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 hover:bg-transparent"
            onClick={onComment}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 hover:bg-transparent"
            onClick={onShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 hover:bg-transparent -mr-2"
          onClick={onSave}
        >
          <Bookmark className={cn('h-6 w-6 transition-all', isSaved && 'fill-current')} />
        </Button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <p className="text-sm font-semibold mt-1">
          {likesCount} {likesCount === 1 ? 'me gusta' : 'me gusta'}
        </p>
      )}
    </div>
  );
}
