import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Search, Heart, Briefcase, Plus, Filter, MapPin, Building2, Coffee } from '@/lib/icons';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportLostPetForm from '@/components/ReportLostPetForm';
import { CreateAdoptionPost } from '@/components/CreateAdoptionPost';
import MapFilters from '@/components/maps/MapFilters';
import MapPinPopup from '@/components/maps/MapPinPopup';
import { useServiceProviders } from '@/hooks/useServiceProviders';
import { useAdoptionShelters } from '@/hooks/useAdoptionShelters';
import { usePartners } from '@/hooks/usePartners';
import PartnerDetailCard from '@/components/maps/PartnerDetailCard';
import { calculateDistance } from '@/lib/distance';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { PageHeader } from '@/components/PageHeader';
import { MapSearchBar, type MapSearchResult } from '@/components/maps/MapSearchBar';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

// Fix Leaflet default marker icon issue with bundlers (Vite/Webpack)
// Leaflet bundler workaround: remove broken default icon URL resolver
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SANTIAGO_CENTER: [number, number] = [-33.4489, -70.6693];

type MapView = 'lost' | 'adoption' | 'services' | 'partners' | 'petFriendly';

interface UserLocation {
  lat: number;
  lng: number;
}

// Custom colored marker icons
function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "><div style="
      width: 10px; height: 10px; border-radius: 50%;
      background: white; position: absolute;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const markerIcons: Record<string, L.DivIcon> = {
  lost: createColoredIcon('#ef4444'),
  found: createColoredIcon('#10b981'),
  adoption: createColoredIcon('#f97316'),
  shelter: createColoredIcon('#8b5cf6'),
  dog_walker: createColoredIcon('#3b82f6'),
  dogsitter: createColoredIcon('#8b5cf6'),
  veterinarian: createColoredIcon('#10b981'),
  trainer: createColoredIcon('#f59e0b'),
  grooming: createColoredIcon('#ec4899'),
  service: createColoredIcon('#6b7280'),
  // Partners
  store: createColoredIcon('#10b981'),
  insurance: createColoredIcon('#3b82f6'),
  food: createColoredIcon('#f59e0b'),
  general_partner: createColoredIcon('#6366f1'),
  // Pet Friendly
  petFriendly: createColoredIcon('#f59e0b'),
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #4F46E5; border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(79,70,229,0.3), 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Component to fly to a given location
function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 15, { duration: 1.5 });
  }, [map, position]);
  return null;
}

// Filter chip labels per view
const FILTER_CHIPS: Record<MapView, string[]> = {
  lost: ['Todos', 'Perdidas', 'Encontradas'],
  adoption: ['Todos', 'Mascotas', 'Refugios'],
  services: ['Todos', 'Veterinarias', 'Paseos', 'Cuidadores', 'Entrenadores', 'Grooming'],
  petFriendly: ['Todos', 'Restaurantes', 'Cafes', 'Parques', 'Playas'],
  partners: ['Todos', 'Tiendas', 'Seguros', 'Crematorios', 'Transporte', 'Entrenadores'],
};

const Maps = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initializedFromParams = useRef(false);
  const [activeView, setActiveView] = useState<MapView>('lost');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateLostPet, setShowCreateLostPet] = useState(false);
  const [showCreateAdoption, setShowCreateAdoption] = useState(false);
  const [activeChip, setActiveChip] = useState('Todos');
  const [locating, setLocating] = useState(false);

  // Filters state (for dialog-based filters)
  const [filters, setFilters] = useState({
    searchRadius: 50,
    petType: 'all',
    petSize: 'all',
    status: 'all',
    serviceType: 'all',
    adoptionView: 'all',
  });

  // Initialize from query params (deep linking from /servicios)
  useEffect(() => {
    if (initializedFromParams.current) return;
    const tab = searchParams.get('tab');
    const chip = searchParams.get('chip');
    if (tab && ['lost', 'adoption', 'services', 'partners', 'petFriendly'].includes(tab)) {
      setActiveView(tab as MapView);
      if (chip) setActiveChip(chip);
      initializedFromParams.current = true;
    }
  }, [searchParams]);

  // Reset chip when view changes (only from user interaction)
  useEffect(() => {
    if (!initializedFromParams.current) {
      setActiveChip('Todos');
    }
    // Reset the flag after first render so subsequent tab changes reset chips
    initializedFromParams.current = false;
  }, [activeView]);

  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => logger.error('Error getting location:', error)
      );
    }
  }, []);

  // Fetch lost pets
  const { data: lostPets, refetch: refetchLostPets } = useQuery({
    queryKey: ['map-lost-pets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lost_pets')
        .select(
          'id, pet_name, species, breed, description, photo_url, report_type, latitude, longitude, last_seen_location, reward_offered, reward_amount, reporter_id, user_id, is_active'
        )
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch adoption posts — el join PostgREST `profiles:user_id(...)` daba
  // 400 Bad Request porque la FK no está auto-detectada en la tabla, así
  // que hacemos dos queries y el join en cliente.
  const { data: adoptionPosts } = useQuery({
    queryKey: ['map-adoption-posts'],
    queryFn: async () => {
      // Sprint 1 P1 PERF-003: select narrow. Antes traia todo (~20+ cols).
      // Marker render solo usa id/lat/lng/species/size; los popovers que se
      // abren al click leen los campos de AdoptionPostCard (mismo set que
      // /adoption feed).
      const { data: posts, error } = await supabase
        .from('adoption_posts')
        .select(
          'id, user_id, pet_name, species, breed, gender, age_years, age_months, description, photos, location, status, latitude, longitude, size'
        )
        .eq('status', 'disponible');
      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
      if (userIds.length === 0) return posts.map((p) => ({ ...p, profiles: null }));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((pr) => [pr.id, pr]));
      return posts.map((p) => ({
        ...p,
        profiles: profileMap.get(p.user_id) || null,
      }));
    },
  });

  // Fetch service providers, shelters & partners
  const { providers: serviceProviders } = useServiceProviders();
  const { shelters: adoptionShelters } = useAdoptionShelters();
  const { partners } = usePartners();

  // Pet Friendly places — hidden behind feature flag until real DB table exists.
  // The hardcoded data below is kept but gated so it never renders to users.
  const petFriendlyPlaces: {
    id: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    desc: string;
    address: string;
  }[] = useMemo(
    () =>
      FEATURE_FLAGS.MAP_PET_FRIENDLY
        ? [
            {
              id: '1',
              name: 'Parque Bicentenario',
              type: 'Parques',
              lat: -33.4039,
              lng: -70.5917,
              desc: 'Amplio parque con zona de perros',
              address: 'Av. Bicentenario, Vitacura',
            },
            {
              id: '2',
              name: 'Parque Araucano',
              type: 'Parques',
              lat: -33.4087,
              lng: -70.575,
              desc: 'Zona pet friendly con bebederos',
              address: 'Av. Presidente Riesco, Las Condes',
            },
            {
              id: '3',
              name: 'Starbucks Providencia',
              type: 'Cafes',
              lat: -33.4256,
              lng: -70.6107,
              desc: 'Terraza pet friendly, agua para mascotas',
              address: 'Av. Providencia 2124',
            },
            {
              id: '4',
              name: 'Parque Bustamante',
              type: 'Parques',
              lat: -33.4406,
              lng: -70.6379,
              desc: 'Parque urbano pet friendly',
              address: 'Av. Bustamante, Providencia',
            },
            {
              id: '5',
              name: 'Juan Valdez Costanera',
              type: 'Cafes',
              lat: -33.417,
              lng: -70.606,
              desc: 'Terraza amplia apta mascotas',
              address: 'Costanera Center, Providencia',
            },
            {
              id: '6',
              name: 'Cervecería Kross',
              type: 'Restaurantes',
              lat: -33.4343,
              lng: -70.615,
              desc: 'Restaurante con terraza pet friendly',
              address: 'Av. Italia 1421, Providencia',
            },
            {
              id: '7',
              name: 'Parque Metropolitano (Cerro San Cristóbal)',
              type: 'Parques',
              lat: -33.425,
              lng: -70.633,
              desc: 'Senderos pet friendly, llevar agua',
              address: 'Pío Nono 450, Recoleta',
            },
            {
              id: '8',
              name: 'Café de la Candelaria',
              type: 'Cafes',
              lat: -33.443,
              lng: -70.634,
              desc: 'Café artesanal, mascotas bienvenidas',
              address: 'Purísima 165, Bellavista',
            },
            {
              id: '9',
              name: 'Playa de los Perros Algarrobo',
              type: 'Playas',
              lat: -33.364,
              lng: -71.653,
              desc: 'Playa habilitada para perros',
              address: 'Algarrobo, V Región',
            },
            {
              id: '10',
              name: "Parque O'Higgins",
              type: 'Parques',
              lat: -33.4645,
              lng: -70.6582,
              desc: 'Gran parque urbano, zona canina',
              address: 'Av. Beauchef, Santiago Centro',
            },
          ]
        : [],
    []
  );

  // Build filtered markers
  const filteredMarkers = useMemo(() => {
    if (activeView === 'lost') {
      return (lostPets || [])
        .filter((pet) => {
          if (!pet.latitude || !pet.longitude) return false;
          if (filters.status !== 'all' && pet.report_type !== filters.status) return false;
          if (filters.petType !== 'all' && pet.species !== filters.petType) return false;
          // Chip filter
          if (activeChip === 'Perdidas' && pet.report_type !== 'perdida') return false;
          if (activeChip === 'Encontradas' && pet.report_type !== 'encontrada') return false;
          if (userLocation && filters.searchRadius < 100) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              pet.latitude,
              pet.longitude
            );
            if (distance > filters.searchRadius) return false;
          }
          return true;
        })
        .map((pet) => ({
          id: pet.id,
          position: [pet.latitude!, pet.longitude!] as [number, number],
          type: pet.report_type,
          data: pet,
        }));
    }

    if (activeView === 'adoption') {
      const markers: { id: string; position: [number, number]; type: string; data: unknown }[] = [];

      const showAnimals = activeChip === 'Todos' || activeChip === 'Mascotas';
      const showShelters = activeChip === 'Todos' || activeChip === 'Refugios';

      // NOTE: adoption_posts table has no latitude/longitude columns (only a
      // text `location` field). The `.filter(post => post.latitude && post.longitude)`
      // correctly excludes all posts. When the table gets real coords, markers
      // will appear automatically.
      if (showAnimals && (filters.adoptionView === 'all' || filters.adoptionView === 'animals')) {
        const animalMarkers = (adoptionPosts || [])
          .filter((post) => {
            if (filters.petType !== 'all' && post.species !== filters.petType) return false;
            if (filters.petSize !== 'all' && post.size !== filters.petSize) return false;
            return true;
          })
          .filter((post) => post.latitude && post.longitude)
          .map((post) => ({
            id: post.id,
            position: [post.latitude, post.longitude] as [number, number],
            type: 'adoption',
            data: post,
          }));
        markers.push(...animalMarkers);
      }

      if (showShelters && (filters.adoptionView === 'all' || filters.adoptionView === 'shelters')) {
        const shelterMarkers = (adoptionShelters || [])
          .filter((shelter) => {
            if (!shelter.latitude || !shelter.longitude) return false;
            if (filters.petType !== 'all') {
              if (!shelter.animal_types?.includes(filters.petType)) return false;
            }
            if (userLocation && filters.searchRadius < 100) {
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                shelter.latitude,
                shelter.longitude
              );
              if (distance > filters.searchRadius) return false;
            }
            return true;
          })
          .map((shelter) => ({
            id: `shelter-${shelter.id}`,
            position: [shelter.latitude!, shelter.longitude!] as [number, number],
            type: 'shelter',
            data: shelter,
          }));
        markers.push(...shelterMarkers);
      }

      return markers;
    }

    if (activeView === 'services') {
      const chipToServiceType: Record<string, string> = {
        Veterinarias: 'veterinarian',
        Paseos: 'dog_walker',
        Cuidadores: 'dogsitter',
        Entrenadores: 'trainer',
        Grooming: 'grooming',
      };

      return (serviceProviders || [])
        .filter((provider) => {
          if (!provider.latitude || !provider.longitude) return false;
          // Chip-based filter
          if (activeChip !== 'Todos') {
            const requiredType = chipToServiceType[activeChip];
            if (requiredType) {
              const hasService = provider.services?.some(
                (s) => s.service_type === requiredType && s.is_active
              );
              if (!hasService) return false;
            }
          }
          // Dialog filter
          if (filters.serviceType !== 'all') {
            const hasService = provider.services?.some(
              (s) => s.service_type === filters.serviceType && s.is_active
            );
            if (!hasService) return false;
          }
          if (userLocation && filters.searchRadius < 100) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              provider.latitude,
              provider.longitude
            );
            if (distance > filters.searchRadius) return false;
          }
          return true;
        })
        .map((provider) => ({
          id: provider.id,
          position: [provider.latitude!, provider.longitude!] as [number, number],
          type: provider.services?.[0]?.service_type || 'service',
          data: provider,
        }));
    }

    if (activeView === 'partners') {
      const chipToCategory: Record<string, string> = {
        Tiendas: 'store',
        Seguros: 'insurance',
        Crematorios: 'general',
        Transporte: 'general',
        Entrenadores: 'general',
      };
      // Subcategorias: crematorio/transporte/entrenador se distinguen por keyword en ad_text
      const chipToKeyword: Record<string, string | null> = {
        Crematorios: 'cremaci',
        Transporte: 'transport',
        Entrenadores: 'adiestr|educaci|entren',
      };

      return (partners || [])
        .filter((partner) => {
          if (!partner.latitude || !partner.longitude) return false;
          if (activeChip !== 'Todos') {
            const requiredCategory = chipToCategory[activeChip];
            if (requiredCategory && partner.category !== requiredCategory) return false;
            const keyword = chipToKeyword[activeChip];
            if (keyword) {
              const regex = new RegExp(keyword, 'i');
              const text = `${partner.brand_name} ${partner.ad_text}`;
              if (!regex.test(text)) return false;
            }
          }
          if (userLocation && filters.searchRadius < 100) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              partner.latitude,
              partner.longitude
            );
            if (distance > filters.searchRadius) return false;
          }
          return true;
        })
        .map((partner) => ({
          id: `partner-${partner.id}`,
          position: [partner.latitude!, partner.longitude!] as [number, number],
          type:
            partner.category === 'store'
              ? 'store'
              : partner.category === 'insurance'
                ? 'insurance'
                : partner.category === 'food'
                  ? 'food'
                  : 'general_partner',
          data: partner,
        }));
    }

    if (activeView === 'petFriendly') {
      return (petFriendlyPlaces || [])
        .filter((place) => {
          if (!place.lat || !place.lng) return false;
          if (activeChip !== 'Todos' && place.type !== activeChip) return false;
          return true;
        })
        .map((place) => ({
          id: `pf-${place.id}`,
          position: [place.lat, place.lng] as [number, number],
          type: 'petFriendly',
          data: place,
        }));
    }

    return [];
  }, [
    activeView,
    lostPets,
    adoptionPosts,
    adoptionShelters,
    serviceProviders,
    partners,
    petFriendlyPlaces,
    filters,
    userLocation,
    activeChip,
  ]);

  // Searchable items for the search bar
  const searchableItems: MapSearchResult[] = useMemo(() => {
    const items: MapSearchResult[] = [];
    // Service providers (vets, walkers, etc.)
    (serviceProviders || []).forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      items.push({
        id: p.id,
        name: p.display_name || 'Proveedor',
        type: p.services?.[0]?.service_type || 'service',
        lat: p.latitude,
        lng: p.longitude,
        subtitle: p.commune || p.address || undefined,
      });
    });
    // Shelters
    (adoptionShelters || []).forEach((s) => {
      if (!s.latitude || !s.longitude) return;
      items.push({
        id: `shelter-${s.id}`,
        name: s.name,
        type: 'shelter',
        lat: s.latitude,
        lng: s.longitude,
        subtitle: s.address || undefined,
      });
    });
    // Partners
    (partners || []).forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      items.push({
        id: `partner-${p.id}`,
        name: p.brand_name,
        type: p.category === 'store' ? 'store' : 'general_partner',
        lat: p.latitude,
        lng: p.longitude,
        subtitle: p.commune || undefined,
      });
    });
    // Pet friendly places
    petFriendlyPlaces.forEach((pl) => {
      items.push({
        id: `pf-${pl.id}`,
        name: pl.name,
        type: 'petFriendly',
        lat: pl.lat,
        lng: pl.lng,
        subtitle: pl.address,
      });
    });
    return items;
  }, [serviceProviders, adoptionShelters, partners, petFriendlyPlaces]);

  const handleSearchSelect = useCallback((result: MapSearchResult) => {
    setFlyTarget([result.lat, result.lng]);
  }, []);

  // Map center — guard contra NaN: si la ubicación del user es válida la
  // usamos; si no, promediamos solo marcadores con coordenadas finitas; si
  // no hay nada usable, fallback a Santiago. Cualquier NaN aquí rompe
  // Leaflet con un error opaco al inicializar el mapa.
  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      return [userLocation.lat, userLocation.lng];
    }
    const valid = filteredMarkers.filter(
      (m: { position: [number, number] }) =>
        Number.isFinite(m.position?.[0]) && Number.isFinite(m.position?.[1])
    );
    if (valid.length > 0) {
      const avgLat =
        valid.reduce((sum: number, m: { position: [number, number] }) => sum + m.position[0], 0) /
        valid.length;
      const avgLng =
        valid.reduce((sum: number, m: { position: [number, number] }) => sum + m.position[1], 0) /
        valid.length;
      if (Number.isFinite(avgLat) && Number.isFinite(avgLng)) return [avgLat, avgLng];
    }
    return SANTIAGO_CENTER;
  }, [userLocation, filteredMarkers]);

  // Get marker icon for type
  const getIcon = useCallback((type: string): L.DivIcon => {
    return markerIcons[type] || markerIcons.service;
  }, []);

  // Get accessible label for a marker based on its data
  const getMarkerLabel = useCallback((marker: { type: string; data: unknown }): string => {
    const d = marker.data as Record<string, unknown>;
    // Lost pets & adoption posts
    if (d.pet_name) return String(d.pet_name);
    // Shelters, pet friendly places
    if (d.name) return String(d.name);
    // Service providers
    if (d.display_name) return String(d.display_name);
    // Partners
    if (d.brand_name) return String(d.brand_name);
    return 'Marcador en el mapa';
  }, []);

  // Handle "Mi ubicacion" button
  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setFlyTarget([loc.lat, loc.lng]);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  // Handle FAB action
  const handleFabClick = () => {
    if (activeView === 'lost') {
      setShowCreateLostPet(true);
    } else if (activeView === 'adoption') {
      setShowCreateAdoption(true);
    }
  };

  // Popup type resolver
  const getPopupType = (marker: {
    type: string;
  }): 'lost' | 'adoption' | 'shelter' | 'service' | 'partner' | 'petFriendly' => {
    if (activeView === 'lost') return 'lost';
    if (activeView === 'adoption') return marker.type === 'shelter' ? 'shelter' : 'adoption';
    if (activeView === 'partners') return 'partner';
    if (activeView === 'petFriendly') return 'petFriendly';
    return 'service';
  };

  // Tab config — pet friendly hidden behind feature flag
  const tabs: { value: MapView; label: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      value: 'lost',
      label: 'Perdidas',
      icon: <Search className="h-4 w-4" />,
      activeClass: 'bg-red-500 text-white',
    },
    {
      value: 'adoption',
      label: 'Adopcion',
      icon: <Heart className="h-4 w-4" />,
      activeClass: 'bg-orange-500 text-white',
    },
    {
      value: 'services',
      label: 'Servicios',
      icon: <Briefcase className="h-4 w-4" />,
      activeClass: 'bg-blue-500 text-white',
    },
    {
      value: 'partners',
      label: 'Tiendas',
      icon: <Building2 className="h-4 w-4" />,
      activeClass: 'bg-emerald-500 text-white',
    },
    ...(FEATURE_FLAGS.MAP_PET_FRIENDLY
      ? [
          {
            value: 'petFriendly' as MapView,
            label: 'Pet Friendly',
            icon: <Coffee className="h-4 w-4" />,
            activeClass: 'bg-amber-500 text-white',
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader title="Mapa" />
      <div className="relative w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] md:m-4 md:rounded-xl overflow-hidden">
        {/* Leaflet Map */}
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ background: '#e5e7eb' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fly to user location when requested */}
          {flyTarget && <FlyToLocation position={flyTarget} />}

          {/* Data markers — filtramos cualquier marker con coords inválidas
            que pudo haber escapado del filteredMarkers (NaN, null, etc.) */}
          {filteredMarkers
            .filter(
              (marker) =>
                Number.isFinite(marker.position?.[0]) && Number.isFinite(marker.position?.[1])
            )
            .map((marker) => {
              const label = getMarkerLabel(marker);
              return (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  icon={getIcon(marker.type)}
                  title={label}
                  alt={label}
                >
                  <Popup maxWidth={340} minWidth={280} className="leaflet-popup-custom">
                    {getPopupType(marker) === 'petFriendly' ? (
                      <div className="p-2 space-y-1">
                        <p className="font-semibold text-sm">
                          {(marker.data as { name: string }).name}
                        </p>
                        <p className="text-xs text-amber-600 font-medium">
                          {(marker.data as { type: string }).type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(marker.data as { desc: string }).desc}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {(marker.data as { address: string }).address}
                        </p>
                      </div>
                    ) : getPopupType(marker) === 'partner' ? (
                      <PartnerDetailCard
                        partner={marker.data as import('@/hooks/usePartners').Partner}
                        userLocation={userLocation || undefined}
                      />
                    ) : (
                      <MapPinPopup
                        type={getPopupType(marker) as 'lost' | 'adoption' | 'shelter' | 'service'}
                        data={marker.data as import('@/components/maps/MapPinPopup').MapPinData}
                        userLocation={userLocation || undefined}
                        onClose={() => {}}
                      />
                    )}
                  </Popup>
                </Marker>
              );
            })}

          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
              title="Tu ubicación"
              alt="Tu ubicación"
            />
          )}
        </MapContainer>

        {/* Search bar - flotante arriba */}
        <MapSearchBar
          searchableItems={searchableItems}
          onSelectResult={handleSearchSelect}
          onLocateMe={handleLocateMe}
          locating={locating}
          className="absolute top-3 left-3 right-3 z-[1000]"
        />

        {/* View tabs overlay */}
        <div className="absolute top-[3.5rem] left-1/2 -translate-x-1/2 z-[1000] flex gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeView === tab.value ? tab.activeClass : 'text-foreground/70 hover:bg-white'
              )}
              onClick={() => setActiveView(tab.value)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          <button
            className="flex items-center px-2 py-1.5 rounded-lg text-foreground/70 hover:bg-white transition-all"
            onClick={() => setShowFilters(true)}
            title="Filtros"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Floating filter chips */}
        <div className="absolute top-[6.5rem] left-4 right-4 z-[1000] flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {FILTER_CHIPS[activeView].map((chip) => (
            <button
              key={chip}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-sm transition-all',
                activeChip === chip
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/90 backdrop-blur-sm text-foreground hover:bg-white'
              )}
              onClick={() => setActiveChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Results count badge */}
        <div className="absolute top-[9.5rem] left-4 z-[1000]">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{filteredMarkers.length} resultados</span>
            {activeView === 'petFriendly' && FEATURE_FLAGS.MAP_PET_FRIENDLY && (
              <span className="text-amber-600 ml-1">· Datos curados</span>
            )}
          </div>
        </div>

        {/* Empty state overlay */}
        {filteredMarkers.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-lg text-center pointer-events-auto max-w-xs">
              <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                No hay servicios en esta zona todavía
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta cambiar los filtros o ampliar el radio de búsqueda
              </p>
            </div>
          </div>
        )}

        {/* FAB - Floating Action Button */}
        {activeView !== 'services' && activeView !== 'partners' && activeView !== 'petFriendly' && (
          <Button
            onClick={handleFabClick}
            className="absolute bottom-6 right-4 z-[1000] h-14 w-14 rounded-full shadow-lg bg-warm-gradient hover:opacity-90"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        {/* Legend - bottom left */}
        <Card className="absolute bottom-6 left-4 z-[1000] shadow-lg">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Leyenda</p>
            {activeView === 'lost' && (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Perdida</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Encontrada</span>
                </div>
              </div>
            )}
            {activeView === 'adoption' && (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Mascota</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Refugio/Hogar</span>
                </div>
              </div>
            )}
            {activeView === 'services' && (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Paseador</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Cuidador</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Veterinario</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Entrenador</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500" />
                  <span>Grooming</span>
                </div>
              </div>
            )}
            {activeView === 'partners' && (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Tienda</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Alimento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span>Otro servicio</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters Modal */}
        <ResponsiveModal
          open={showFilters}
          onOpenChange={setShowFilters}
          title="Filtros"
          maxWidth="max-w-md"
        >
          <MapFilters
            activeView={activeView}
            filters={filters}
            setFilters={setFilters}
            onClose={() => setShowFilters(false)}
          />
        </ResponsiveModal>

        {/* Create Lost Pet Modal */}
        <ResponsiveModal
          open={showCreateLostPet}
          onOpenChange={setShowCreateLostPet}
          title="Reportar Mascota"
          maxWidth="max-w-2xl"
        >
          <ReportLostPetForm
            onSuccess={() => {
              setShowCreateLostPet(false);
              refetchLostPets();
            }}
          />
        </ResponsiveModal>

        {/* Create Adoption Post Dialog */}
        <CreateAdoptionPost
          open={showCreateAdoption}
          onOpenChange={setShowCreateAdoption}
          onSuccess={() => setShowCreateAdoption(false)}
        />
      </div>
    </>
  );
};

export default Maps;
