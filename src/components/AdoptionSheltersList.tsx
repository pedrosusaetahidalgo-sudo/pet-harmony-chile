import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdoptionShelters, AdoptionShelter } from "@/hooks/useAdoptionShelters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Sparkles, MapPin, Search, Filter, Building2, Dog, Cat, 
  Loader2, RefreshCw, Map as MapIcon, List, Navigation,
  ExternalLink, MessageCircle
} from "lucide-react";
import GoogleMapsLoader from "@/components/GoogleMapsLoader";
import { GoogleMap, Marker, InfoWindow, MarkerClusterer } from "@react-google-maps/api";
import ShelterDetailCard from "@/components/maps/ShelterDetailCard";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = { lat: -33.4489, lng: -70.6693 };

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const typeLabels: Record<string, string> = {
  ong: "ONG",
  fundacion: "Fundación",
  refugio: "Refugio",
  independiente: "Casa de Acogida",
};

const typeColors: Record<string, string> = {
  ong: "#10b981",
  fundacion: "#3b82f6",
  refugio: "#8b5cf6",
  independiente: "#f59e0b",
};

const AdoptionSheltersList = () => {
  const { user } = useAuth();
  const { shelters, isLoading, generateShelters, filterShelters, getCommunes, hasNoShelters } = useAdoptionShelters();
  
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAnimal, setSelectedAnimal] = useState("all");
  const [selectedCommune, setSelectedCommune] = useState("all");
  const [selectedShelter, setSelectedShelter] = useState<AdoptionShelter | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // Filter shelters
  const filteredShelters = useMemo(() => {
    let filtered = filterShelters(shelters, {
      type: selectedType,
      animalType: selectedAnimal,
      commune: selectedCommune,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
    });

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.commune?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [shelters, selectedType, selectedAnimal, selectedCommune, searchQuery, userLocation, filterShelters]);

  // Map markers
  const markers = useMemo(() => {
    return filteredShelters
      .filter((s) => s.latitude && s.longitude)
      .map((shelter) => ({
        id: shelter.id,
        position: { lat: shelter.latitude!, lng: shelter.longitude! },
        data: shelter,
      }));
  }, [filteredShelters]);

  // Map center
  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
      return { lat: avgLat, lng: avgLng };
    }
    return defaultCenter;
  }, [userLocation, markers]);

  const getMarkerIcon = (type: string) => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: typeColors[type] || "#8b5cf6",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 1.5,
    anchor: new google.maps.Point(12, 22),
  });

  const handleGenerateShelters = async () => {
    await generateShelters.mutateAsync(15);
  };

  const handleShelterClick = (shelter: AdoptionShelter) => {
    setSelectedShelter(shelter);
    setShowDetailDialog(true);
  };

  const communes = getCommunes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show generate button if no shelters
  if (hasNoShelters) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay refugios disponibles</h3>
        <p className="text-muted-foreground mb-4">
          Genera una lista de refugios y hogares de adopción impulsada por IA
        </p>
        <Button onClick={handleGenerateShelters} disabled={generateShelters.isPending}>
          {generateShelters.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Refugios con IA
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
        <span className="font-medium">Nota:</span> Estos refugios fueron generados con inteligencia artificial como referencia. Verifica la información antes de contactar.
      </div>

      {/* Header with AI badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="gap-1 bg-gradient-to-r from-primary to-secondary text-white">
            <Sparkles className="h-3 w-3" />
            Impulsado por IA
          </Badge>
          <span className="text-sm text-muted-foreground">
            {filteredShelters.length} refugios encontrados
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateShelters}
          disabled={generateShelters.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${generateShelters.isPending ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar refugios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ong">ONG</SelectItem>
            <SelectItem value="fundacion">Fundación</SelectItem>
            <SelectItem value="refugio">Refugio</SelectItem>
            <SelectItem value="independiente">Independiente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Animal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="perro">Perros</SelectItem>
            <SelectItem value="gato">Gatos</SelectItem>
          </SelectContent>
        </Select>
        {communes.length > 0 && (
          <Select value={selectedCommune} onValueChange={setSelectedCommune}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Comuna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {communes.map((commune) => (
                <SelectItem key={commune} value={commune!}>
                  {commune}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "map" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("map")}
        >
          <MapIcon className="h-4 w-4 mr-2" />
          Mapa
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4 mr-2" />
          Lista
        </Button>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="relative">
          <GoogleMapsLoader>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={11}
              options={mapOptions}
            >
              <MarkerClusterer
                options={{
                  imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
                  gridSize: 60,
                  minimumClusterSize: 2,
                }}
              >
                {(clusterer) => (
                  <>
                    {markers.map((marker) => (
                      <Marker
                        key={marker.id}
                        position={marker.position}
                        icon={getMarkerIcon(marker.data.type)}
                        onClick={() => handleShelterClick(marker.data)}
                        clusterer={clusterer}
                      />
                    ))}
                  </>
                )}
              </MarkerClusterer>

              {userLocation && (
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

              {selectedShelter && !showDetailDialog && selectedShelter.latitude && selectedShelter.longitude && (
                <InfoWindow
                  position={{ lat: selectedShelter.latitude, lng: selectedShelter.longitude }}
                  onCloseClick={() => setSelectedShelter(null)}
                >
                  <div className="max-w-[280px] p-1">
                    <ShelterDetailCard shelter={selectedShelter} compact />
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </GoogleMapsLoader>

          {/* Legend */}
          <Card className="absolute bottom-4 left-4 shadow-lg">
            <CardContent className="p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Tipo de organización</p>
              {Object.entries(typeLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: typeColors[key] }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShelters.map((shelter) => (
            <Card
              key={shelter.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleShelterClick(shelter)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: typeColors[shelter.type] || "#8b5cf6" }}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className="text-xs text-white"
                        style={{ backgroundColor: typeColors[shelter.type] }}
                      >
                        {typeLabels[shelter.type]}
                      </Badge>
                      {shelter.is_verified && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-2 w-2" />
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{shelter.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{shelter.commune}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {shelter.animal_types?.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs gap-1">
                      {type === "perro" ? <Dog className="h-2 w-2" /> : <Cat className="h-2 w-2" />}
                      {type}
                    </Badge>
                  ))}
                </div>

                {shelter.ai_description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex items-start gap-1">
                    <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    {shelter.ai_description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredShelters.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No se encontraron refugios con los filtros seleccionados</p>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {selectedShelter && <ShelterDetailCard shelter={selectedShelter} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdoptionSheltersList;
