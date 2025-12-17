import { GoogleMap as GMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useState, useCallback } from "react";
import { GOOGLE_MAPS_API_KEY } from "./GoogleMapsProvider";

interface MarkerData {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  icon?: string;
  color?: "red" | "green" | "blue" | "yellow";
  content?: React.ReactNode;
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MarkerData[];
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: -33.4489,
  lng: -70.6693, // Santiago, Chile
};

const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const getMarkerIcon = (color: string = "red") => {
  const colors: Record<string, string> = {
    red: "#ef4444",
    green: "#10b981",
    blue: "#3b82f6",
    yellow: "#f59e0b",
  };

  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: colors[color] || colors.red,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 1.5,
    anchor: new google.maps.Point(12, 22),
  };
};

export function GoogleMapComponent({
  center = defaultCenter,
  zoom = 13,
  markers = [],
  onMapClick,
  height = "400px",
  className = "",
}: GoogleMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick && e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    },
    [onMapClick]
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-muted-foreground">
            Google Maps no está configurado.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Configura GOOGLE_MAPS_API_KEY para habilitar el mapa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <GMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onClick={handleMapClick}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            icon={getMarkerIcon(marker.color)}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="max-w-[250px] p-2">
              {selectedMarker.content || (
                <p className="font-medium">{selectedMarker.title}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GMap>
    </div>
  );
}

export default GoogleMapComponent;
