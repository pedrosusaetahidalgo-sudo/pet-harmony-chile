import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dog, 
  Star, 
  Calendar,
  Route,
  CheckCircle2,
  Award,
  Settings,
  Users,
  DollarSign,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ServicePromotionsList } from "@/components/ServicePromotionsList";
import { OfferServiceButton } from "@/components/OfferServiceButton";
import { MyBookingsHistory } from "@/components/MyBookingsHistory";
import { ProviderAvailabilityManager } from "@/components/ProviderAvailabilityManager";
import { AdvancedServiceFilters } from "@/components/AdvancedServiceFilters";
import { EnhancedBookingDialog } from "@/components/EnhancedBookingDialog";
import { ProviderProfileCard } from "@/components/ProviderProfileCard";
import { format } from "date-fns";

interface FilterState {
  searchTerm: string;
  date: Date | undefined;
  priceRange: [number, number];
  minRating: number;
  sortBy: string;
  availableNow: boolean;
}

const DogWalkers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walkers, setWalkers] = useState<any[]>([]);
  const [selectedWalker, setSelectedWalker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    date: undefined,
    priceRange: [0, 100000],
    minRating: 0,
    sortBy: "rating",
    availableNow: false
  });
  const [availabilityDates, setAvailabilityDates] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
    checkIfProvider();
  }, [user]);

  const checkIfProvider = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('dog_walker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    setIsProvider(!!data);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load dog walkers
      const { data: walkersData } = await supabase
        .from('dog_walker_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      
      if (walkersData && walkersData.length > 0) {
        const userIds = walkersData.map(w => w.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        // Load availability for all providers
        const { data: availData } = await supabase
          .from('provider_availability')
          .select('user_id, date')
          .eq('provider_type', 'dog_walker')
          .eq('is_available', true)
          .gte('date', format(new Date(), 'yyyy-MM-dd'));
        
        const availMap: Record<string, string[]> = {};
        availData?.forEach(a => {
          if (!availMap[a.user_id]) availMap[a.user_id] = [];
          availMap[a.user_id].push(a.date);
        });
        setAvailabilityDates(availMap);

        setWalkers(walkersData.map(walker => ({
          ...walker,
          profiles: profilesMap.get(walker.user_id)
        })));
      } else {
        setWalkers([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de paseadores"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWalkers = walkers.filter(walker => {
    // Search filter
    const matchesSearch = !filters.searchTerm || 
      walker.profiles?.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      walker.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    // Rating filter
    const matchesRating = (walker.rating || 0) >= filters.minRating;
    
    // Price filter
    const price = walker.price_per_walk || 0;
    const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
    
    // Date filter
    let matchesDate = true;
    if (filters.date) {
      const dateStr = format(filters.date, 'yyyy-MM-dd');
      const walkerAvail = availabilityDates[walker.user_id] || [];
      matchesDate = walkerAvail.includes(dateStr);
    }
    
    // Available now filter
    let matchesAvailableNow = true;
    if (filters.availableNow) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const walkerAvail = availabilityDates[walker.user_id] || [];
      matchesAvailableNow = walkerAvail.includes(todayStr);
    }
    
    return matchesSearch && matchesRating && matchesPrice && matchesDate && matchesAvailableNow;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'reviews':
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      case 'price_asc':
        return (a.price_per_walk || 0) - (b.price_per_walk || 0);
      case 'price_desc':
        return (b.price_per_walk || 0) - (a.price_per_walk || 0);
      case 'experience':
        return (b.experience_years || 0) - (a.experience_years || 0);
      default:
        return 0;
    }
  });

  const handleOpenBooking = (walker: any) => {
    setSelectedWalker(walker);
    setBookingDialogOpen(true);
  };

  const handleOpenProfile = (walker: any) => {
    setSelectedWalker(walker);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Dog className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando paseadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                Paseadores de Perros
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Encuentra paseadores verificados y profesionales cerca de ti
            </p>
          </div>
          <OfferServiceButton 
            serviceType="dog_walker" 
            serviceName="Paseador"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedServiceFilters
        onFiltersChange={setFilters}
        maxPrice={100000}
        serviceType="dog_walker"
        className="mb-6"
      />

      <Tabs defaultValue="walkers" className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-3 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger 
            value="walkers"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            <Dog className="h-4 w-4 mr-2" />
            Paseadores
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mis Reservas
          </TabsTrigger>
          {isProvider && (
            <TabsTrigger 
              value="manage"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-500 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Mi Agenda
            </TabsTrigger>
          )}
        </TabsList>

        {/* Walkers List */}
        <TabsContent value="walkers" className="space-y-6 mt-6">
          {/* Promotions */}
          <ServicePromotionsList serviceType="dog_walker" />
          
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredWalkers.length} paseadores encontrados
            </p>
          </div>

          {/* Walkers Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredWalkers.map((walker) => (
              <ProviderProfileCard
                key={walker.id}
                provider={walker}
                providerType="dog_walker"
                onViewProfile={() => handleOpenProfile(walker)}
                onBook={() => handleOpenBooking(walker)}
              />
            ))}
          </div>

          {filteredWalkers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Dog className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No se encontraron paseadores</p>
                <p className="text-sm text-muted-foreground">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4 mt-6">
          <MyBookingsHistory 
            serviceType="dog_walker"
            onBookingClick={(booking) => {
              toast({
                title: "Reserva seleccionada",
                description: `Reserva #${booking.id.slice(0, 8)}`
              });
            }}
          />
        </TabsContent>

        {/* Provider Management Tab */}
        {isProvider && (
          <TabsContent value="manage" className="space-y-4 mt-6">
            <ProviderAvailabilityManager providerType="dog_walker" />
          </TabsContent>
        )}
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedWalker && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedWalker.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                      {selectedWalker.profiles?.display_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedWalker.profiles?.display_name}</p>
                    <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {selectedWalker.rating?.toFixed(1)} ({selectedWalker.total_reviews} reseñas)
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedWalker.bio}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Información</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Award className="h-4 w-4 text-primary" />
                      <span>{selectedWalker.experience_years} años de experiencia</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Dog className="h-4 w-4 text-primary" />
                      <span>{selectedWalker.total_walks} paseos completados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Hasta {selectedWalker.max_dogs} perros</span>
                    </div>
                    {selectedWalker.is_verified && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-blue-50 text-blue-700 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verificado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tarifas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-primary" />
                        Por paseo
                      </span>
                      <span className="font-semibold">${selectedWalker.price_per_walk?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Por hora
                      </span>
                      <span className="font-semibold">${selectedWalker.price_per_hour?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedWalker.services && Object.keys(selectedWalker.services).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Servicios</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedWalker.services).map(([key, value]: [string, any]) => (
                        value && <Badge key={key} variant="secondary">{key}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    handleOpenBooking(selectedWalker);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservar Paseo
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Booking Dialog */}
      <EnhancedBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        provider={selectedWalker ? {
          id: selectedWalker.id,
          user_id: selectedWalker.user_id,
          display_name: selectedWalker.profiles?.display_name || 'Paseador',
          avatar_url: selectedWalker.profiles?.avatar_url,
          bio: selectedWalker.bio || '',
          rating: selectedWalker.rating || 5,
          total_reviews: selectedWalker.total_reviews || 0,
          price: selectedWalker.price_per_walk || 0,
          services: selectedWalker.services
        } : null}
        providerType="dog_walker"
        onBookingComplete={loadData}
      />
    </div>
  );
};

export default DogWalkers;
