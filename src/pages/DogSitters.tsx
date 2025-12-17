import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star, 
  Home,
  CheckCircle,
  MessageCircle,
  Calendar as CalendarIcon,
  Users,
  Award,
  Heart,
  Settings,
  Clock
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface FilterState {
  searchTerm: string;
  date: Date | undefined;
  priceRange: [number, number];
  minRating: number;
  sortBy: string;
  availableNow: boolean;
}

const DogSitters = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dogsitters, setDogsitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDogsitter, setSelectedDogsitter] = useState<any>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
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
    loadDogsitters();
    checkIfProvider();
  }, [user]);

  const checkIfProvider = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('dogsitter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    setIsProvider(!!data);
  };

  const loadDogsitters = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('dogsitter_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setDogsitters([]);
        return;
      }

      const userIds = profiles.map(p => p.user_id);
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Load availability
      const { data: availData } = await supabase
        .from('provider_availability')
        .select('user_id, date')
        .eq('provider_type', 'dogsitter')
        .eq('is_available', true)
        .gte('date', format(new Date(), 'yyyy-MM-dd'));
      
      const availMap: Record<string, string[]> = {};
      availData?.forEach(a => {
        if (!availMap[a.user_id]) availMap[a.user_id] = [];
        availMap[a.user_id].push(a.date);
      });
      setAvailabilityDates(availMap);

      const profilesMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
      const combinedData = profiles.map(profile => ({
        ...profile,
        profiles: profilesMap.get(profile.user_id)
      }));

      setDogsitters(combinedData);
    } catch (error) {
      console.error('Error loading dogsitters:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar los cuidadores"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDogsitters = dogsitters.filter(ds => {
    const matchesSearch = !filters.searchTerm || 
      ds.profiles?.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      ds.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesRating = (ds.rating || 0) >= filters.minRating;
    
    const price = ds.price_per_day || 0;
    const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
    
    let matchesDate = true;
    if (filters.date) {
      const dateStr = format(filters.date, 'yyyy-MM-dd');
      const dsAvail = availabilityDates[ds.user_id] || [];
      matchesDate = dsAvail.includes(dateStr);
    }
    
    let matchesAvailableNow = true;
    if (filters.availableNow) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const dsAvail = availabilityDates[ds.user_id] || [];
      matchesAvailableNow = dsAvail.includes(todayStr);
    }
    
    return matchesSearch && matchesRating && matchesPrice && matchesDate && matchesAvailableNow;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'reviews': return (b.total_reviews || 0) - (a.total_reviews || 0);
      case 'price_asc': return (a.price_per_day || 0) - (b.price_per_day || 0);
      case 'price_desc': return (b.price_per_day || 0) - (a.price_per_day || 0);
      case 'experience': return (b.experience_years || 0) - (a.experience_years || 0);
      default: return 0;
    }
  });

  const handleOpenBooking = (ds: any) => {
    setSelectedDogsitter(ds);
    setBookingDialogOpen(true);
  };

  const handleOpenProfile = (ds: any) => {
    setSelectedDogsitter(ds);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Heart className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando cuidadores...</p>
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
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                Cuidadores de Mascotas
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Encuentra cuidadores profesionales para tu mascota
            </p>
          </div>
          <OfferServiceButton 
            serviceType="dogsitter" 
            serviceName="Cuidador"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedServiceFilters
        onFiltersChange={setFilters}
        maxPrice={100000}
        serviceType="dogsitter"
        className="mb-6"
      />

      <Tabs defaultValue="sitters" className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-3 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger 
            value="sitters"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Heart className="h-4 w-4 mr-2" />
            Cuidadores
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
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

        {/* Sitters List */}
        <TabsContent value="sitters" className="space-y-6 mt-6">
          <ServicePromotionsList serviceType="dogsitter" />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredDogsitters.length} cuidadores encontrados
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredDogsitters.map((dogsitter) => (
              <ProviderProfileCard
                key={dogsitter.id}
                provider={dogsitter}
                providerType="dogsitter"
                onViewProfile={() => handleOpenProfile(dogsitter)}
                onBook={() => handleOpenBooking(dogsitter)}
              />
            ))}
          </div>

          {filteredDogsitters.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No se encontraron cuidadores</p>
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
            serviceType="dogsitter"
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
            <ProviderAvailabilityManager providerType="dogsitter" />
          </TabsContent>
        )}
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDogsitter && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedDogsitter.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                      {selectedDogsitter.profiles?.display_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedDogsitter.profiles?.display_name}</p>
                    <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {selectedDogsitter.rating?.toFixed(1)} ({selectedDogsitter.total_reviews} reseñas)
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedDogsitter.bio}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Información</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Home className="h-4 w-4 text-primary" />
                      <span>{selectedDogsitter.home_type || "Casa"}</span>
                      {selectedDogsitter.has_yard && <Badge variant="secondary" className="text-xs">Con patio</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Hasta {selectedDogsitter.max_dogs} mascotas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{selectedDogsitter.experience_years || 0} años exp.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Award className="h-4 w-4 text-primary" />
                      <span>{selectedDogsitter.total_bookings || 0} servicios</span>
                    </div>
                    {selectedDogsitter.is_verified && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-purple-50 text-purple-700 rounded-lg col-span-2 justify-center">
                        <CheckCircle className="h-4 w-4" />
                        <span>Cuidador Verificado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tarifas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                      <span>Por noche</span>
                      <span className="font-semibold">${selectedDogsitter.price_per_night?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                      <span>Por día</span>
                      <span className="font-semibold">${selectedDogsitter.price_per_day?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    handleOpenBooking(selectedDogsitter);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Reservar Cuidado
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
        provider={selectedDogsitter ? {
          id: selectedDogsitter.id,
          user_id: selectedDogsitter.user_id,
          display_name: selectedDogsitter.profiles?.display_name || 'Cuidador',
          avatar_url: selectedDogsitter.profiles?.avatar_url,
          bio: selectedDogsitter.bio || '',
          rating: selectedDogsitter.rating || 5,
          total_reviews: selectedDogsitter.total_reviews || 0,
          price: selectedDogsitter.price_per_day || 0,
          services: selectedDogsitter.services
        } : null}
        providerType="dogsitter"
        onBookingComplete={loadDogsitters}
      />
    </div>
  );
};

export default DogSitters;
