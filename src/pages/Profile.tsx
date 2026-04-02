import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, 
  Share2, 
  Grid, 
  Heart, 
  MessageSquare,
  Trophy,
  Star,
  PawPrint,
  Edit,
  UserPlus,
  Users,
  Briefcase
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProfessionalBadges } from "@/components/ProfessionalBadges";
import { CreateServicePromotion } from "@/components/CreateServicePromotion";
import UserReviewHistory from "@/components/UserReviewHistory";
import PendingReviewsList from "@/components/PendingReviewsList";
import PointsWidget from "@/components/PointsWidget";
import AchievementBadge from "@/components/AchievementBadge";
import MissionCard from "@/components/MissionCard";
import { useGamification } from "@/hooks/useGamification";
import dogProfile from "@/assets/dog-profile-1.jpg";
import catProfile from "@/assets/cat-profile-1.jpg";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats, achievements, missions } = useGamification();

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Load stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setUserStats(statsData);

      // Load pets
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });
      
      setPets(petsData || []);

      // Load posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
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

  return (
    <div className="container px-3 py-4 sm:px-4 sm:py-6 md:py-8 max-w-5xl mx-auto animate-fade-in">
        {/* Profile Header */}
        <div className="mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-start sm:items-center">
                {/* Avatar */}
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 ring-4 ring-primary/20 mx-auto sm:mx-0">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-warm-gradient text-white text-2xl sm:text-3xl font-bold">
                    {profile?.display_name?.[0] || user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Profile Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-center sm:text-left">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                        {profile?.display_name || user?.email?.split("@")[0]}
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
                      
                      {/* Professional Badges */}
                      <div className="mt-3">
                        <ProfessionalBadges userId={user?.id || ''} />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate('/settings')}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden xs:inline ml-2">Editar</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-8 mb-3 sm:mb-0">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{posts.length}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{userStats?.followers_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Seguidores</p>
                    </div>
                    <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{userStats?.following_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Siguiendo</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{pets.length}</p>
                      <p className="text-xs text-muted-foreground">Mascotas</p>
                    </div>
                  </div>

                  {/* Game Stats - New Gamification System */}
                  {stats && (
                    <div className="mt-3 sm:mt-4">
                      <PointsWidget 
                        points={stats.points} 
                        level={stats.level}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl border border-border/50">
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
            <TabsTrigger 
              value="reviews"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs py-2.5"
            >
              <Star className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Reseñas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs py-2.5"
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Logros</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs py-2.5"
            >
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Servicios</span>
            </TabsTrigger>
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts" className="mt-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No hay publicaciones aún</p>
                <Button 
                  onClick={() => navigate('/feed')}
                  className="bg-warm-gradient hover:opacity-90"
                >
                  Crear Primera Publicación
                </Button>
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

          {/* Pets Grid */}
          <TabsContent value="pets" className="mt-6">
            {pets.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No has registrado mascotas aún</p>
                <Button 
                  onClick={() => navigate('/add-pet')}
                  className="bg-warm-gradient hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Mascota
                </Button>
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
                
                {/* Add Pet Card */}
                <Card 
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-dashed"
                  onClick={() => navigate('/add-pet')}
                >
                  <CardContent className="p-0 h-full flex items-center justify-center aspect-square">
                    <div className="text-center p-4 sm:p-6">
                      <div className="p-3 sm:p-4 rounded-full bg-primary/10 inline-flex mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      </div>
                      <p className="font-semibold text-xs sm:text-sm">Agregar Mascota</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6 space-y-6">
            <PendingReviewsList />
            <UserReviewHistory />
          </TabsContent>

          {/* Achievements - New Gamification System */}
          <TabsContent value="achievements" className="mt-6">
            <div className="space-y-6">
              {/* Points Widget */}
              {stats && (
                <PointsWidget 
                  points={stats.points} 
                  level={stats.level}
                  showProgress={true}
                />
              )}

              {/* Achievements Grid */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg mb-4">Logros Desbloqueados</h3>
                  {achievements && achievements.length > 0 ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {achievements.map((achievement) => (
                        <AchievementBadge
                          key={achievement.id}
                          code={achievement.code}
                          name={achievement.name}
                          description={achievement.description}
                          unlockedAt={achievement.unlocked_at}
                          size="md"
                          showTooltip={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Aún no has desbloqueado logros</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Completa acciones para ganar puntos y desbloquear logros
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Missions */}
              {missions && missions.length > 0 && (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold text-base sm:text-lg mb-4">Misiones Activas</h3>
                    <div className="space-y-3">
                      {missions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <CreateServicePromotion 
              onSuccess={() => {
                toast({
                  title: "¡Éxito!",
                  description: "Tu publicación ha sido enviada para revisión"
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Profile;
