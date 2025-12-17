import { LoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const libraries: ("places" | "geometry" | "drawing")[] = ["places"];

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <>{children}</>;
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
      {children}
    </LoadScript>
  );
}

export { GOOGLE_MAPS_API_KEY };
