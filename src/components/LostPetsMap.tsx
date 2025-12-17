import { useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import GoogleMapsLoader from "./GoogleMapsLoader";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

interface LostPetsMapProps {
  pets: Tables<"lost_pets">[];
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: -33.4489,
  lng: -70.6693, // Santiago, Chile
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const LostPetsMap = ({ pets }: LostPetsMapProps) => {
  const [selectedPet, setSelectedPet] = useState<Tables<"lost_pets"> | null>(null);

  const markers = useMemo(() => {
    return pets
      .filter((pet) => pet.latitude && pet.longitude)
      .map((pet) => ({
        id: pet.id,
        position: { lat: pet.latitude!, lng: pet.longitude! },
        pet,
      }));
  }, [pets]);

  const center = useMemo(() => {
    if (markers.length === 0) return defaultCenter;
    const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers]);

  const getMarkerIcon = (reportType: string) => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: reportType === "lost" ? "#ef4444" : "#10b981",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 1.5,
    anchor: new google.maps.Point(12, 22),
  });

  return (
    <GoogleMapsLoader>
      <div className="rounded-lg overflow-hidden shadow-inner">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
          options={mapOptions}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={getMarkerIcon(marker.pet.report_type)}
              onClick={() => setSelectedPet(marker.pet)}
            />
          ))}

          {selectedPet && selectedPet.latitude && selectedPet.longitude && (
            <InfoWindow
              position={{ lat: selectedPet.latitude, lng: selectedPet.longitude }}
              onCloseClick={() => setSelectedPet(null)}
            >
              <div className="max-w-[250px] p-2">
                <h3
                  className="font-bold mb-2"
                  style={{ color: selectedPet.report_type === "lost" ? "#ef4444" : "#10b981" }}
                >
                  {selectedPet.report_type === "lost" ? "🔍 Perdida" : "✅ Encontrada"}
                </h3>
                {selectedPet.photo_url && (
                  <img
                    src={selectedPet.photo_url}
                    alt={selectedPet.pet_name}
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                )}
                <p className="font-semibold">{selectedPet.pet_name || "Sin nombre"}</p>
                <p className="text-xs text-gray-600 mb-1">
                  {selectedPet.species} - {selectedPet.breed || "Sin raza"}
                </p>
                <p className="text-xs mb-2 line-clamp-2">{selectedPet.description}</p>
                <p className="text-xs text-gray-500">📍 {selectedPet.last_seen_location}</p>
                {selectedPet.contact_phone && (
                  <p className="text-xs text-gray-500">📞 {selectedPet.contact_phone}</p>
                )}
                {selectedPet.reward_offered && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    🏆 Recompensa: ${selectedPet.reward_amount}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </GoogleMapsLoader>
  );
};

export default LostPetsMap;
