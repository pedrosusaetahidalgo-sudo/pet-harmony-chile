/* eslint-disable @typescript-eslint/no-explicit-any */
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
  ShieldCheck,
  GraduationCap,
  Scissors,
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
  MapPin,
  type LucideIcon,
} from '@/lib/icons';
import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
type ProfileTable =
  | 'dog_walker_profiles'
  | 'vet_profiles'
  | 'dogsitter_profiles'
  | 'trainer_profiles'
  | 'groomer_profiles';
// Union literal aceptada por los componentes hijos
type ProviderType = 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'groomer';
type BookingsServiceType = ProviderType | 'all';

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
  // Mapeo de campos DB — permite queries y normalizacion config-driven
  ratingField: string;
  totalCountField: string;
  servicesField: string;
  activeField: string;
  activeValue: boolean | string;
  displayNamePrefix: string;
}

const SERVICE_CONFIG: Record<ServiceType, ServiceConfig> = {
  walkers: {
    title: 'Paseadores de Perros',
    subtitle: 'Encuentra paseadores verificados y profesionales cerca de ti',
    icon: Dog,
    profileTable: 'dog_walker_profiles',
    providerType: 'dog_walker',
    serviceName: 'Paseador',
    maxPrice: 100000,
    priceField: 'price_per_walk',
    gradient: 'from-blue-600 via-cyan-500 to-teal-500',
    gradientFrom: 'from-blue-600 to-cyan-500',
    loadingAnimation: 'animate-bounce',
    loadingText: 'Cargando paseadores...',
    listTabLabel: 'Paseadores',
    bookingsTabLabel: 'Mis Reservas',
    emptyText: 'No se encontraron paseadores',
    resultLabel: 'paseadores encontrados',
    bookingToastLabel: 'Reserva seleccionada',
    bookButtonLabel: 'Reservar Paseo',
    defaultDisplayName: 'Paseador',
    ratingField: 'rating',
    totalCountField: 'total_walks',
    servicesField: 'services',
    activeField: 'is_active',
    activeValue: true,
    displayNamePrefix: '',
  },
  vets: {
    title: 'Veterinarios a Domicilio',
    subtitle: 'Encuentra veterinarios certificados que visitan tu hogar',
    icon: Stethoscope,
    profileTable: 'vet_profiles',
    providerType: 'veterinarian',
    serviceName: 'Veterinario',
    maxPrice: 200000,
    priceField: 'consultation_fee',
    gradient: 'from-teal-600 via-purple-600 to-green-500',
    gradientFrom: 'from-teal-600 to-purple-600',
    loadingAnimation: 'animate-pulse',
    loadingText: 'Cargando veterinarios...',
    listTabLabel: 'Veterinarios',
    bookingsTabLabel: 'Mis Consultas',
    emptyText: 'No se encontraron veterinarios',
    resultLabel: 'veterinarios encontrados',
    bookingToastLabel: 'Consulta seleccionada',
    bookButtonLabel: 'Agendar Consulta',
    defaultDisplayName: 'Veterinario',
    ratingField: 'rating',
    totalCountField: 'total_visits',
    servicesField: 'services',
    activeField: 'is_active',
    activeValue: true,
    displayNamePrefix: 'Dr(a). ',
  },
  sitters: {
    title: 'Cuidadores de Mascotas',
    subtitle: 'Encuentra cuidadores profesionales para tu mascota',
    icon: Heart,
    profileTable: 'dogsitter_profiles',
    providerType: 'dogsitter',
    serviceName: 'Cuidador',
    maxPrice: 100000,
    priceField: 'price_per_day',
    gradient: 'from-purple-600 via-pink-500 to-violet-500',
    gradientFrom: 'from-purple-600 to-pink-500',
    loadingAnimation: 'animate-bounce',
    loadingText: 'Cargando cuidadores...',
    listTabLabel: 'Cuidadores',
    bookingsTabLabel: 'Mis Reservas',
    emptyText: 'No se encontraron cuidadores',
    resultLabel: 'cuidadores encontrados',
    bookingToastLabel: 'Reserva seleccionada',
    bookButtonLabel: 'Reservar Cuidado',
    defaultDisplayName: 'Cuidador',
    ratingField: 'rating',
    totalCountField: 'total_bookings',
    servicesField: 'services',
    activeField: 'is_active',
    activeValue: true,
    displayNamePrefix: '',
  },
  trainers: {
    title: 'Entrenadores Caninos',
    subtitle: 'Encuentra entrenadores profesionales para tu mascota',
    icon: GraduationCap,
    profileTable: 'trainer_profiles',
    providerType: 'trainer',
    serviceName: 'Entrenador',
    maxPrice: 150000,
    priceField: 'price_per_session',
    gradient: 'from-orange-600 via-amber-500 to-yellow-500',
    gradientFrom: 'from-orange-600 to-amber-500',
    loadingAnimation: 'animate-bounce',
    loadingText: 'Cargando entrenadores...',
    listTabLabel: 'Entrenadores',
    bookingsTabLabel: 'Mis Sesiones',
    emptyText: 'No se encontraron entrenadores',
    resultLabel: 'entrenadores encontrados',
    bookingToastLabel: 'Sesión seleccionada',
    bookButtonLabel: 'Reservar Sesión',
    defaultDisplayName: 'Entrenador',
    ratingField: 'rating',
    totalCountField: 'total_sessions',
    servicesField: 'specialties',
    activeField: 'is_active',
    activeValue: true,
    displayNamePrefix: '',
  },
  groomers: {
    title: 'Peluqueros para Mascotas',
    subtitle: 'Baño, corte y arreglo profesional para perros y gatos',
    icon: Scissors,
    profileTable: 'groomer_profiles',
    providerType: 'groomer',
    serviceName: 'Peluquero',
    maxPrice: 100000,
    priceField: 'base_price_clp',
    gradient: 'from-pink-600 via-rose-500 to-red-500',
    gradientFrom: 'from-pink-600 to-rose-500',
    loadingAnimation: 'animate-pulse',
    loadingText: 'Cargando peluqueros...',
    listTabLabel: 'Peluqueros',
    bookingsTabLabel: 'Mis Reservas',
    emptyText: 'No se encontraron peluqueros',
    resultLabel: 'peluqueros encontrados',
    bookingToastLabel: 'Cita seleccionada',
    bookButtonLabel: 'Solicitar Cita',
    defaultDisplayName: 'Peluquero',
    ratingField: 'avg_rating',
    totalCountField: 'total_services',
    servicesField: 'services_offered',
    activeField: 'status',
    activeValue: 'approved',
    displayNamePrefix: '',
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
            {Object.entries(provider.services).map(
              ([key, value]: [string, any]) =>
                value && (
                  <Badge key={key} variant="secondary">
                    {key}
                  </Badge>
                )
            )}
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
            {Object.entries(provider.specialties).map(
              ([key, value]: [string, any]) =>
                value && (
                  <Badge key={key} variant="secondary">
                    {key}
                  </Badge>
                )
            )}
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
            <span>{provider.home_type || 'Casa'}</span>
            {provider.has_yard && (
              <Badge variant="secondary" className="text-xs">
                Con patio
              </Badge>
            )}
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
            {Object.entries(provider.specialties).map(
              ([key, value]: [string, any]) =>
                value && (
                  <Badge key={key} variant="secondary">
                    {key}
                  </Badge>
                )
            )}
          </div>
        </div>
      )}

      {provider.training_methods && provider.training_methods.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Métodos de Entrenamiento</h4>
          <div className="flex flex-wrap gap-2">
            {provider.training_methods.map((method: string) => (
              <Badge key={method} variant="outline">
                {method}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroomerProfileDetails({ provider }: { provider: any }) {
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
            {(provider.services_offered as string[]).map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {provider.base_price_clp && (
        <div>
          <h4 className="font-semibold mb-2">Precio</h4>
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            Desde{' '}
            <span className="font-semibold text-pink-700">
              ${provider.base_price_clp.toLocaleString()}
            </span>
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
  groomers: GroomerProfileDetails,
};

// Normaliza un row de DB a campos canonicos usando la config del tipo de servicio.
// Los campos originales se conservan (spread) para que *ProfileDetails los lea.
function normalizeProvider(provider: Record<string, unknown>, cfg: ServiceConfig) {
  const rawServices = provider[cfg.servicesField];
  return {
    ...provider,
    _rating: (provider[cfg.ratingField] as number) ?? 0,
    _totalCount: (provider[cfg.totalCountField] as number) ?? 0,
    _price: (provider[cfg.priceField] as number) ?? 0,
    _services: Array.isArray(rawServices)
      ? Object.fromEntries((rawServices as string[]).map((s) => [s, true]))
      : ((rawServices as Record<string, boolean> | null) ?? null),
  };
}

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
  const { toast } = useToast();
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
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

  // Reset state when service type changes
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

  // Validate service type — after hooks
  if (!isValidType) {
    return <Navigate to="/home" replace />;
  }

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

      // Query config-driven: activeField/activeValue y ratingField vienen de ServiceConfig

      let query = (supabase.from(config.profileTable as any) as any).select('*');
      query = query
        .eq(config.activeField, config.activeValue)
        .order(config.ratingField, { ascending: false, nullsFirst: false });
      const { data: providersData, error } = await query;

      if (error) throw error;

      if (providersData && providersData.length > 0) {
        const userIds = (providersData as Record<string, unknown>[]).map(
          (p) => p.user_id as string
        );
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
        availData?.forEach((a) => {
          if (!availMap[a.user_id]) availMap[a.user_id] = [];
          availMap[a.user_id].push(a.date);
        });
        setAvailabilityDates(availMap);

        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
        type ProviderRow = Record<string, unknown> & { user_id: string };
        setProviders(
          (providersData as ProviderRow[]).map((provider) => ({
            ...normalizeProvider(provider, config),
            profiles: profilesMap.get(provider.user_id),
          }))
        );
      } else {
        setProviders([]);
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Algo salió mal',
        description: `No se pudo cargar la información de ${config.listTabLabel.toLowerCase()}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers
    .filter((provider) => {
      const matchesSearch =
        !filters.searchTerm ||
        provider.profiles?.display_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        provider.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesRating = (provider._rating || 0) >= filters.minRating;

      const price = provider._price || 0;
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
          return (b._rating || 0) - (a._rating || 0);
        case 'reviews':
          return (b.total_reviews || 0) - (a.total_reviews || 0);
        case 'price_asc':
          return (a._price || 0) - (b._price || 0);
        case 'price_desc':
          return (b._price || 0) - (a._price || 0);
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
            serviceType={config.providerType as ProviderType}
            serviceName={config.serviceName}
            className="w-full sm:w-auto"
          />
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
                  provider={provider}
                  providerType={config.providerType as ProviderType}
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
              serviceType={config.providerType as BookingsServiceType}
              onBookingClick={(booking) => {
                toast({
                  title: config.bookingToastLabel,
                  description: `${config.bookingToastLabel} #${booking.id.slice(0, 8)}`,
                });
              }}
            />
          </TabsContent>

          {/* Provider Management Tab */}
          {isProvider && (
            <TabsContent value="manage" className="space-y-4 mt-6">
              <ProviderAvailabilityManager providerType={config.providerType as ProviderType} />
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
                      <AvatarFallback
                        className={`bg-gradient-to-r ${config.gradientFrom} text-white`}
                      >
                        {selectedProvider.profiles?.display_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>
                        {config.displayNamePrefix}
                        {selectedProvider.profiles?.display_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {selectedProvider._rating?.toFixed(1)} ({selectedProvider.total_reviews}{' '}
                        reseñas)
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
                  display_name:
                    selectedProvider.profiles?.display_name || config.defaultDisplayName,
                  avatar_url: selectedProvider.profiles?.avatar_url,
                  bio: selectedProvider.bio || '',
                  rating: selectedProvider._rating || 5,
                  total_reviews: selectedProvider.total_reviews || 0,
                  price: selectedProvider._price || 0,
                  services: selectedProvider._services,
                }
              : null
          }
          providerType={config.providerType as ProviderType}
          onBookingComplete={loadData}
        />
      </div>
    </div>
  );
};

export default ServiceDirectory;
