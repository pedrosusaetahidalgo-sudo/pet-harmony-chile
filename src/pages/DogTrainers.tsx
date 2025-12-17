import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  Star, 
  Calendar,
  Award,
  Settings,
  Clock,
  Users
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

const DogTrainers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    date: undefined,
    priceRange: [0, 150000],
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
      .from('trainer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    setIsProvider(!!data);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: trainersData, error } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;

      if (trainersData && trainersData.length > 0) {
        const userIds = trainersData.map(t => t.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        // Load availability
        const { data: availData } = await supabase
          .from('provider_availability')
          .select('user_id, date')
          .eq('provider_type', 'trainer')
          .eq('is_available', true)
          .gte('date', format(new Date(), 'yyyy-MM-dd'));
        
        const availMap: Record<string, string[]> = {};
        availData?.forEach(a => {
          if (!availMap[a.user_id]) availMap[a.user_id] = [];
          availMap[a.user_id].push(a.date);
        });
        setAvailabilityDates(availMap);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        setTrainers(trainersData.map(trainer => ({
          ...trainer,
          profiles: profilesMap.get(trainer.user_id)
        })));
      } else {
        setTrainers([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de entrenadores"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = !filters.searchTerm || 
      trainer.profiles?.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      trainer.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesRating = (trainer.rating || 0) >= filters.minRating;
    
    const price = trainer.price_per_session || 0;
    const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
    
    let matchesDate = true;
    if (filters.date) {
      const dateStr = format(filters.date, 'yyyy-MM-dd');
      const trainerAvail = availabilityDates[trainer.user_id] || [];
      matchesDate = trainerAvail.includes(dateStr);
    }
    
    let matchesAvailableNow = true;
    if (filters.availableNow) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const trainerAvail = availabilityDates[trainer.user_id] || [];
      matchesAvailableNow = trainerAvail.includes(todayStr);
    }
    
    return matchesSearch && matchesRating && matchesPrice && matchesDate && matchesAvailableNow;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'reviews': return (b.total_reviews || 0) - (a.total_reviews || 0);
      case 'price_asc': return (a.price_per_session || 0) - (b.price_per_session || 0);
      case 'price_desc': return (b.price_per_session || 0) - (a.price_per_session || 0);
      case 'experience': return (b.experience_years || 0) - (a.experience_years || 0);
      default: return 0;
    }
  });

  const handleOpenBooking = (trainer: any) => {
    setSelectedTrainer(trainer);
    setBookingDialogOpen(true);
  };

  const handleOpenProfile = (trainer: any) => {
    setSelectedTrainer(trainer);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando entrenadores...</p>
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
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                Entrenadores Caninos
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Encuentra entrenadores profesionales para tu mascota
            </p>
          </div>
          <OfferServiceButton 
            serviceType="trainer" 
            serviceName="Entrenador"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedServiceFilters
        onFiltersChange={setFilters}
        maxPrice={150000}
        serviceType="trainer"
        className="mb-6"
      />

      <Tabs defaultValue="trainers" className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-3 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger 
            value="trainers"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-500 data-[state=active]:text-white"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Entrenadores
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mis Sesiones
          </TabsTrigger>
          {isProvider && (
            <TabsTrigger 
              value="manage"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Mi Agenda
            </TabsTrigger>
          )}
        </TabsList>

        {/* Trainers List */}
        <TabsContent value="trainers" className="space-y-6 mt-6">
          <ServicePromotionsList serviceType="trainer" />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredTrainers.length} entrenadores encontrados
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredTrainers.map((trainer) => (
              <ProviderProfileCard
                key={trainer.id}
                provider={trainer}
                providerType="trainer"
                onViewProfile={() => handleOpenProfile(trainer)}
                onBook={() => handleOpenBooking(trainer)}
              />
            ))}
          </div>

          {filteredTrainers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No se encontraron entrenadores</p>
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
            serviceType="trainer"
            onBookingClick={(booking) => {
              toast({
                title: "Sesión seleccionada",
                description: `Sesión #${booking.id.slice(0, 8)}`
              });
            }}
          />
        </TabsContent>

        {/* Provider Management Tab */}
        {isProvider && (
          <TabsContent value="manage" className="space-y-4 mt-6">
            <ProviderAvailabilityManager providerType="trainer" />
          </TabsContent>
        )}
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTrainer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedTrainer.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-600 to-amber-500 text-white">
                      {selectedTrainer.profiles?.display_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedTrainer.profiles?.display_name}</p>
                    <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {selectedTrainer.rating?.toFixed(1)} ({selectedTrainer.total_reviews} reseñas)
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedTrainer.bio}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Información</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{selectedTrainer.session_duration || 60} min/sesión</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Award className="h-4 w-4 text-primary" />
                      <span>{selectedTrainer.experience_years || 0} años exp.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>{selectedTrainer.total_sessions || 0} sesiones</span>
                    </div>
                    {selectedTrainer.is_verified && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-orange-50 text-orange-700 rounded-lg">
                        <Award className="h-4 w-4" />
                        <span>Verificado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tarifa</h4>
                  <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                    <span>Por sesión ({selectedTrainer.session_duration || 60} min)</span>
                    <span className="font-semibold">${selectedTrainer.price_per_session?.toLocaleString()}</span>
                  </div>
                </div>

                {selectedTrainer.specialties && Object.keys(selectedTrainer.specialties).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedTrainer.specialties).map(([key, value]: [string, any]) => (
                        value && <Badge key={key} variant="secondary">{key}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrainer.training_methods && selectedTrainer.training_methods.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Métodos de Entrenamiento</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrainer.training_methods.map((method: string) => (
                        <Badge key={method} variant="outline">{method}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:opacity-90"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    handleOpenBooking(selectedTrainer);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservar Sesión
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
        provider={selectedTrainer ? {
          id: selectedTrainer.id,
          user_id: selectedTrainer.user_id,
          display_name: selectedTrainer.profiles?.display_name || 'Entrenador',
          avatar_url: selectedTrainer.profiles?.avatar_url,
          bio: selectedTrainer.bio || '',
          rating: selectedTrainer.rating || 5,
          total_reviews: selectedTrainer.total_reviews || 0,
          price: selectedTrainer.price_per_session || 0,
          services: selectedTrainer.specialties
        } : null}
        providerType="trainer"
        onBookingComplete={loadData}
      />
    </div>
  );
};

export default DogTrainers;