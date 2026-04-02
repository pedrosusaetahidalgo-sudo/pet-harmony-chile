import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Grid, 
  Heart, 
  MessageSquare,
  Trophy,
  Star,
  PawPrint,
  Users,
  UserPlus,
  UserMinus,
  MessageCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { ProfessionalBadges } from "@/components/ProfessionalBadges";
import { useStartConversation } from "@/hooks/useStartConversation";
import dogProfile from "@/assets/dog-profile-1.jpg";
import catProfile from "@/assets/cat-profile-1.jpg";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startConversation } = useStartConversation();
  
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfileData();
      checkFollowStatus();
    }
  }, [userId]);

  const checkFollowStatus = async () => {
    if (!user || isOwnProfile) return;
    
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || isOwnProfile) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        
        setIsFollowing(false);
        toast({
          title: "Dejaste de seguir",
          description: "Ya no sigues a este usuario"
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        
        setIsFollowing(true);
        toast({
          title: "¡Siguiendo!",
          description: "Ahora sigues a este usuario"
        });
      }
      
      loadProfileData();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el seguimiento"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!userId) return;
    await startConversation(userId);
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);

      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      setUserStats(statsData);

      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      setPets(petsData || []);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12);
      
      setPosts(postsData || []);

    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información del perfil"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Usuario no encontrado</p>
          <Button onClick={() => navigate('/feed')} className="mt-4">
            Volver al Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-3 py-4 sm:px-4 sm:py-6 md:py-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-start sm:items-center">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 ring-4 ring-primary/20 mx-auto sm:mx-0">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-warm-gradient text-white text-2xl sm:text-3xl font-bold">
                  {profile?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 w-full">
                <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {profile?.display_name || 'Usuario'}
                    </h1>
                    {profile?.bio && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {profile.bio}
                      </p>
                    )}
                    {profile?.location && (
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                        <PawPrint className="h-3 w-3" />
                        {profile.location}
                      </p>
                    )}
                    
                    <div className="mt-3">
                      <ProfessionalBadges userId={userId || ''} />
                    </div>
                  </div>
                  
                  {!isOwnProfile && (
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Siguiendo
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Seguir
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleMessage}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Mensaje
                      </Button>
                    </div>
                  )}

                  {isOwnProfile && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/profile')}
                      className="w-full"
                    >
                      Ver mi perfil completo
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">{posts.length}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">{userStats?.followers_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">{userStats?.following_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Siguiendo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">{pets.length}</p>
                    <p className="text-xs text-muted-foreground">Mascotas</p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">{userStats?.total_points || 0} pts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Nivel {userStats?.level || 1}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto p-1 bg-muted/50 rounded-xl border border-border/50">
          <TabsTrigger 
            value="posts"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs py-2.5"
          >
            <Grid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden xs:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pets"
            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs py-2.5"
          >
            <PawPrint className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden xs:inline">Mascotas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Grid className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay publicaciones aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {posts.map((post) => (
                <div 
                  key={post.id}
                  className="relative aspect-square group cursor-pointer overflow-hidden rounded-md sm:rounded-lg"
                >
                  <img 
                    src={post.image_url || dogProfile} 
                    alt="Post"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                      <span className="text-xs sm:text-sm font-semibold">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                      <span className="text-xs sm:text-sm font-semibold">{post.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pets" className="mt-6">
          {pets.length === 0 ? (
            <div className="text-center py-12">
              <PawPrint className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay mascotas públicas</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {pets.map((pet) => (
                <Card 
                  key={pet.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={pet.photo_url || (pet.species === 'perro' ? dogProfile : catProfile)} 
                        alt={pet.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">{pet.name}</h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {pet.species}
                        </Badge>
                        {pet.breed && (
                          <span className="text-xs truncate">{pet.breed}</span>
                        )}
                      </div>
                      {pet.personality && pet.personality.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pet.personality.slice(0, 2).map((trait: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
