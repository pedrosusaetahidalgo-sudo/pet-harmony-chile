import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Heart, Briefcase, Plus, Filter,
  MapPin, Loader2, LocateFixed
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReportLostPetForm from "@/components/ReportLostPetForm";
import { CreateAdoptionPost } from "@/components/CreateAdoptionPost";
import MapFilters from "@/components/maps/MapFilters";
import MapPinPopup from "@/components/maps/MapPinPopup";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { useAdoptionShelters } from "@/hooks/useAdoptionShelters";
import { calculateDistance } from "@/lib/distance";
import { cn } from "@/lib/utils";

// Fix Leaflet default marker icon issue with bundlers (Vite/Webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SANTIAGO_CENTER: [number, number] = [-33.4489, -70.6693];

type MapView = "lost" | "adoption" | "services";

interface UserLocation {
  lat: number;
  lng: number;
}

// Custom colored marker icons
function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "custom-marker",
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
  lost: createColoredIcon("#ef4444"),
  found: createColoredIcon("#10b981"),
  adoption: createColoredIcon("#f97316"),
  shelter: createColoredIcon("#8b5cf6"),
  dog_walker: createColoredIcon("#3b82f6"),
  dogsitter: createColoredIcon("#8b5cf6"),
  veterinarian: createColoredIcon("#10b981"),
  trainer: createColoredIcon("#f59e0b"),
  grooming: createColoredIcon("#ec4899"),
  service: createColoredIcon("#6b7280"),
};

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
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
  lost: ["Todos", "Perdidas", "Encontradas"],
  adoption: ["Todos", "Mascotas", "Refugios"],
  services: ["Todos", "Veterinarias", "Paseos", "Cuidadores", "Entrenadores", "Grooming"],
};

const Maps = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<MapView>("lost");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateLostPet, setShowCreateLostPet] = useState(false);
  const [showCreateAdoption, setShowCreateAdoption] = useState(false);
  const [activeChip, setActiveChip] = useState("Todos");
  const [locating, setLocating] = useState(false);

  // Filters state (for dialog-based filters)
  const [filters, setFilters] = useState({
    searchRadius: 50,
    petType: "all",
    petSize: "all",
    status: "all",
    serviceType: "all",
    adoptionView: "all",
  });

  // Reset chip when view changes
  useEffect(() => {
    setActiveChip("Todos");
  }, [activeView]);

  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  // Fetch lost pets
  const { data: lostPets, refetch: refetchLostPets } = useQuery({
    queryKey: ["map-lost-pets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_pets")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch adoption posts
  const { data: adoptionPosts } = useQuery({
    queryKey: ["map-adoption-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adoption_posts")
        .select(`*, profiles:user_id (display_name, avatar_url)`)
        .eq("status", "disponible");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch service providers & shelters
  const { providers: serviceProviders } = useServiceProviders();
  const { shelters: adoptionShelters } = useAdoptionShelters();

  // Build filtered markers
  const filteredMarkers = useMemo(() => {
    if (activeView === "lost") {
      return (lostPets || [])
        .filter((pet) => {
          if (!pet.latitude || !pet.longitude) return false;
          if (filters.status !== "all" && pet.report_type !== filters.status) return false;
          if (filters.petType !== "all" && pet.species !== filters.petType) return false;
          // Chip filter
          if (activeChip === "Perdidas" && pet.report_type !== "lost") return false;
          if (activeChip === "Encontradas" && pet.report_type !== "found") return false;
          if (userLocation && filters.searchRadius < 100) {
            const distance = calculateDistance(
              userLocation.lat, userLocation.lng,
              pet.latitude, pet.longitude
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

    if (activeView === "adoption") {
      const markers: any[] = [];

      const showAnimals = activeChip === "Todos" || activeChip === "Mascotas";
      const showShelters = activeChip === "Todos" || activeChip === "Refugios";

      if (showAnimals && (filters.adoptionView === "all" || filters.adoptionView === "animals")) {
        const animalMarkers = (adoptionPosts || [])
          .filter((post) => {
            if (filters.petType !== "all" && post.species !== filters.petType) return false;
            if (filters.petSize !== "all" && post.size !== filters.petSize) return false;
            return true;
          })
          .map((post) => ({
            id: post.id,
            position: [
              SANTIAGO_CENTER[0] + (Math.random() - 0.5) * 0.1,
              SANTIAGO_CENTER[1] + (Math.random() - 0.5) * 0.1,
            ] as [number, number],
            type: "adoption",
            data: post,
          }));
        markers.push(...animalMarkers);
      }

      if (showShelters && (filters.adoptionView === "all" || filters.adoptionView === "shelters")) {
        const shelterMarkers = (adoptionShelters || [])
          .filter((shelter) => {
            if (!shelter.latitude || !shelter.longitude) return false;
            if (filters.petType !== "all") {
              if (!shelter.animal_types?.includes(filters.petType)) return false;
            }
            if (userLocation && filters.searchRadius < 100) {
              const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                shelter.latitude, shelter.longitude
              );
              if (distance > filters.searchRadius) return false;
            }
            return true;
          })
          .map((shelter) => ({
            id: `shelter-${shelter.id}`,
            position: [shelter.latitude!, shelter.longitude!] as [number, number],
            type: "shelter",
            data: shelter,
          }));
        markers.push(...shelterMarkers);
      }

      return markers;
    }

    if (activeView === "services") {
      const chipToServiceType: Record<string, string> = {
        Veterinarias: "veterinarian",
        Paseos: "dog_walker",
        Cuidadores: "dogsitter",
        Entrenadores: "trainer",
        Grooming: "grooming",
      };

      return (serviceProviders || [])
        .filter((provider) => {
          if (!provider.latitude || !provider.longitude) return false;
          // Chip-based filter
          if (activeChip !== "Todos") {
            const requiredType = chipToServiceType[activeChip];
            if (requiredType) {
              const hasService = provider.services?.some(
                (s) => s.service_type === requiredType && s.is_active
              );
              if (!hasService) return false;
            }
          }
          // Dialog filter
          if (filters.serviceType !== "all") {
            const hasService = provider.services?.some(
              (s) => s.service_type === filters.serviceType && s.is_active
            );
            if (!hasService) return false;
          }
          if (userLocation && filters.searchRadius < 100) {
            const distance = calculateDistance(
              userLocation.lat, userLocation.lng,
              provider.latitude, provider.longitude
            );
            if (distance > filters.searchRadius) return false;
          }
          return true;
        })
        .map((provider) => ({
          id: provider.id,
          position: [provider.latitude!, provider.longitude!] as [number, number],
          type: provider.services?.[0]?.service_type || "service",
          data: provider,
        }));
    }

    return [];
  }, [activeView, lostPets, adoptionPosts, adoptionShelters, serviceProviders, filters, userLocation, activeChip]);

  // Map center
  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (filteredMarkers.length > 0) {
      const avgLat = filteredMarkers.reduce((sum: number, m: any) => sum + m.position[0], 0) / filteredMarkers.length;
      const avgLng = filteredMarkers.reduce((sum: number, m: any) => sum + m.position[1], 0) / filteredMarkers.length;
      return [avgLat, avgLng];
    }
    return SANTIAGO_CENTER;
  }, [userLocation, filteredMarkers]);

  // Get marker icon for type
  const getIcon = useCallback((type: string): L.DivIcon => {
    return markerIcons[type] || markerIcons.service;
  }, []);

  // Handle "Mi ubicacion" button
  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) return;
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
    if (activeView === "lost") {
      setShowCreateLostPet(true);
    } else if (activeView === "adoption") {
      setShowCreateAdoption(true);
    }
  };

  // Popup type resolver
  const getPopupType = (marker: any): "lost" | "adoption" | "shelter" | "service" => {
    if (activeView === "lost") return "lost";
    if (activeView === "adoption") return marker.type === "shelter" ? "shelter" : "adoption";
    return "service";
  };

  // Tab config
  const tabs: { value: MapView; label: string; icon: React.ReactNode; activeClass: string }[] = [
    { value: "lost", label: "Perdidas", icon: <Search className="h-4 w-4" />, activeClass: "bg-red-500 text-white" },
    { value: "adoption", label: "Adopcion", icon: <Heart className="h-4 w-4" />, activeClass: "bg-orange-500 text-white" },
    { value: "services", label: "Servicios", icon: <Briefcase className="h-4 w-4" />, activeClass: "bg-blue-500 text-white" },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] md:m-4 md:rounded-xl overflow-hidden">
      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: "#e5e7eb" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fly to user location when requested */}
        {flyTarget && <FlyToLocation position={flyTarget} />}

        {/* Data markers */}
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getIcon(marker.type)}
          >
            <Popup maxWidth={340} minWidth={280} className="leaflet-popup-custom">
              <MapPinPopup
                type={getPopupType(marker)}
                data={marker.data}
                userLocation={userLocation || undefined}
                onClose={() => {}}
              />
            </Popup>
          </Marker>
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          />
        )}
      </MapContainer>

      {/* View tabs overlay - top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-lg">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              activeView === tab.value
                ? tab.activeClass
                : "text-foreground/70 hover:bg-white"
            )}
            onClick={() => setActiveView(tab.value)}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        <button
          className="flex items-center px-2 py-2 rounded-lg text-foreground/70 hover:bg-white transition-all"
          onClick={() => setShowFilters(true)}
          title="Filtros"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Floating filter chips */}
      <div className="absolute top-[4.5rem] left-4 right-4 z-[1000] flex gap-2 overflow-x-auto pb-2">
        {FILTER_CHIPS[activeView].map((chip) => (
          <button
            key={chip}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-sm transition-all",
              activeChip === chip
                ? "bg-primary text-primary-foreground"
                : "bg-white/90 backdrop-blur-sm text-foreground hover:bg-white"
            )}
            onClick={() => setActiveChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Results count badge */}
      <div className="absolute top-[7rem] left-4 z-[1000]">
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{filteredMarkers.length} resultados</span>
        </div>
      </div>

      {/* Empty state overlay */}
      {filteredMarkers.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-lg text-center pointer-events-auto max-w-xs">
            <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              No hay servicios en esta zona todavia
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Intenta cambiar los filtros o ampliar el radio de busqueda
            </p>
          </div>
        </div>
      )}

      {/* "Mi ubicacion" button - bottom right */}
      <button
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute bottom-24 right-4 z-[1000] bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
        title="Mi ubicacion"
      >
        {locating ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <LocateFixed className="h-5 w-5 text-primary" />
        )}
      </button>

      {/* FAB - Floating Action Button */}
      {activeView !== "services" && (
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
          {activeView === "lost" && (
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
          {activeView === "adoption" && (
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
          {activeView === "services" && (
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
        </CardContent>
      </Card>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
          </DialogHeader>
          <MapFilters
            activeView={activeView}
            filters={filters}
            setFilters={setFilters}
            onClose={() => setShowFilters(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Lost Pet Dialog */}
      <Dialog open={showCreateLostPet} onOpenChange={setShowCreateLostPet}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reportar Mascota</DialogTitle>
          </DialogHeader>
          <ReportLostPetForm
            onSuccess={() => {
              setShowCreateLostPet(false);
              refetchLostPets();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Create Adoption Post Dialog */}
      <CreateAdoptionPost
        open={showCreateAdoption}
        onOpenChange={setShowCreateAdoption}
        onSuccess={() => setShowCreateAdoption(false)}
      />
    </div>
  );
};

export default Maps;
