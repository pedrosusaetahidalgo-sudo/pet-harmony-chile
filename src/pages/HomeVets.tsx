import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Stethoscope, 
  Star, 
  Calendar,
  Award,
  Heart,
  Shield,
  Settings,
  AlertCircle,
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

const HomeVets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vets, setVets] = useState<any[]>([]);
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    date: undefined,
    priceRange: [0, 200000],
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
      .from('vet_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    setIsProvider(!!data);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: vetsData, error } = await supabase
        .from('vet_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;

      if (vetsData && vetsData.length > 0) {
        const userIds = vetsData.map(v => v.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        // Load availability
        const { data: availData } = await supabase
          .from('provider_availability')
          .select('user_id, date')
          .eq('provider_type', 'veterinarian')
          .eq('is_available', true)
          .gte('date', format(new Date(), 'yyyy-MM-dd'));
        
        const availMap: Record<string, string[]> = {};
        availData?.forEach(a => {
          if (!availMap[a.user_id]) availMap[a.user_id] = [];
          availMap[a.user_id].push(a.date);
        });
        setAvailabilityDates(availMap);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        setVets(vetsData.map(vet => ({
          ...vet,
          profiles: profilesMap.get(vet.user_id)
        })));
      } else {
        setVets([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de veterinarios"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVets = vets.filter(vet => {
    const matchesSearch = !filters.searchTerm || 
      vet.profiles?.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      vet.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesRating = (vet.rating || 0) >= filters.minRating;
    
    const price = vet.consultation_fee || 0;
    const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
    
    let matchesDate = true;
    if (filters.date) {
      const dateStr = format(filters.date, 'yyyy-MM-dd');
      const vetAvail = availabilityDates[vet.user_id] || [];
      matchesDate = vetAvail.includes(dateStr);
    }
    
    let matchesAvailableNow = true;
    if (filters.availableNow) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const vetAvail = availabilityDates[vet.user_id] || [];
      matchesAvailableNow = vetAvail.includes(todayStr);
    }
    
    return matchesSearch && matchesRating && matchesPrice && matchesDate && matchesAvailableNow;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'reviews': return (b.total_reviews || 0) - (a.total_reviews || 0);
      case 'price_asc': return (a.consultation_fee || 0) - (b.consultation_fee || 0);
      case 'price_desc': return (b.consultation_fee || 0) - (a.consultation_fee || 0);
      case 'experience': return (b.experience_years || 0) - (a.experience_years || 0);
      default: return 0;
    }
  });

  const handleOpenBooking = (vet: any) => {
    setSelectedVet(vet);
    setBookingDialogOpen(true);
  };

  const handleOpenProfile = (vet: any) => {
    setSelectedVet(vet);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando veterinarios...</p>
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
              <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-green-500 bg-clip-text text-transparent">
                Veterinarios a Domicilio
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Encuentra veterinarios certificados que visitan tu hogar
            </p>
          </div>
          <OfferServiceButton 
            serviceType="veterinarian" 
            serviceName="Veterinario"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedServiceFilters
        onFiltersChange={setFilters}
        maxPrice={200000}
        serviceType="veterinarian"
        className="mb-6"
      />

      <Tabs defaultValue="vets" className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-3 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger 
            value="vets"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Veterinarios
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mis Consultas
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

        {/* Vets List */}
        <TabsContent value="vets" className="space-y-6 mt-6">
          <ServicePromotionsList serviceType="veterinarian" />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredVets.length} veterinarios encontrados
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredVets.map((vet) => (
              <ProviderProfileCard
                key={vet.id}
                provider={vet}
                providerType="veterinarian"
                onViewProfile={() => handleOpenProfile(vet)}
                onBook={() => handleOpenBooking(vet)}
              />
            ))}
          </div>

          {filteredVets.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No se encontraron veterinarios</p>
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
            serviceType="veterinarian"
            onBookingClick={(booking) => {
              toast({
                title: "Consulta seleccionada",
                description: `Consulta #${booking.id.slice(0, 8)}`
              });
            }}
          />
        </TabsContent>

        {/* Provider Management Tab */}
        {isProvider && (
          <TabsContent value="manage" className="space-y-4 mt-6">
            <ProviderAvailabilityManager providerType="veterinarian" />
          </TabsContent>
        )}
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVet && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedVet.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white">
                      {selectedVet.profiles?.display_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>Dr(a). {selectedVet.profiles?.display_name}</p>
                    <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {selectedVet.rating?.toFixed(1)} ({selectedVet.total_reviews} reseñas)
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedVet.bio}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Información Profesional</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Licencia: {selectedVet.license_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                      <Heart className="h-4 w-4 text-primary" />
                      <span>{selectedVet.total_visits || 0} consultas</span>
                    </div>
                    {selectedVet.is_verified && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-teal-50 text-teal-700 rounded-lg col-span-2 justify-center">
                        <Award className="h-4 w-4" />
                        <span>Veterinario Verificado</span>
                      </div>
                    )}
                    {selectedVet.emergency_available && (
                      <div className="flex items-center gap-2 text-sm p-3 bg-red-50 text-red-700 rounded-lg col-span-2 justify-center">
                        <AlertCircle className="h-4 w-4" />
                        <span>Disponible para Emergencias 24/7</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tarifas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                      <span>Consulta a domicilio</span>
                      <span className="font-semibold">${selectedVet.consultation_fee?.toLocaleString()}</span>
                    </div>
                    {selectedVet.emergency_fee && (
                      <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
                        <span>Atención de emergencia</span>
                        <span className="font-semibold">${selectedVet.emergency_fee?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedVet.specialties && Object.keys(selectedVet.specialties).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedVet.specialties).map(([key, value]: [string, any]) => (
                        value && <Badge key={key} variant="secondary">{key}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:opacity-90"
                  onClick={() => {
                    setProfileDialogOpen(false);
                    handleOpenBooking(selectedVet);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
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
        provider={selectedVet ? {
          id: selectedVet.id,
          user_id: selectedVet.user_id,
          display_name: selectedVet.profiles?.display_name || 'Veterinario',
          avatar_url: selectedVet.profiles?.avatar_url,
          bio: selectedVet.bio || '',
          rating: selectedVet.rating || 5,
          total_reviews: selectedVet.total_reviews || 0,
          price: selectedVet.consultation_fee || 0,
          services: selectedVet.services
        } : null}
        providerType="veterinarian"
        onBookingComplete={loadData}
      />
    </div>
  );
};

export default HomeVets;