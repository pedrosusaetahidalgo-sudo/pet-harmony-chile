import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dog,
  Stethoscope,
  ShieldCheck,
  GraduationCap,
  Star,
  Calendar,
  Route,
  CheckCircle2,
  CheckCircle,
  Award,
  Settings,
  Users,
  Clock,
  Heart,
  Shield,
  AlertCircle,
  Home,
  type LucideIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
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
import { logger } from "@/lib/logger";

type ServiceType = 'walkers' | 'vets' | 'sitters' | 'trainers';
type ProfileTable = "dog_walker_profiles" | "vet_profiles" | "dogsitter_profiles" | "trainer_profiles";

interface FilterState {
  searchTerm: string;
  date: Date | undefined;
  priceRange: [number, number];
  minRating: number;
  sortBy: string;
  availableNow: boolean;
}

interface ServiceConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  profileTable: ProfileTable;
  providerType: string;
  serviceName: string;
  maxPrice: number;
  priceField: string;
  gradient: string;
  gradientFrom: string;
  loadingAnimation: string;
  loadingText: string;
  listTabLabel: string;
  bookingsTabLabel: string;
  emptyText: string;
  resultLabel: string;
  bookingToastLabel: string;
  bookButtonLabel: string;
  defaultDisplayName: string;
}

const SERVICE_CONFIG: Record<ServiceType, ServiceConfig> = {
  walkers: {
    title: "Paseadores de Perros",
    subtitle: "Encuentra paseadores verificados y profesionales cerca de ti",
    icon: Dog,
    profileTable: "dog_walker_profiles",
    providerType: "dog_walker",
    serviceName: "Paseador",
    maxPrice: 100000,
    priceField: "price_per_walk",
    gradient: "from-blue-600 via-cyan-500 to-teal-500",
    gradientFrom: "from-blue-600 to-cyan-500",
    loadingAnimation: "animate-bounce",
    loadingText: "Cargando paseadores...",
    listTabLabel: "Paseadores",
    bookingsTabLabel: "Mis Reservas",
    emptyText: "No se encontraron paseadores",
    resultLabel: "paseadores encontrados",
    bookingToastLabel: "Reserva seleccionada",
    bookButtonLabel: "Reservar Paseo",
    defaultDisplayName: "Paseador",
  },
  vets: {
    title: "Veterinarios a Domicilio",
    subtitle: "Encuentra veterinarios certificados que visitan tu hogar",
    icon: Stethoscope,
    profileTable: "vet_profiles",
    providerType: "veterinarian",
    serviceName: "Veterinario",
    maxPrice: 200000,
    priceField: "consultation_fee",
    gradient: "from-teal-600 via-emerald-500 to-green-500",
    gradientFrom: "from-teal-600 to-emerald-500",
    loadingAnimation: "animate-pulse",
    loadingText: "Cargando veterinarios...",
    listTabLabel: "Veterinarios",
    bookingsTabLabel: "Mis Consultas",
    emptyText: "No se encontraron veterinarios",
    resultLabel: "veterinarios encontrados",
    bookingToastLabel: "Consulta seleccionada",
    bookButtonLabel: "Agendar Consulta",
    defaultDisplayName: "Veterinario",
  },
  sitters: {
    title: "Cuidadores de Mascotas",
    subtitle: "Encuentra cuidadores profesionales para tu mascota",
    icon: Heart,
    profileTable: "dogsitter_profiles",
    providerType: "dogsitter",
    serviceName: "Cuidador",
    maxPrice: 100000,
    priceField: "price_per_day",
    gradient: "from-purple-600 via-pink-500 to-violet-500",
    gradientFrom: "from-purple-600 to-pink-500",
    loadingAnimation: "animate-bounce",
    loadingText: "Cargando cuidadores...",
    listTabLabel: "Cuidadores",
    bookingsTabLabel: "Mis Reservas",
    emptyText: "No se encontraron cuidadores",
    resultLabel: "cuidadores encontrados",
    bookingToastLabel: "Reserva seleccionada",
    bookButtonLabel: "Reservar Cuidado",
    defaultDisplayName: "Cuidador",
  },
  trainers: {
    title: "Entrenadores Caninos",
    subtitle: "Encuentra entrenadores profesionales para tu mascota",
    icon: GraduationCap,
    profileTable: "trainer_profiles",
    providerType: "trainer",
    serviceName: "Entrenador",
    maxPrice: 150000,
    priceField: "price_per_session",
    gradient: "from-orange-600 via-amber-500 to-yellow-500",
    gradientFrom: "from-orange-600 to-amber-500",
    loadingAnimation: "animate-bounce",
    loadingText: "Cargando entrenadores...",
    listTabLabel: "Entrenadores",
    bookingsTabLabel: "Mis Sesiones",
    emptyText: "No se encontraron entrenadores",
    resultLabel: "entrenadores encontrados",
    bookingToastLabel: "Sesión seleccionada",
    bookButtonLabel: "Reservar Sesión",
    defaultDisplayName: "Entrenador",
  },
};

// --- Profile dialog renderers per service type ---

function WalkerProfileDetails({ provider }: { provider: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Award className="h-4 w-4 text-primary" />
            <span>{provider.experience_years} años de experiencia</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Dog className="h-4 w-4 text-primary" />
            <span>{provider.total_walks} paseos completados</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span>Hasta {provider.max_dogs} perros</span>
          </div>
          {provider.is_verified && (
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
            <span className="font-semibold">${provider.price_per_walk?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Por hora
            </span>
            <span className="font-semibold">${provider.price_per_hour?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {provider.services && Object.keys(provider.services).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Servicios</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(provider.services).map(([key, value]: [string, any]) => (
              value && <Badge key={key} variant="secondary">{key}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VetProfileDetails({ provider }: { provider: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información Profesional</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Shield className="h-4 w-4 text-primary" />
            <span>Licencia: {provider.license_number}</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Heart className="h-4 w-4 text-primary" />
            <span>{provider.total_visits || 0} consultas</span>
          </div>
          {provider.is_verified && (
            <div className="flex items-center gap-2 text-sm p-3 bg-teal-50 text-teal-700 rounded-lg col-span-2 justify-center">
              <Award className="h-4 w-4" />
              <span>Veterinario Verificado</span>
            </div>
          )}
          {provider.emergency_available && (
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
            <span className="font-semibold">${provider.consultation_fee?.toLocaleString()}</span>
          </div>
          {provider.emergency_fee && (
            <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
              <span>Atención de emergencia</span>
              <span className="font-semibold">${provider.emergency_fee?.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {provider.specialties && Object.keys(provider.specialties).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(provider.specialties).map(([key, value]: [string, any]) => (
              value && <Badge key={key} variant="secondary">{key}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SitterProfileDetails({ provider }: { provider: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Home className="h-4 w-4 text-primary" />
            <span>{provider.home_type || "Casa"}</span>
            {provider.has_yard && <Badge variant="secondary" className="text-xs">Con patio</Badge>}
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span>Hasta {provider.max_dogs} mascotas</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <span>{provider.experience_years || 0} años exp.</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Award className="h-4 w-4 text-primary" />
            <span>{provider.total_bookings || 0} servicios</span>
          </div>
          {provider.is_verified && (
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
            <span className="font-semibold">${provider.price_per_night?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
            <span>Por día</span>
            <span className="font-semibold">${provider.price_per_day?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainerProfileDetails({ provider }: { provider: any }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <span>{provider.session_duration || 60} min/sesión</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Award className="h-4 w-4 text-primary" />
            <span>{provider.experience_years || 0} años exp.</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>{provider.total_sessions || 0} sesiones</span>
          </div>
          {provider.is_verified && (
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
          <span>Por sesión ({provider.session_duration || 60} min)</span>
          <span className="font-semibold">${provider.price_per_session?.toLocaleString()}</span>
        </div>
      </div>

      {provider.specialties && Object.keys(provider.specialties).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(provider.specialties).map(([key, value]: [string, any]) => (
              value && <Badge key={key} variant="secondary">{key}</Badge>
            ))}
          </div>
        </div>
      )}

      {provider.training_methods && provider.training_methods.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Métodos de Entrenamiento</h4>
          <div className="flex flex-wrap gap-2">
            {provider.training_methods.map((method: string) => (
              <Badge key={method} variant="outline">{method}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PROFILE_DETAILS: Record<ServiceType, React.ComponentType<{ provider: any }>> = {
  walkers: WalkerProfileDetails,
  vets: VetProfileDetails,
  sitters: SitterProfileDetails,
  trainers: TrainerProfileDetails,
};

// Helper to get price from provider based on service type
function getProviderPrice(provider: any, serviceType: ServiceType): number {
  switch (serviceType) {
    case 'walkers': return provider.price_per_walk || 0;
    case 'vets': return provider.consultation_fee || 0;
    case 'sitters': return provider.price_per_day || 0;
    case 'trainers': return provider.price_per_session || 0;
  }
}

// Helper to get services/specialties for booking dialog
function getProviderServices(provider: any, serviceType: ServiceType) {
  if (serviceType === 'trainers') return provider.specialties;
  return provider.services;
}

// Helper for profile dialog display name prefix (vets get "Dr(a).")
function getDisplayNamePrefix(serviceType: ServiceType): string {
  return serviceType === 'vets' ? 'Dr(a). ' : '';
}

// --- Main component ---

const ServiceDirectory = () => {
  const { type } = useParams<{ type: string }>();
  const serviceType = type as ServiceType;

  // Validate service type
  if (!type || !SERVICE_CONFIG[serviceType]) {
    return <Navigate to="/home" replace />;
  }

  const config = SERVICE_CONFIG[serviceType];
  const ProfileDetails = PROFILE_DETAILS[serviceType];
  const IconComponent = config.icon;

  const { user } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    date: undefined,
    priceRange: [0, config.maxPrice],
    minRating: 0,
    sortBy: "rating",
    availableNow: false
  });
  const [availabilityDates, setAvailabilityDates] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadData();
    checkIfProvider();
  }, [user, serviceType]);

  // Reset state when service type changes
  useEffect(() => {
    setProviders([]);
    setSelectedProvider(null);
    setIsProvider(false);
    setFilters({
      searchTerm: "",
      date: undefined,
      priceRange: [0, config.maxPrice],
      minRating: 0,
      sortBy: "rating",
      availableNow: false
    });
    setAvailabilityDates({});
  }, [serviceType]);

  const checkIfProvider = async () => {
    if (!user) return;
    const { data } = await supabase
      .from(config.profileTable)
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    setIsProvider(!!data);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: providersData, error } = await supabase
        .from(config.profileTable)
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      if (providersData && providersData.length > 0) {
        const userIds = (providersData as Record<string, unknown>[]).map((p) => p.user_id as string);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          logger.error('Error loading profiles', profilesError);
        }

        // Load availability
        const { data: availData, error: availError } = await supabase
          .from('provider_availability')
          .select('user_id, date')
          .eq('provider_type', config.providerType)
          .eq('is_available', true)
          .gte('date', format(new Date(), 'yyyy-MM-dd'));

        if (availError) {
          logger.error('Error loading availability', availError);
        }

        const availMap: Record<string, string[]> = {};
        availData?.forEach(a => {
          if (!availMap[a.user_id]) availMap[a.user_id] = [];
          availMap[a.user_id].push(a.date);
        });
        setAvailabilityDates(availMap);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        setProviders((providersData as Record<string, unknown>[]).map((provider: Record<string, unknown>) => ({
          ...provider,
          profiles: profilesMap.get(provider.user_id)
        })));
      } else {
        setProviders([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo cargar la información de ${config.listTabLabel.toLowerCase()}`
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !filters.searchTerm ||
      provider.profiles?.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      provider.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesRating = (provider.rating || 0) >= filters.minRating;

    const price = getProviderPrice(provider, serviceType);
    const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];

    let matchesDate = true;
    if (filters.date) {
      const dateStr = format(filters.date, 'yyyy-MM-dd');
      const providerAvail = availabilityDates[provider.user_id] || [];
      matchesDate = providerAvail.includes(dateStr);
    }

    let matchesAvailableNow = true;
    if (filters.availableNow) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const providerAvail = availabilityDates[provider.user_id] || [];
      matchesAvailableNow = providerAvail.includes(todayStr);
    }

    return matchesSearch && matchesRating && matchesPrice && matchesDate && matchesAvailableNow;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'reviews':
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      case 'price_asc':
        return getProviderPrice(a, serviceType) - getProviderPrice(b, serviceType);
      case 'price_desc':
        return getProviderPrice(b, serviceType) - getProviderPrice(a, serviceType);
      case 'experience':
        return (b.experience_years || 0) - (a.experience_years || 0);
      default:
        return 0;
    }
  });

  const handleOpenBooking = (provider: any) => {
    setSelectedProvider(provider);
    setBookingDialogOpen(true);
  };

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <IconComponent className={`h-12 w-12 ${config.loadingAnimation} mx-auto mb-4 text-primary`} />
          <p className="text-muted-foreground">{config.loadingText}</p>
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
              <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                {config.title}
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {config.subtitle}
            </p>
          </div>
          <OfferServiceButton
            serviceType={config.providerType}
            serviceName={config.serviceName}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedServiceFilters
        onFiltersChange={setFilters}
        maxPrice={config.maxPrice}
        serviceType={config.providerType}
        className="mb-6"
      />

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-3 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger
            value="list"
            className={`data-[state=active]:bg-gradient-to-r data-[state=active]:${config.gradientFrom} data-[state=active]:text-white`}
          >
            <IconComponent className="h-4 w-4 mr-2" />
            {config.listTabLabel}
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {config.bookingsTabLabel}
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

        {/* Providers List */}
        <TabsContent value="list" className="space-y-6 mt-6">
          <ServicePromotionsList serviceType={config.providerType} />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredProviders.length} {config.resultLabel}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderProfileCard
                key={provider.id}
                provider={provider}
                providerType={config.providerType}
                onViewProfile={() => handleOpenProfile(provider)}
                onBook={() => handleOpenBooking(provider)}
              />
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <IconComponent className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">{config.emptyText}</p>
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
            serviceType={config.providerType}
            onBookingClick={(booking) => {
              toast({
                title: config.bookingToastLabel,
                description: `${config.bookingToastLabel} #${booking.id.slice(0, 8)}`
              });
            }}
          />
        </TabsContent>

        {/* Provider Management Tab */}
        {isProvider && (
          <TabsContent value="manage" className="space-y-4 mt-6">
            <ProviderAvailabilityManager providerType={config.providerType} />
          </TabsContent>
        )}
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProvider && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedProvider.profiles?.avatar_url} />
                    <AvatarFallback className={`bg-gradient-to-r ${config.gradientFrom} text-white`}>
                      {selectedProvider.profiles?.display_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{getDisplayNamePrefix(serviceType)}{selectedProvider.profiles?.display_name}</p>
                    <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {selectedProvider.rating?.toFixed(1)} ({selectedProvider.total_reviews} reseñas)
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedProvider.bio}
                </DialogDescription>
              </DialogHeader>

              <ProfileDetails provider={selectedProvider} />

              <Button
                className={`w-full bg-gradient-to-r ${config.gradientFrom} hover:opacity-90`}
                onClick={() => {
                  setProfileDialogOpen(false);
                  handleOpenBooking(selectedProvider);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {config.bookButtonLabel}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Booking Dialog */}
      <EnhancedBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        provider={selectedProvider ? {
          id: selectedProvider.id,
          user_id: selectedProvider.user_id,
          display_name: selectedProvider.profiles?.display_name || config.defaultDisplayName,
          avatar_url: selectedProvider.profiles?.avatar_url,
          bio: selectedProvider.bio || '',
          rating: selectedProvider.rating || 5,
          total_reviews: selectedProvider.total_reviews || 0,
          price: getProviderPrice(selectedProvider, serviceType),
          services: getProviderServices(selectedProvider, serviceType)
        } : null}
        providerType={config.providerType}
        onBookingComplete={loadData}
      />
    </div>
  );
};

export default ServiceDirectory;
