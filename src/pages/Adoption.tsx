import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Heart, MessageCircle, Building2, Sparkles } from "lucide-react";
import { CreateAdoptionPost } from "@/components/CreateAdoptionPost";
import { AdoptionPostCard } from "@/components/AdoptionPostCard";
import AdoptionSheltersList from "@/components/AdoptionSheltersList";
import { useAuth } from "@/hooks/useAuth";

const Adoption = () => {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("available");

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["adoption-posts", selectedTab],
    queryFn: async () => {
      let query = supabase
        .from("adoption_posts")
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (selectedTab === "my-posts") {
        query = query.eq("user_id", user?.id);
      } else if (selectedTab === "interested") {
        // Get posts where user has shown interest
        const { data: interests } = await supabase
          .from("adoption_interests")
          .select("adoption_post_id")
          .eq("interested_user_id", user?.id);

        const postIds = interests?.map(i => i.adoption_post_id) || [];
        if (postIds.length > 0) {
          query = query.in("id", postIds);
        } else {
          return [];
        }
      } else if (selectedTab === "available") {
        query = query.eq("status", "disponible");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && selectedTab !== "shelters",
  });

  const handlePostCreated = () => {
    setShowCreateDialog(false);
    refetch();
  };

  return (
    <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-warm-gradient bg-clip-text text-transparent">
            Adopción de Mascotas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Dale un hogar a una mascota que lo necesita
          </p>
        </div>
        {selectedTab !== "shelters" && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-soft h-12"
          >
            <Plus className="h-5 w-5 mr-2" />
            Publicar Mascota
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4 pb-2">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full bg-muted/50 p-1 rounded-xl border border-border/50 shadow-soft">
            <TabsTrigger 
              value="available"
              className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4 py-2 data-[state=active]:bg-warm-gradient data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Disponibles</span>
            </TabsTrigger>
            <TabsTrigger 
              value="shelters"
              className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-md transition-all gap-1"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">Hogares IA</span>
            </TabsTrigger>
            <TabsTrigger 
              value="my-posts"
              className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4 py-2 data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <span className="hidden sm:inline">Mis Publicaciones</span>
              <span className="sm:hidden">Mis Posts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="interested"
              className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4 py-2 data-[state=active]:bg-appointment-gradient data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Me Interesa</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Shelters Tab - AI Powered */}
        <TabsContent value="shelters" className="mt-4 sm:mt-6">
          <AdoptionSheltersList />
        </TabsContent>

        {/* Regular Tabs */}
        <TabsContent value="available" className="mt-4 sm:mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <AdoptionPostCard 
                  key={post.id} 
                  post={post}
                  onUpdate={refetch}
                  isOwner={post.user_id === user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No hay mascotas disponibles
              </h3>
              <p className="text-sm text-muted-foreground">
                Sé el primero en publicar una mascota para adopción
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-posts" className="mt-4 sm:mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <AdoptionPostCard 
                  key={post.id} 
                  post={post}
                  onUpdate={refetch}
                  isOwner={post.user_id === user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No tienes publicaciones
              </h3>
              <p className="text-sm text-muted-foreground">
                Publica una mascota para dar en adopción
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interested" className="mt-4 sm:mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <AdoptionPostCard 
                  key={post.id} 
                  post={post}
                  onUpdate={refetch}
                  isOwner={post.user_id === user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No has mostrado interés en ninguna mascota
              </h3>
              <p className="text-sm text-muted-foreground">
                Explora las mascotas disponibles y muestra tu interés
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateAdoptionPost 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handlePostCreated}
      />
    </div>
  );
};

export default Adoption;
