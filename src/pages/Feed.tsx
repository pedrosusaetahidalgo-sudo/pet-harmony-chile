import { AppLayout } from "@/components/AppLayout";
import PetCard from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, TrendingUp, Users, MapPin, Video, PawPrint, Trophy } from "lucide-react";
import { DogBehaviorAnalyzer } from "@/components/DogBehaviorAnalyzer";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { CreatePost } from "@/components/CreatePost";
import { PetProfileCard } from "@/components/PetProfileCard";
import TopRatedProviders from "@/components/TopRatedProviders";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
    loadPets();
  }, []);

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

  return (
    <>
      <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
    <div className="w-full px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-warm-gradient bg-clip-text text-transparent">
              Pet Social
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Descubre las aventuras de otras mascotas
            </p>
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
            <Dialog open={showAnalyzer} onOpenChange={setShowAnalyzer}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 border-2 text-xs sm:text-sm">
                  <Video className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Analizar</span>
                  <span className="sm:hidden">Video</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Analizador de Lenguaje Corporal</DialogTitle>
                  <DialogDescription>
                    Sube un video de tu perro y descubre qué está comunicando
                  </DialogDescription>
                </DialogHeader>
                <DogBehaviorAnalyzer />
              </DialogContent>
            </Dialog>
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
        <Tabs defaultValue="all" className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 pb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="all" 
                className="rounded-lg text-xs whitespace-nowrap px-2.5 data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                Todos
              </TabsTrigger>
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
              <TabsTrigger 
                value="popular"
                className="rounded-lg text-xs whitespace-nowrap px-2.5 data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                Populares
              </TabsTrigger>
              <TabsTrigger 
                value="nearby"
                className="rounded-lg text-xs whitespace-nowrap px-2.5 data-[state=active]:bg-warm-gradient data-[state=active]:text-white"
              >
                <MapPin className="h-3.5 w-3.5 mr-1" />
                Cerca
              </TabsTrigger>
            </TabsList>
          </div>

            <TabsContent value="all" className="space-y-4 mt-4">
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
              <div className="text-center py-12 text-muted-foreground">
                <p>Comienza a seguir a otras mascotas para ver sus publicaciones aquí</p>
              </div>
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

            <TabsContent value="nearby" className="space-y-6 mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>Activa la ubicación para ver mascotas cerca de ti</p>
              </div>
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Feed;
