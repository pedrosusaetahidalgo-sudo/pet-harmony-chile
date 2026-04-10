import { PageHeader } from "@/components/PageHeader";
import { LINKS } from "@/lib/links";
import PetCard from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, TrendingUp, Users, MapPin, Video, PawPrint, Trophy, Filter } from "@/lib/icons";
import { EmptyState } from "@/components/EmptyState";
import { logger } from "@/lib/logger";
// DogBehaviorAnalyzer temporarily removed - will be implemented in different tab later
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { CreatePost } from "@/components/CreatePost";
import { POST_TYPES } from "@/lib/postTypes";
import { Badge } from "@/components/ui/badge";
import { PetProfileCard } from "@/components/PetProfileCard";
import TopRatedProviders from "@/components/TopRatedProviders";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
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
  const { filterBlocked } = useBlockedUsers();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();
  const POSTS_PAGE_SIZE = 20;

  useEffect(() => {
    loadPosts();
    loadPets();
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadPosts = async (append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const query = supabase
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
      .order("created_at", { ascending: false })
      .limit(POSTS_PAGE_SIZE);

    if (append && posts.length > 0) {
      const lastDate = posts[posts.length - 1].created_at;
      query.lt("created_at", lastDate);
    }

    const { data, error } = await query;

    if (!error && data) {
      if (append) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMorePosts(data.length === POSTS_PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
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
      .eq("lifecycle_status", "active")
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
      logger.error("Error loading following posts:", error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  return (
    <>
      <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
      <PageHeader
        title="Comunidad"
        subtitle="Fotos y publicaciones de la comunidad"
        actions={
          profile ? (
            <Avatar className="h-10 w-10 border-2 border-primary shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-warm-gradient text-white font-semibold text-sm">
                {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : null
        }
      />
    <div className="w-full px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
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
            placeholder="Buscar mascotas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-2 focus:border-primary transition-all text-sm"
          />
        </div>

        {/* Post type filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <Badge
            variant={filterType === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap shrink-0"
            onClick={() => setFilterType(null)}
          >
            Todos
          </Badge>
          {POST_TYPES.map((pt) => (
            <Badge
              key={pt.value}
              variant={filterType === pt.value ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setFilterType(filterType === pt.value ? null : pt.value)}
            >
              {pt.emoji} {pt.label}
            </Badge>
          ))}
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

            {/* Feed Posts - shown above tabs */}
            <div className="space-y-4 mb-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filterBlocked(posts, "user_id").length === 0 ? (
                <EmptyState icon={PawPrint} title="No hay publicaciones todavía" description="¡Sé el primero en compartir una foto de tu mascota!" actionLabel="Publicar" onAction={() => setShowCreatePost(true)} />
              ) : (
                filterBlocked(posts, "user_id")
                  .filter((post) => {
                    if (filterType && post.post_type !== filterType) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      post.content?.toLowerCase().includes(q) ||
                      post.pets?.name?.toLowerCase().includes(q) ||
                      post.profiles?.display_name?.toLowerCase().includes(q)
                    );
                  })
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
                ))
              )}
              {!loading && hasMorePosts && posts.length > 0 && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPosts(true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Cargando..." : "Ver más publicaciones"}
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="pets" className="mt-6">
              {loadingPets ? (
                <div className="text-center py-8 md:py-12">
                  <p className="text-muted-foreground">Cargando mascotas...</p>
                </div>
              ) : filterBlocked(pets, "owner_id").length === 0 ? (
                <EmptyState icon={Search} title="No hay mascotas registradas" description="Explora el feed para descubrir mascotas" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterBlocked(pets, "owner_id")
                    .filter((pet) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        pet.name?.toLowerCase().includes(q) ||
                        pet.breed?.toLowerCase().includes(q) ||
                        pet.species?.toLowerCase().includes(q) ||
                        pet.profiles?.display_name?.toLowerCase().includes(q)
                      );
                    })
                    .map((pet) => (
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
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <p>Inicia sesión para ver las publicaciones de usuarios que sigues</p>
                </div>
              ) : loadingFollowing ? (
                <div className="text-center py-8 md:py-12">
                  <p className="text-muted-foreground">Cargando publicaciones...</p>
                </div>
              ) : followingPosts.length === 0 ? (
                <EmptyState icon={Users} title="No sigues a nadie todavía" description="Sigue a otros dueños para ver sus publicaciones" actionLabel="Explorar" actionUrl="/feed" />
              ) : (
                filterBlocked(followingPosts, "user_id").map((post) => (
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
              {filterBlocked(posts, "user_id")
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
