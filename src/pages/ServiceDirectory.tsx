/**
 * ServiceDirectory — directorio unificado de proveedores de servicios.
 * Consulta la tabla `service_providers` filtrada por `primary_service_type`.
 * Reemplaza el enfoque anterior que consultaba tablas legacy individuales.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dog,
  Stethoscope,
  GraduationCap,
  Scissors,
  Star,
  Calendar,
  CheckCircle2,
  Award,
  Settings,
  Clock,
  Heart,
  MapPin,
  Home,
  AlertCircle,
  Shield,
  type LucideIcon,
} from '@/lib/icons';
import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ServicePromotionsList } from '@/components/ServicePromotionsList';
import { OfferServiceButton } from '@/components/OfferServiceButton';
import { MyBookingsHistory } from '@/components/MyBookingsHistory';
import { ProviderAvailabilityManager } from '@/components/ProviderAvailabilityManager';
import { AdvancedServiceFilters } from '@/components/AdvancedServiceFilters';
import { EnhancedBookingDialog } from '@/components/EnhancedBookingDialog';
import { ProviderProfileCard } from '@/components/ProviderProfileCard';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LINKS } from '@/lib/links';

type ServiceType = 'walkers' | 'vets' | 'sitters' | 'trainers' | 'groomers';
type PrimaryServiceType = 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'groomer';
type BookingsServiceType = PrimaryServiceType | 'all';

// Unified provider record from service_providers table
interface UnifiedProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  commune: string | null;
  service_areas: string[] | null;
  experience_years: number | null;
  rating: number;
  total_reviews: number;
  total_services_completed: number;
  is_verified: boolean;
  status: string;
  primary_service_type: string | null;
  // Vet-specific
  specialties: string[] | null;
  license_number: string | null;
  provider_type: string | null;
  price_from: number | null;
  opening_hours: Record<string, unknown> | null;
  emergency_available: boolean | null;
  emergency_phone: string | null;
  // Groomer-specific
  business_name: string | null;
  services_offered: string[] | null;
  accepts_cats: boolean | null;
  accepts_dogs: boolean | null;
  accepts_long_hair: boolean | null;
  mobile_service: boolean | null;
  base_price_clp: number | null;
  // Computed
  _price: number;
}

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
  primaryServiceType: PrimaryServiceType;
  serviceName: string;
  maxPrice: number;
  gradient: string;
  gradientFrom: string;
  listTabLabel: string;
  bookingsTabLabel: string;
  emptyText: string;
  resultLabel: string;
  bookButtonLabel: string;
  defaultDisplayName: string;
  displayNamePrefix: string;
}

const SERVICE_CONFIG: Record<ServiceType, ServiceConfig> = {
  walkers: {
    title: 'Paseadores de Perros',
    subtitle: 'Encuentra paseadores verificados y profesionales cerca de ti',
    icon: Dog,
    primaryServiceType: 'dog_walker',
    serviceName: 'Paseador',
    maxPrice: 100000,
    gradient: 'from-blue-600 via-cyan-500 to-teal-500',
    gradientFrom: 'from-blue-600 to-cyan-500',
    listTabLabel: 'Paseadores',
    bookingsTabLabel: 'Mis Reservas',
    emptyText: 'No se encontraron paseadores',
    resultLabel: 'paseadores encontrados',
    bookButtonLabel: 'Reservar Paseo',
    defaultDisplayName: 'Paseador',
    displayNamePrefix: '',
  },
  vets: {
    title: 'Veterinarios a Domicilio',
    subtitle: 'Encuentra veterinarios certificados que visitan tu hogar',
    icon: Stethoscope,
    primaryServiceType: 'veterinarian',
    serviceName: 'Veterinario',
    maxPrice: 200000,
    gradient: 'from-teal-600 via-purple-600 to-green-500',
    gradientFrom: 'from-teal-600 to-purple-600',
    listTabLabel: 'Veterinarios',
    bookingsTabLabel: 'Mis Consultas',
    emptyText: 'No se encontraron veterinarios',
    resultLabel: 'veterinarios encontrados',
    bookButtonLabel: 'Agendar Consulta',
    defaultDisplayName: 'Veterinario',
    displayNamePrefix: 'Dr(a). ',
  },
  sitters: {
    title: 'Cuidadores de Mascotas',
    subtitle: 'Encuentra cuidadores profesionales para tu mascota',
    icon: Heart,
    primaryServiceType: 'dogsitter',
    serviceName: 'Cuidador',
    maxPrice: 100000,
    gradient: 'from-purple-600 via-pink-500 to-violet-500',
    gradientFrom: 'from-purple-600 to-pink-500',
    listTabLabel: 'Cuidadores',
    bookingsTabLabel: 'Mis Reservas',
    emptyText: 'No se encontraron cuidadores',
    resultLabel: 'cuidadores encontrados',
    bookButtonLabel: 'Reservar Cuidado',
    defaultDisplayName: 'Cuidador',
    displayNamePrefix: '',
  },
  trainers: {
    title: 'Entrenadores Caninos',
    subtitle: 'Encuentra entrenadores profesionales para tu mascota',
    icon: GraduationCap,
    primaryServiceType: 'trainer',
    serviceName: 'Entrenador',
    maxPrice: 150000,
    gradient: 'from-orange-600 via-amber-500 to-yellow-500',
    gradientFrom: 'from-orange-600 to-amber-500',
    listTabLabel: 'Entrenadores',
    bookingsTabLabel: 'Mis Sesiones',
    emptyText: 'No se encontraron entrenadores',
    resultLabel: 'entrenadores encontrados',
    bookButtonLabel: 'Reservar Sesión',
    defaultDisplayName: 'Entrenador',
    displayNamePrefix: '',
  },
  groomers: {
    title: 'Peluqueros para Mascotas',
    subtitle: 'Baño, corte y arreglo profesional para perros y gatos',
    icon: Scissors,
    primaryServiceType: 'groomer',
    serviceName: 'Peluquero',
    maxPrice: 100000,
    gradient: 'from-pink-600 via-rose-500 to-red-500',
    gradientFrom: 'from-pink-600 to-rose-500',
    listTabLabel: 'Peluqueros',
    bookingsTabLabel: 'Mis Reservas',
    emptyText: 'No se encontraron peluqueros',
    resultLabel: 'peluqueros encontrados',
    bookButtonLabel: 'Solicitar Cita',
    defaultDisplayName: 'Peluquero',
    displayNamePrefix: '',
  },
};

// --- Profile detail renderers per service type ---

function VetDetails({ provider }: { provider: UnifiedProvider }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información Profesional</h4>
        <div className="grid grid-cols-2 gap-3">
          {provider.license_number && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
              <Shield className="h-4 w-4 text-primary" />
              <span>Licencia: {provider.license_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Award className="h-4 w-4 text-primary" />
            <span>{provider.experience_years || 0} años exp.</span>
          </div>
          {provider.is_verified && (
            <div className="flex items-center gap-2 text-sm p-3 bg-teal-50 text-teal-700 rounded-lg col-span-2 justify-center">
              <CheckCircle2 className="h-4 w-4" />
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
      {provider.price_from && (
        <div>
          <h4 className="font-semibold mb-2">Tarifas</h4>
          <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
            <span>Consulta desde</span>
            <span className="font-semibold">${provider.price_from.toLocaleString()}</span>
          </div>
        </div>
      )}
      {provider.specialties && provider.specialties.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {provider.specialties.map((s: string) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroomerDetails({ provider }: { provider: UnifiedProvider }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información</h4>
        <div className="grid grid-cols-2 gap-3">
          {provider.experience_years != null && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
              <Award className="h-4 w-4 text-pink-600" />
              <span>{provider.experience_years} años de experiencia</span>
            </div>
          )}
          {provider.commune && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-4 w-4 text-pink-600" />
              <span>{provider.commune}</span>
            </div>
          )}
          {provider.mobile_service && (
            <div className="flex items-center gap-2 text-sm p-3 bg-pink-50 text-pink-700 rounded-lg col-span-2 justify-center">
              <Home className="h-4 w-4" />
              <span>Atención a domicilio disponible</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">¿Qué mascotas atiende?</h4>
        <div className="flex flex-wrap gap-2">
          {provider.accepts_dogs && <Badge variant="secondary">Perros</Badge>}
          {provider.accepts_cats && <Badge variant="secondary">Gatos</Badge>}
          {provider.accepts_long_hair && <Badge variant="secondary">Pelo largo</Badge>}
        </div>
      </div>
      {provider.services_offered && provider.services_offered.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Servicios ofrecidos</h4>
          <div className="flex flex-wrap gap-2">
            {provider.services_offered.map((s: string) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {(provider.base_price_clp || provider.price_from) && (
        <div>
          <h4 className="font-semibold mb-2">Precio</h4>
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            Desde{' '}
            <span className="font-semibold text-pink-700">
              ${(provider.base_price_clp || provider.price_from || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function GenericProviderDetails({ provider }: { provider: UnifiedProvider }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-2">Información</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <span>{provider.experience_years || 0} años exp.</span>
          </div>
          <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
            <Award className="h-4 w-4 text-primary" />
            <span>{provider.total_services_completed || 0} servicios</span>
          </div>
          {provider.commune && (
            <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{provider.commune}</span>
            </div>
          )}
          {provider.is_verified && (
            <div className="flex items-center gap-2 text-sm p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verificado</span>
            </div>
          )}
        </div>
      </div>
      {provider.price_from && (
        <div>
          <h4 className="font-semibold mb-2">Tarifa</h4>
          <div className="flex justify-between text-sm p-3 bg-muted/30 rounded-lg">
            <span>Desde</span>
            <span className="font-semibold">${provider.price_from.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const PROFILE_DETAILS: Record<ServiceType, React.ComponentType<{ provider: UnifiedProvider }>> = {
  walkers: GenericProviderDetails,
  vets: VetDetails,
  sitters: GenericProviderDetails,
  trainers: GenericProviderDetails,
  groomers: GroomerDetails,
};

// --- Main component ---

const ServiceDirectory = () => {
  const { type } = useParams<{ type: string }>();
  const serviceType = (type || 'walkers') as ServiceType;
  const isValidType = !!type && !!SERVICE_CONFIG[serviceType];

  const config = SERVICE_CONFIG[serviceType] || SERVICE_CONFIG.walkers;
  const ProfileDetails = PROFILE_DETAILS[serviceType] || PROFILE_DETAILS.walkers;
  const IconComponent = config.icon;

  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState<UnifiedProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<UnifiedProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    date: undefined,
    priceRange: [0, config.maxPrice],
    minRating: 0,
    sortBy: 'rating',
    availableNow: false,
  });
  const [availabilityDates, setAvailabilityDates] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isValidType) return;
    loadData();
    checkIfProvider();
  }, [user, serviceType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isValidType) return;
    setProviders([]);
    setSelectedProvider(null);
    setIsProvider(false);
    setFilters({
      searchTerm: '',
      date: undefined,
      priceRange: [0, config.maxPrice],
      minRating: 0,
      sortBy: 'rating',
      availableNow: false,
    });
    setAvailabilityDates({});
  }, [serviceType]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isValidType) {
    return <Navigate to="/home" replace />;
  }

  const checkIfProvider = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('primary_service_type', config.primaryServiceType)
      .maybeSingle();
    setIsProvider(!!data);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Query service_providers filtered by primary_service_type
      const { data: providersData, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('primary_service_type', config.primaryServiceType)
        .eq('status', 'approved')
        .eq('is_directory_visible', true)
        .order('rating', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (providersData && providersData.length > 0) {
        // Load availability
        const userIds = providersData.map((p) => p.user_id).filter(Boolean);
        const { data: availData } = await supabase
          .from('provider_availability')
          .select('user_id, date')
          .eq('provider_type', config.primaryServiceType)
          .eq('is_available', true)
          .gte('date', format(new Date(), 'yyyy-MM-dd'))
          .in('user_id', userIds);

        const availMap: Record<string, string[]> = {};
        availData?.forEach((a) => {
          if (!availMap[a.user_id]) availMap[a.user_id] = [];
          availMap[a.user_id].push(a.date);
        });
        setAvailabilityDates(availMap);

        setProviders(
          providersData.map((p) => ({
            ...p,
            _price: p.price_from || p.base_price_clp || 0,
          })) as UnifiedProvider[]
        );
      } else {
        setProviders([]);
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Algo salió mal', {
        description: `No se pudo cargar la información de ${config.listTabLabel.toLowerCase()}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getProviderPrice = (p: UnifiedProvider) => p.price_from || p.base_price_clp || 0;

  const filteredProviders = providers
    .filter((provider) => {
      const matchesSearch =
        !filters.searchTerm ||
        provider.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        provider.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        provider.business_name?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesRating = (provider.rating || 0) >= filters.minRating;

      const price = getProviderPrice(provider);
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
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviews':
          return (b.total_reviews || 0) - (a.total_reviews || 0);
        case 'price_asc':
          return getProviderPrice(a) - getProviderPrice(b);
        case 'price_desc':
          return getProviderPrice(b) - getProviderPrice(a);
        case 'experience':
          return (b.experience_years || 0) - (a.experience_years || 0);
        default:
          return 0;
      }
    });

  const handleOpenBooking = (provider: UnifiedProvider) => {
    setSelectedProvider(provider);
    setBookingDialogOpen(true);
  };

  const handleOpenProfile = (provider: UnifiedProvider) => {
    setSelectedProvider(provider);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title={config.title}
          subtitle={config.subtitle}
          onBack={() => navigate(LINKS.servicios())}
        />
        <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
          <div className="h-11 w-full rounded-xl skeleton" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton" />
                    <div className="h-3 w-24 skeleton" />
                  </div>
                </div>
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-3/4 skeleton" />
                <div className="h-9 w-full skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        onBack={() => navigate(LINKS.servicios())}
      >
        <Breadcrumbs
          items={[{ label: 'Servicios', to: LINKS.servicios() }, { label: config.title }]}
        />
      </PageHeader>
      <div className="container px-4 py-6 max-w-7xl mx-auto animate-fade-in">
        <div className="mb-6 flex justify-end">
          <OfferServiceButton
            serviceType={config.primaryServiceType}
            serviceName={config.serviceName}
            className="w-full sm:w-auto"
          />
        </div>

        <AdvancedServiceFilters
          onFiltersChange={setFilters}
          maxPrice={config.maxPrice}
          serviceType={config.primaryServiceType}
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

          <TabsContent value="list" className="space-y-6 mt-6">
            <ServicePromotionsList serviceType={config.primaryServiceType} />

            {filteredProviders.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredProviders.length} {config.resultLabel}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {filteredProviders.map((provider) => (
                <ProviderProfileCard
                  key={provider.id}
                  provider={{
                    ...provider,
                    profiles: {
                      display_name: provider.display_name,
                      avatar_url: provider.avatar_url,
                    },
                    _rating: provider.rating || 0,
                    _totalCount: provider.total_services_completed || 0,
                    _price: getProviderPrice(provider),
                    _services: null,
                  }}
                  providerType={config.primaryServiceType}
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

          <TabsContent value="bookings" className="space-y-4 mt-6">
            <MyBookingsHistory
              serviceType={config.primaryServiceType as BookingsServiceType}
              onBookingClick={(booking) => {
                toast(config.bookingsTabLabel, {
                  description: `Reserva #${booking.id.slice(0, 8)}`,
                });
              }}
            />
          </TabsContent>

          {isProvider && (
            <TabsContent value="manage" className="space-y-4 mt-6">
              <ProviderAvailabilityManager providerType={config.primaryServiceType} />
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
                      <AvatarImage src={selectedProvider.avatar_url || undefined} />
                      <AvatarFallback
                        className={`bg-gradient-to-r ${config.gradientFrom} text-white`}
                      >
                        {selectedProvider.display_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>
                        {config.displayNamePrefix}
                        {selectedProvider.display_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {(selectedProvider.rating || 0).toFixed(1)} (
                        {selectedProvider.total_reviews} reseñas)
                      </div>
                    </div>
                  </DialogTitle>
                  <DialogDescription>{selectedProvider.bio}</DialogDescription>
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
          provider={
            selectedProvider
              ? {
                  id: selectedProvider.id,
                  user_id: selectedProvider.user_id,
                  display_name: selectedProvider.display_name || config.defaultDisplayName,
                  avatar_url: selectedProvider.avatar_url,
                  bio: selectedProvider.bio || '',
                  rating: selectedProvider.rating || 5,
                  total_reviews: selectedProvider.total_reviews || 0,
                  price: getProviderPrice(selectedProvider),
                  services: null,
                }
              : null
          }
          providerType={config.primaryServiceType}
          onBookingComplete={loadData}
        />
      </div>
    </div>
  );
};

export default ServiceDirectory;
