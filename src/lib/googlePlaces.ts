/**
 * Google Places API integration
 * Fetches real place data (name, address, rating, photos) from Google Places API
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{ photo_reference: string }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  phone_number?: string;
  website?: string;
  price_level?: number;
}

/**
 * Search for places using Google Places API Text Search
 */
export async function searchGooglePlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number,
  type?: string
): Promise<GooglePlace[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured');
    return [];
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=es&region=cl`;

    if (location && radius) {
      url += `&location=${location.lat},${location.lng}&radius=${radius}`;
    }

    if (type) {
      url += `&type=${type}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        photos: place.photos,
        geometry: place.geometry,
        types: place.types,
        opening_hours: place.opening_hours,
        phone_number: place.formatted_phone_number,
        website: place.website,
        price_level: place.price_level,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error searching Google Places:', error);
    return [];
  }
}

/**
 * Get place details including photos
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=es&fields=name,formatted_address,rating,user_ratings_total,photos,geometry,types,opening_hours,formatted_phone_number,website,price_level`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return {
        place_id: data.result.place_id,
        name: data.result.name,
        formatted_address: data.result.formatted_address,
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        photos: data.result.photos,
        geometry: data.result.geometry,
        types: data.result.types,
        opening_hours: data.result.opening_hours,
        phone_number: data.result.formatted_phone_number,
        website: data.result.website,
        price_level: data.result.price_level,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Get photo URL from Google Places photo reference
 */
export function getPlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!GOOGLE_MAPS_API_KEY) {
    return '';
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Map Google place type to our place_type
 */
export function mapGooglePlaceType(types: string[]): string {
  const typeMap: Record<string, string> = {
    'veterinary_care': 'veterinaria',
    'pet_store': 'tienda',
    'park': 'parque',
    'lodging': 'hotel',
    'pet_groomer': 'peluqueria',
    'pet_day_care': 'guarderia',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }

  return 'tienda'; // default
}

