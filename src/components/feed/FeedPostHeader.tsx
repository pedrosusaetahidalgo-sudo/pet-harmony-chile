import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Flag, Link2, Trash2, Pin } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPostTypeLabel } from '@/lib/postTypes';

interface FeedPostHeaderProps {
  userId: string;
  ownerName: string | null;
  ownerAvatar: string | null;
  petName: string | null;
  postType: string | null;
  createdAt: string;
  onReport?: () => void;
  onDelete?: () => void;
}

export function FeedPostHeader({
  userId,
  ownerName,
  ownerAvatar,
  petName,
  postType,
  createdAt,
  onReport,
  onDelete,
}: FeedPostHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwn = user?.id === userId;

  const displayName = petName || ownerName || 'Usuario';
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: es,
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left"
        onClick={() => navigate(`/user/${userId}`)}
      >
        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
          <AvatarImage src={ownerAvatar || undefined} alt={displayName} />
          <AvatarFallback className="bg-warm-gradient text-white font-semibold text-xs">
            {getInitials(ownerName || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{displayName}</span>
            {postType && (
              <span className="text-xs text-muted-foreground">{getPostTypeLabel(postType)}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {petName && ownerName && (
              <span className="text-xs text-muted-foreground truncate">@{ownerName}</span>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/feed');
            }}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copiar enlace
          </DropdownMenuItem>
          {!isOwn && onReport && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" />
                Reportar
              </DropdownMenuItem>
            </>
          )}
          {isOwn && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
