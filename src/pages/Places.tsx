import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Globe, Star, DollarSign, Navigation, Loader2, Sparkles, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
const petFriendlyPlaceUrl = "https://images.unsplash.com/photo-1450778869180-cfd0620544af?w=800&h=600&fit=crop";
import { searchGooglePlaces, getPlacePhotoUrl, mapGooglePlaceType } from "@/lib/googlePlaces";
import { calculateDistance } from "@/lib/distance";

interface Place {
  id: string;
  name: string;
  place_type: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating: number;
  price_range?: string;
  amenities?: string[];
  distance?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const Places = () => {
  const [selectedType, setSelectedType] = useState("veterinaria");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Request user location on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("No se pudo obtener tu ubicación. Por favor, activa los permisos de ubicación.");
          toast({
            title: "Ubicación no disponible",
            description: "Activa los permisos de ubicación para ver lugares cercanos.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationError("Tu navegador no soporta geolocalización.");
    }
  }, [toast]);

  const { data: places, isLoading, isError, refetch } = useQuery({
    queryKey: ["places", selectedType, userLocation],
    queryFn: async () => {
      // First, get places from database
      const query = supabase
        .from("places")
        .select("*")
        .eq("place_type", selectedType);

      const { data: dbPlaces, error } = await query;
      if (error) throw error;

      // Enhance with Google Places data if available
      const enhancedPlaces = await Promise.all(
        (dbPlaces || []).map(async (place: any) => {
          // Try to find matching Google Place by name and location
          if (userLocation && place.latitude && place.longitude) {
            try {
              const googlePlaces = await searchGooglePlaces(
                `${place.name} ${selectedType}`,
                { lat: place.latitude, lng: place.longitude },
                1000, // 1km radius
                mapGooglePlaceType([selectedType])
              );

              // Find best match
              const match = googlePlaces.find(
                (gp) =>
                  Math.abs(gp.geometry.location.lat - place.latitude) < 0.01 &&
                  Math.abs(gp.geometry.location.lng - place.longitude) < 0.01
              );

              if (match) {
                // Enhance with Google Places data
                return {
                  ...place,
                  name: match.name || place.name,
                  address: match.formatted_address || place.address,
                  rating: match.rating || place.rating,
                  phone: match.phone_number || place.phone,
                  website: match.website || place.website,
                  google_place_id: match.place_id,
                  google_photo_reference: match.photos?.[0]?.photo_reference,
                };
              }
            } catch (error) {
              console.error('Error enhancing place with Google data:', error);
            }
          }

          return place;
        })
      );

      // Calculate distances if user location is available
      if (userLocation && enhancedPlaces) {
        const placesWithDistance = enhancedPlaces.map((place: any) => ({
          ...place,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            place.latitude,
            place.longitude
          ),
        }));

        // Sort by distance
        return placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      return enhancedPlaces;
    },
  });

  const generatePlacesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-places", {
        body: { city: "Santiago", region: "Metropolitana" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      toast({
        title: "¡Lugares generados!",
        description: "Se han creado nuevos lugares con IA.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al generar lugares",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  // Filter places by search query
  const filteredPlaces = places?.filter((place: Place) =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Explorar Lugares{" "}
            <span className="bg-nature-gradient bg-clip-text text-transparent">
              Pet-Friendly
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {userLocation 
              ? "Lugares ordenados por cercanía a tu ubicación" 
              : "Descubre los mejores lugares que aceptan mascotas cerca de ti"}
          </p>
        </div>

        {/* Search and Location */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar lugares..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <Button
            onClick={() => generatePlacesMutation.mutate()}
            disabled={generatePlacesMutation.isPending}
            className="bg-warm-gradient hover:opacity-90 h-12 rounded-xl shadow-sm gap-2"
          >
            {generatePlacesMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generar con IA
              </>
            )}
          </Button>
        </div>

        {locationError && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Ubicación desactivada</p>
                  <p className="text-sm text-muted-foreground">{locationError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="w-full h-auto flex flex-wrap gap-2 bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/50">
            <TabsTrigger value="veterinaria" className="text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Veterinarias
            </TabsTrigger>
            <TabsTrigger value="parque" className="text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Parques
            </TabsTrigger>
            <TabsTrigger value="peluqueria" className="text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Peluquerías
            </TabsTrigger>
            <TabsTrigger value="tienda" className="text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Tiendas
            </TabsTrigger>
            <TabsTrigger value="hotel" className="text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Hoteles
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            {isError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No pudimos cargar los lugares. Intenta de nuevo.</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">Reintentar</Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !places || places.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No hay lugares disponibles</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Genera lugares con IA para comenzar
                  </p>
                  <Button
                    onClick={() => generatePlacesMutation.mutate()}
                    disabled={generatePlacesMutation.isPending}
                    className="bg-warm-gradient hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Lugares
                  </Button>
                </CardContent>
              </Card>
            ) : filteredPlaces && filteredPlaces.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron lugares con "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-2 sm:p-0">
                {filteredPlaces?.map((place: Place) => (
                  <Card key={place.id} className="overflow-hidden hover:shadow-medium transition-shadow group">
                    <CardContent className="p-0">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={
                            place.google_photo_reference
                              ? getPlacePhotoUrl(place.google_photo_reference, 800)
                              : place.photos?.[0] || petFriendlyPlaceUrl
                          }
                          alt={place.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to default image if Google photo fails
                            (e.target as HTMLImageElement).src = petFriendlyPlaceUrl;
                          }}
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/95 text-foreground backdrop-blur-sm border-0 shadow-sm">
                            <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                            {place.rating}
                          </Badge>
                        </div>
                        {place.distance && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-white/95 text-foreground backdrop-blur-sm border-0 shadow-sm flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              {place.distance.toFixed(1)} km
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-lg">{place.name}</h3>
                            <Badge variant="outline" className="capitalize text-xs">
                              {place.place_type}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {place.description}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{place.address}</span>
                          </div>

                          {place.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                              <a href={`tel:${place.phone}`} className="text-primary hover:underline">
                                {place.phone}
                              </a>
                            </div>
                          )}

                          {place.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                              <a
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                Sitio web
                              </a>
                            </div>
                          )}

                          {place.price_range && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="text-muted-foreground">{place.price_range}</span>
                            </div>
                          )}
                        </div>

                        {place.amenities && place.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {place.amenities.map((amenity, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button 
                            className="flex-1 bg-warm-gradient hover:opacity-90 transition-opacity h-11"
                            onClick={() => {
                              if (place.latitude && place.longitude) {
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
                                  "_blank"
                                );
                              }
                            }}
                          >
                            Ver Detalles
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 h-11"
                            onClick={() => {
                              if (place.latitude && place.longitude) {
                                window.open(
                                  `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
                                  "_blank"
                                );
                              }
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Cómo Llegar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Places;
