// Minimal Google Maps types for PlacesAutocomplete component
declare namespace google.maps.places {
  class Autocomplete {
    constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
    addListener(event: string, handler: () => void): void;
    getPlace(): PlaceResult;
  }
  interface AutocompleteOptions {
    componentRestrictions?: { country: string };
    types?: string[];
    fields?: string[];
  }
  interface PlaceResult {
    formatted_address?: string;
    geometry?: {
      location: {
        lat(): number;
        lng(): number;
      };
    };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }
}
