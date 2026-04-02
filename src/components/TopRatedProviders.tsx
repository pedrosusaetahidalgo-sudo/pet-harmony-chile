import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Trophy, Dog, Home, Stethoscope, GraduationCap, Crown, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface RankedProvider {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  type: string;
}

const TopRatedProviders = () => {
  const navigate = useNavigate();
  const [walkers, setWalkers] = useState<RankedProvider[]>([]);
  const [sitters, setSitters] = useState<RankedProvider[]>([]);
  const [vets, setVets] = useState<RankedProvider[]>([]);
  const [trainers, setTrainers] = useState<RankedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    try {
      // Load from unified service_providers table - global and unique ranking
      const { data: allProvidersData } = await supabase
        .from("service_providers")
        .select(`
          id,
          user_id,
          rating,
          total_reviews,
          is_verified,
          status,
          display_name,
          avatar_url,
          provider_service_offerings!inner(service_type)
        `)
        .eq("status", "approved")
        .gt("total_reviews", 0)
        .order("rating", { ascending: false })
        .order("total_reviews", { ascending: false });

      if (!allProvidersData) {
        setWalkers([]);
        setSitters([]);
        setVets([]);
        setTrainers([]);
        setLoading(false);
        return;
      }

      // Get unique providers (one entry per user_id, best rating)
      const uniqueProviders = new Map();
      allProvidersData.forEach(provider => {
        const existing = uniqueProviders.get(provider.user_id);
        if (!existing || provider.rating > existing.rating) {
          uniqueProviders.set(provider.user_id, provider);
        }
      });

      // Group by service type
      const walkersList: RankedProvider[] = [];
      const sittersList: RankedProvider[] = [];
      const vetsList: RankedProvider[] = [];
      const trainersList: RankedProvider[] = [];

      uniqueProviders.forEach(provider => {
        const serviceTypes = provider.provider_service_offerings?.map((o: any) => o.service_type) || [];
        
        const providerData: RankedProvider = {
          id: provider.id,
          user_id: provider.user_id,
          display_name: provider.display_name || "Profesional",
          avatar_url: provider.avatar_url,
          rating: provider.rating || 0,
          total_reviews: provider.total_reviews || 0,
          is_verified: provider.is_verified || false,
          type: serviceTypes[0] || "unknown"
        };

        // Add to appropriate lists based on service types
        if (serviceTypes.includes("dog_walker")) {
          walkersList.push({ ...providerData, type: "walker" });
        }
        if (serviceTypes.includes("dogsitter")) {
          sittersList.push({ ...providerData, type: "sitter" });
        }
        if (serviceTypes.includes("veterinarian")) {
          vetsList.push({ ...providerData, type: "vet" });
        }
        if (serviceTypes.includes("trainer")) {
          trainersList.push({ ...providerData, type: "trainer" });
        }
      });

      // Sort each list and limit to top 10
      const sortAndLimit = (list: RankedProvider[]) => 
        list.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.total_reviews - a.total_reviews;
        }).slice(0, 10);

      setWalkers(sortAndLimit(walkersList));
      setSitters(sortAndLimit(sittersList));
      setVets(sortAndLimit(vetsList));
      setTrainers(sortAndLimit(trainersList));
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const getNavigationRoute = (type: string) => {
    switch (type) {
      case "walker":
        return "/services/walkers";
      case "sitter":
        return "/services/sitters";
      case "vet":
        return "/services/vets";
      default:
        return "/";
    }
  };

  const ProvidersList = ({ providers, emptyMessage }: { providers: RankedProvider[], emptyMessage: string }) => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Cargando ranking...</p>
        </div>
      );
    }

    if (providers.length === 0) {
      return (
        <div className="text-center py-8">
          <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {providers.map((provider, index) => (
          <Card 
            key={provider.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              index === 0 ? "border-yellow-500/50 bg-yellow-500/5" :
              index === 1 ? "border-gray-400/50 bg-gray-100/5" :
              index === 2 ? "border-amber-600/50 bg-amber-600/5" : ""
            }`}
            onClick={() => navigate(`/user/${provider.user_id}`)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-shrink-0 w-6 flex justify-center">
                {getRankIcon(index)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={provider.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {provider.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{provider.display_name}</p>
                  {provider.is_verified && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {provider.total_reviews} reseñas
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">{provider.rating.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Profesionales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="walkers" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="walkers" className="text-xs">
              <Dog className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Paseadores</span>
            </TabsTrigger>
            <TabsTrigger value="sitters" className="text-xs">
              <Home className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Cuidadores</span>
            </TabsTrigger>
            <TabsTrigger value="vets" className="text-xs">
              <Stethoscope className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Vets</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Entrenadores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="walkers">
            <ProvidersList 
              providers={walkers} 
              emptyMessage="Aún no hay paseadores calificados" 
            />
            {walkers.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => navigate("/services/walkers")}
              >
                Ver todos los paseadores
              </Button>
            )}
          </TabsContent>

          <TabsContent value="sitters">
            <ProvidersList 
              providers={sitters} 
              emptyMessage="Aún no hay cuidadores calificados" 
            />
            {sitters.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => navigate("/services/sitters")}
              >
                Ver todos los cuidadores
              </Button>
            )}
          </TabsContent>

          <TabsContent value="vets">
            <ProvidersList 
              providers={vets} 
              emptyMessage="Aún no hay veterinarios calificados" 
            />
            {vets.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => navigate("/services/vets")}
              >
                Ver todos los veterinarios
              </Button>
            )}
          </TabsContent>

          <TabsContent value="trainers">
            <ProvidersList 
              providers={trainers} 
              emptyMessage="Aún no hay entrenadores calificados" 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TopRatedProviders;
