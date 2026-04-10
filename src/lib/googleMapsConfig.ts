/**
 * Configuración centralizada de Google Maps.
 * API key se lee de VITE_GOOGLE_MAPS_API_KEY.
 * Control de costos: session-based autocomplete, lazy loading, caching coords.
 */

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const GOOGLE_MAPS_LIBRARIES: 'places'[] = ['places'];

export const DEFAULT_CENTER = { lat: -33.4489, lng: -70.6693 }; // Santiago, Chile
export const DEFAULT_ZOOM = 12;

export const MAP_STYLES = {
  containerStyle: { width: '100%', height: '100%' },
  options: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy' as const,
  },
};

/** Restricciones para Places Autocomplete — solo Chile, solo direcciones */
export const PLACES_OPTIONS = {
  componentRestrictions: { country: 'cl' },
  types: ['address'] as string[],
  fields: ['formatted_address', 'geometry.location', 'address_components'],
};

export function isGoogleMapsAvailable(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}
