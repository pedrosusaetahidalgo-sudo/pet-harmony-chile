/**
 * PlacesAutocomplete — input con autocomplete de Google Places restringido a Chile.
 * Usa session-based billing ($0.017/sesión, no per-keystroke).
 * Fallback: si no hay API key, muestra un input simple de texto.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { isGoogleMapsAvailable } from '@/lib/googleMapsConfig';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  comuna?: string;
}

interface PlacesAutocompleteProps {
  value?: string;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocomplete({
  value = '',
  onSelect,
  placeholder = 'Escribe tu dirección...',
  className,
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'cl' },
      types: ['address'],
      fields: ['formatted_address', 'geometry', 'address_components'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.geometry?.location) return;

      const address = place.formatted_address || '';
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Extraer comuna del address_components
      let comuna: string | undefined;
      place.address_components?.forEach((comp) => {
        if (comp.types.includes('administrative_area_level_3') || comp.types.includes('locality')) {
          comuna = comp.long_name;
        }
      });

      setInputValue(address);
      onSelect({ address, lat, lng, comuna });
    });
  }, [onSelect]);

  useEffect(() => {
    // Si Google Maps ya está cargado, inicializar
    if (window.google?.maps?.places) {
      initAutocomplete();
    }
    // Si no, esperar a que se cargue (el GoogleMapsProvider lo hará)
    const interval = setInterval(() => {
      if (window.google?.maps?.places && !autocompleteRef.current) {
        initAutocomplete();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [initAutocomplete]);

  // Fallback: si no hay Google Maps API key, input simple
  if (!isGoogleMapsAvailable()) {
    return (
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => {
          if (inputValue.trim()) {
            onSelect({ address: inputValue, lat: 0, lng: 0 });
          }
        }}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
