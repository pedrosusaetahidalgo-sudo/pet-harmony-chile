import { AppLayout } from "@/components/AppLayout";
import PetCard from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, TrendingUp, Users, MapPin, Video, PawPrint, Trophy } from "lucide-react";
// DogBehaviorAnalyzer temporarily removed - will be implemented in different tab later
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { CreatePost } from "@/components/CreatePost";
import { PetProfileCard } from "@/components/PetProfileCard";
import TopRatedProviders from "@/components/TopRatedProviders";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Feed = () => {
  const { user } = useAuth();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [followingPosts, setFollowingPosts] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
    loadPets();
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        ),
        pets:pet_id (
          name,
          photo_url
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const loadPets = async () => {
    setLoadingPets(true);
    const { data, error } = await supabase
      .from("pets")
      .select(`
        *,
        profiles:owner_id (
          display_name,
          avatar_url
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPets(data);
    }
    setLoadingPets(false);
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    
    if (data) setProfile(data);
  };

  const loadFollowingPosts = async () => {
    if (!user) return;
    setLoadingFollowing(true);
    
    try {
      // Get list of users the current user is following
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      
      if (!followingData || followingData.length === 0) {
        setFollowingPosts([]);
        setLoadingFollowing(false);
        return;
      }
      
      const followingIds = followingData.map(f => f.following_id);
      
      // Get posts from followed users
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          ),
          pets:pet_id (
            name,
            photo_url
          )
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setFollowingPosts(data);
      }
    } catch (error) {
      console.error("Error loading following posts:", error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  return (
    <>
      <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
    <div className="w-full px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-warm-gradient bg-clip-text text-transparent">
                Pet Social
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Descubre las aventuras de otras mascotas
              </p>
            </div>
            {/* User Avatar */}
            {profile && (
              <Avatar className="h-10 w-10 border-2 border-primary shadow-sm">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-warm-gradient text-white font-semibold text-sm">
                  {(() => {
                    if (profile.display_name) {
                      const nameParts = profile.display_name.trim().split(/\s+/);
                      if (nameParts.length >= 2) {
                        return `${nameParts[0][0].toUpperCase()}.${nameParts[nameParts.length - 1][0].toUpperCase()}.`;
                      }
                      return profile.display_name[0].toUpperCase();
                    }
                    return user?.email?.[0]?.toUpperCase() || "U";
                  })()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <Button className="w-full bg-warm-gradient hover:opacity-90 h-10 text-xs sm:text-sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Publicar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Publicación</DialogTitle>
                  <DialogDescription>
                    Comparte momentos especiales con la comunidad
                  </DialogDescription>
                </DialogHeader>
                <CreatePost onSuccess={() => {
                  setShowCreatePost(false);
                  loadPosts();
                }} />
              </DialogContent>
            </Dialog>
            {/* Body language analyzer temporarily removed - will be implemented in different tab later */}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="pl-9 h-10 rounded-xl border-2 focus:border-primary transition-all text-sm"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pets" className="w-full" onValueChange={(value) => {
          if (value === "following" && user) {
            loadFollowingPosts();
          }
        }}>
          <div className="overflow-x-auto -mx-3 px-3 pb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="pets"
                className="rounded-lg text-xs whitespace-nowrap px-2.5 data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <PawPrint className="h-3.5 w-3.5 mr-1" />
                Mascotas
              </TabsTrigger>
              <TabsTrigger 
                value="ranking"
                className="rounded-lg text-xs whitespace-nowrap px-2.5 data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <Trophy className="h-3.5 w-3.5 mr-1" />
                Ranking
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="rounded-lg text-xs whitespace-nowrap px-2.5 data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <Users className="h-3.5 w-3.5 mr-1" />
                Siguiendo
              </TabsTrigger>
            </TabsList>
          </div>

            <TabsContent value="pets" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando publicaciones...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No hay publicaciones todavía. ¡Sé el primero en compartir!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PetCard
                    key={post.id}
                    postId={post.id}
                    petName={post.pets?.name || ""}
                    petImage={post.image_url || post.pets?.photo_url || ""}
                    ownerName={post.profiles?.display_name || "Usuario"}
                    ownerAvatar={post.profiles?.avatar_url}
                    ownerId={post.user_id}
                    description={post.content}
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                    timeAgo={formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="pets" className="mt-6">
              {loadingPets ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando mascotas...</p>
                </div>
              ) : pets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No hay mascotas registradas todavía.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pets.map((pet) => (
                    <PetProfileCard
                      key={pet.id}
                      id={pet.id}
                      name={pet.name}
                      species={pet.species}
                      breed={pet.breed}
                      photoUrl={pet.photo_url}
                      ownerName={pet.profiles?.display_name || "Usuario"}
                      ownerAvatar={pet.profiles?.avatar_url}
                      ownerId={pet.owner_id}
                      personality={pet.personality || []}
                      bio={pet.bio}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="mt-6">
            <TopRatedProviders />
          </TabsContent>

            <TabsContent value="following" className="space-y-6 mt-6">
              {!user ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Inicia sesión para ver las publicaciones de usuarios que sigues</p>
                </div>
              ) : loadingFollowing ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando publicaciones...</p>
                </div>
              ) : followingPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">No sigues a nadie todavía</p>
                  <p className="text-sm">Comienza a seguir a otros usuarios para ver sus publicaciones aquí</p>
                </div>
              ) : (
                followingPosts.map((post) => (
                  <PetCard
                    key={post.id}
                    postId={post.id}
                    petName={post.pets?.name || ""}
                    petImage={post.image_url || post.pets?.photo_url || ""}
                    ownerName={post.profiles?.display_name || "Usuario"}
                    ownerAvatar={post.profiles?.avatar_url}
                    ownerId={post.user_id}
                    description={post.content}
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                    timeAgo={formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="popular" className="space-y-6 mt-6">
              {posts
                .filter((p) => (p.likes_count || 0) > 0)
                .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
                .slice(0, 10)
                .map((post) => (
                  <PetCard
                    key={post.id}
                    postId={post.id}
                    petName={post.pets?.name || ""}
                    petImage={post.image_url || post.pets?.photo_url || ""}
                    ownerName={post.profiles?.display_name || "Usuario"}
                    ownerAvatar={post.profiles?.avatar_url}
                    ownerId={post.user_id}
                    description={post.content}
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                    timeAgo={formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  />
                ))}
            </TabsContent>

        </Tabs>
      </div>
    </>
  );
};

export default Feed;
