import { useEffect, useState, ReactNode } from "react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { Loader2 } from "lucide-react";

interface GoogleMapsLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

declare global {
  interface Window {
    initGoogleMaps?: () => void;
    google?: typeof google;
  }
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;

  if (window.google?.maps) {
    return Promise.resolve();
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function GoogleMapsLoader({ children, fallback }: GoogleMapsLoaderProps) {
  const { data: apiKey, isLoading: isLoadingKey } = useGoogleMapsKey();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    loadGoogleMapsScript(apiKey)
      .then(() => setIsScriptLoaded(true))
      .catch((err) => setError(err.message));
  }, [apiKey]);

  if (isLoadingKey) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando mapa...</span>
        </div>
      )
    );
  }

  if (!apiKey || error) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground text-sm">
          {error || "Google Maps no disponible"}
        </p>
      </div>
    );
  }

  if (!isScriptLoaded) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Inicializando mapa...</span>
        </div>
      )
    );
  }

  return <>{children}</>;
}

export default GoogleMapsLoader;
