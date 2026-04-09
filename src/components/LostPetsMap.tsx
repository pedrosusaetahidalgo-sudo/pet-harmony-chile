import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type L from "leaflet";
import { Tables } from "@/integrations/supabase/types";
import {
  lostPetIcon,
  pawFriendIcon,
  SANTIAGO_CENTER,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
} from "@/lib/leafletConfig";

interface LostPetsMapProps {
  pets: Tables<"lost_pets">[];
}

const LostPetsMap = ({ pets }: LostPetsMapProps) => {
  const markers = useMemo(
    () =>
      pets
        .filter((pet) => pet.latitude != null && pet.longitude != null)
        .map((pet) => ({
          id: pet.id,
          position: [pet.latitude as number, pet.longitude as number] as [number, number],
          pet,
        })),
    [pets]
  );

  const center: [number, number] = useMemo(() => {
    if (markers.length === 0) return SANTIAGO_CENTER;
    const avgLat =
      markers.reduce((sum, m) => sum + m.position[0], 0) / markers.length;
    const avgLng =
      markers.reduce((sum, m) => sum + m.position[1], 0) / markers.length;
    return [avgLat, avgLng];
  }, [markers]);

  return (
    <div className="rounded-lg overflow-hidden shadow-inner" style={{ height: 400 }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={(marker.pet.report_type === "perdida" ? lostPetIcon : pawFriendIcon) as L.Icon}
          >
            <Popup>
              <div className="max-w-[250px]">
                <h3
                  className="font-bold mb-2"
                  style={{
                    color: marker.pet.report_type === "perdida" ? "#ef4444" : "#10b981",
                  }}
                >
                  {marker.pet.report_type === "perdida" ? "🔍 Perdida" : "✅ Encontrada"}
                </h3>
                {marker.pet.photo_url && (
                  <img
                    src={marker.pet.photo_url}
                    alt={marker.pet.pet_name ?? "Mascota"}
                    loading="lazy"
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                )}
                <p className="font-semibold">{marker.pet.pet_name || "Sin nombre"}</p>
                <p className="text-xs text-slate-600 mb-1">
                  {marker.pet.species} — {marker.pet.breed || "Sin raza"}
                </p>
                <p className="text-xs mb-2 line-clamp-2">{marker.pet.description}</p>
                <p className="text-xs text-slate-500">
                  📍 {marker.pet.last_seen_location}
                </p>
                {marker.pet.contact_phone && (
                  <p className="text-xs text-slate-500">📞 {marker.pet.contact_phone}</p>
                )}
                {marker.pet.reward_offered && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    🏆 Recompensa: ${marker.pet.reward_amount}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LostPetsMap;
