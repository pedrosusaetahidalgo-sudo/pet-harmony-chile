import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Crown, Share2, MapPin, MoreVertical } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ProfessionalBadges } from '@/components/ProfessionalBadges';
import { DonorBadge } from '@/components/DonorBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfileIdentityCardProps {
  profile: {
    avatar_url?: string;
    display_name?: string;
    is_premium?: boolean;
    bio?: string;
    location?: string;
    active_title?: string | null;
  } | null;
  onEditProfile: () => void;
}

export function ProfileIdentityCard({ profile, onEditProfile }: ProfileIdentityCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '';

  const handleShare = () => {
    const shareUrl = `https://pawfriend.cl/user/${user?.id}`;
    if (navigator.share) {
      navigator.share({ title: 'Paw Friend', text: 'Mira mi perfil en Paw Friend', url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast('Link copiado', { description: 'Comparte tu perfil con amigos' });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {displayName[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              {profile?.is_premium && (
                <button
                  onClick={() => navigate('/upgrade')}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-premium-gradient text-premium-foreground shadow-premium-sm hover:opacity-90 transition-opacity"
                >
                  <Crown className="h-3 w-3" strokeWidth={2.5} />
                  PREMIUM
                </button>
              )}
            </div>

            {profile?.active_title && (
              <p className="text-xs font-semibold text-amber-600 mt-0.5 flex items-center gap-1">
                <Crown className="h-3 w-3 text-amber-500" />
                {profile.active_title}
              </p>
            )}

            {profile?.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </p>
            )}

            {profile?.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProfessionalBadges userId={user?.id || ''} />
              <DonorBadge userId={user?.id} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEditProfile}>
            Editar perfil
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
