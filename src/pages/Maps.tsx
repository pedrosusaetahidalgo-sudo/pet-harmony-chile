import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, Heart, Briefcase, Plus, Filter, Navigation, 
  MapPin, X, AlertCircle, Home, Dog, Loader2, Building2, Sparkles 
} from "lucide-react";
import GoogleMapsLoader from "@/components/GoogleMapsLoader";
import { GoogleMap, Marker, InfoWindow, MarkerClusterer } from "@react-google-maps/api";
import ReportLostPetForm from "@/components/ReportLostPetForm";
import { CreateAdoptionPost } from "@/components/CreateAdoptionPost";
import MapFilters from "@/components/maps/MapFilters";
import LostPetDetailCard from "@/components/maps/LostPetDetailCard";
import AdoptionDetailCard from "@/components/maps/AdoptionDetailCard";
import ServiceDetailCard from "@/components/maps/ServiceDetailCard";
import ShelterDetailCard from "@/components/maps/ShelterDetailCard";
import MapPinPopup from "@/components/maps/MapPinPopup";
import { useServiceProviders, SERVICE_TYPE_LABELS, SERVICE_TYPE_ICONS } from "@/hooks/useServiceProviders";
import { useAdoptionShelters } from "@/hooks/useAdoptionShelters";

const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 200px)",
  minHeight: "500px",
};

const defaultCenter = { lat: -33.4489, lng: -70.6693 }; // Santiago, Chile

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

type MapView = "lost" | "adoption" | "services";

interface UserLocation {
  lat: number;
  lng: number;
}

const Maps = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<MapView>("lost");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateLostPet, setShowCreateLostPet] = useState(false);
  const [showCreateAdoption, setShowCreateAdoption] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapRef, setMapRef] = useState<any>(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    searchRadius: 50, // km
    petType: "all",
    petSize: "all",
    status: "all", // lost/found for lost pets
    serviceType: "all",
    adoptionView: "all", // 'all', 'animals', 'shelters' for adoption map
  });

  // Get user location
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
        .select(`
          *,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq("status", "disponible");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch service providers
  const { providers: serviceProviders } = useServiceProviders();

  // Fetch adoption shelters
  const { shelters: adoptionShelters } = useAdoptionShelters();

  // Calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter markers based on active view and filters
  const filteredMarkers = useMemo(() => {
    if (activeView === "lost") {
      return (lostPets || [])
        .filter((pet) => {
          if (!pet.latitude || !pet.longitude) return false;
          if (filters.status !== "all" && pet.report_type !== filters.status) return false;
          if (filters.petType !== "all" && pet.species !== filters.petType) return false;
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
          position: { lat: pet.latitude!, lng: pet.longitude! },
          type: pet.report_type,
          data: pet,
        }));
    }

    if (activeView === "adoption") {
      const markers: any[] = [];
      
      // Add adoption animals if filter allows
      if (filters.adoptionView === "all" || filters.adoptionView === "animals") {
        const animalMarkers = (adoptionPosts || [])
          .filter((post) => {
            if (filters.petType !== "all" && post.species !== filters.petType) return false;
            if (filters.petSize !== "all" && post.size !== filters.petSize) return false;
            return true;
          })
          .map((post, index) => ({
            id: post.id,
            // Generate positions around Santiago for posts without coordinates
            position: {
              lat: defaultCenter.lat + (Math.random() - 0.5) * 0.1,
              lng: defaultCenter.lng + (Math.random() - 0.5) * 0.1,
            },
            type: "adoption",
            data: post,
          }));
        markers.push(...animalMarkers);
      }
      
      // Add shelters if filter allows
      if (filters.adoptionView === "all" || filters.adoptionView === "shelters") {
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
            position: { lat: shelter.latitude!, lng: shelter.longitude! },
            type: "shelter",
            data: shelter,
          }));
        markers.push(...shelterMarkers);
      }
      
      return markers;
    }

    if (activeView === "services") {
      return (serviceProviders || [])
        .filter((provider) => {
          if (!provider.latitude || !provider.longitude) return false;
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
          position: { lat: provider.latitude!, lng: provider.longitude! },
          type: provider.services?.[0]?.service_type || "service",
          data: provider,
        }));
    }

    return [];
  }, [activeView, lostPets, adoptionPosts, adoptionShelters, serviceProviders, filters, userLocation]);

  // Get marker icon based on type - only call when google is available
  const getMarkerIcon = useCallback((type: string, activeView: MapView) => {
    if (typeof google === "undefined") return undefined;
    
    const baseIcon = {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
      scale: 1.5,
      anchor: new google.maps.Point(12, 22),
    };

    if (activeView === "lost") {
      return {
        ...baseIcon,
        fillColor: type === "lost" ? "#ef4444" : "#10b981",
      };
    }

    if (activeView === "adoption") {
      if (type === "shelter") {
        return {
          ...baseIcon,
          fillColor: "#8b5cf6", // Purple for shelters
        };
      }
      return {
        ...baseIcon,
        fillColor: "#f97316", // Orange for adoption animals
      };
    }

    // Services - different colors per type
    const serviceColors: Record<string, string> = {
      dog_walker: "#3b82f6", // Blue
      dogsitter: "#8b5cf6", // Purple
      veterinarian: "#10b981", // Green
      trainer: "#f59e0b", // Amber
      grooming: "#ec4899", // Pink
      service: "#6b7280", // Gray default
    };

    return {
      ...baseIcon,
      fillColor: serviceColors[type] || "#6b7280",
    };
  }, []);

  // Map center based on markers or user location
  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    if (filteredMarkers.length > 0) {
      const avgLat = filteredMarkers.reduce((sum, m) => sum + m.position.lat, 0) / filteredMarkers.length;
      const avgLng = filteredMarkers.reduce((sum, m) => sum + m.position.lng, 0) / filteredMarkers.length;
      return { lat: avgLat, lng: avgLng };
    }
    return defaultCenter;
  }, [userLocation, filteredMarkers]);

  // Handle FAB action
  const handleFabClick = () => {
    if (activeView === "lost") {
      setShowCreateLostPet(true);
    } else if (activeView === "adoption") {
      setShowCreateAdoption(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMapLoad = useCallback((map: any) => {
    setMapRef(map);
  }, []);

  // Cluster options
  const clusterOptions = {
    imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    gridSize: 60,
    minimumClusterSize: 2,
    maxZoom: 15,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-3 bg-warm-gradient bg-clip-text text-transparent">
            Mapa Interactivo
          </h1>
          
          {/* Tabs */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as MapView)}>
            <div className="flex items-center gap-2">
              <TabsList className="flex-1 grid grid-cols-3 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="lost" 
                  className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white gap-1"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Perdidas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="adoption"
                  className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-1"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Adopción</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="services"
                  className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-1"
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Servicios</span>
                </TabsTrigger>
              </TabsList>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(true)}
                className="h-10 w-10 rounded-xl"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </Tabs>
          
          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {filteredMarkers.length} resultados
            </span>
            {userLocation && (
              <Badge variant="outline" className="gap-1">
                <Navigation className="h-3 w-3" />
                Ubicación activa
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMapsLoader>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={12}
            options={mapOptions}
            onLoad={onMapLoad}
          >
            {/* Marker Clusterer */}
            <MarkerClusterer options={clusterOptions}>
              {(clusterer) => (
                <>
                  {filteredMarkers.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={marker.position}
                      icon={getMarkerIcon(marker.type, activeView)}
                      onClick={() => setSelectedItem(marker)}
                      clusterer={clusterer}
                    />
                  ))}
                </>
              )}
            </MarkerClusterer>

            {/* User location marker */}
            {userLocation && typeof google !== "undefined" && (
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#4F46E5",
                  fillOpacity: 1,
                  strokeWeight: 3,
                  strokeColor: "#ffffff",
                  scale: 8,
                }}
              />
            )}

            {/* Info Window with Enhanced Popup */}
            {selectedItem && (
              <InfoWindow
                position={selectedItem.position}
                onCloseClick={() => setSelectedItem(null)}
              >
                <div className="p-0">
                  {activeView === "lost" && (
                    <MapPinPopup
                      type="lost"
                      data={selectedItem.data}
                      userLocation={userLocation}
                      onClose={() => setSelectedItem(null)}
                    />
                  )}
                  {activeView === "adoption" && selectedItem.type === "shelter" && (
                    <MapPinPopup
                      type="shelter"
                      data={selectedItem.data}
                      userLocation={userLocation}
                      onClose={() => setSelectedItem(null)}
                    />
                  )}
                  {activeView === "adoption" && selectedItem.type !== "shelter" && (
                    <MapPinPopup
                      type="adoption"
                      data={selectedItem.data}
                      userLocation={userLocation}
                      onClose={() => setSelectedItem(null)}
                    />
                  )}
                  {activeView === "services" && (
                    <MapPinPopup
                      type="service"
                      data={selectedItem.data}
                      userLocation={userLocation}
                      onClose={() => setSelectedItem(null)}
                    />
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </GoogleMapsLoader>

        {/* FAB - Floating Action Button */}
        {activeView !== "services" && (
          <Button
            onClick={handleFabClick}
            className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-warm-gradient hover:opacity-90"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        {/* Legend */}
        <Card className="absolute bottom-6 left-4 shadow-lg">
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
      </div>

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
