/**
 * Geocoding Service - Convert between coordinates and addresses
 * 
 * Uses Nominatim (OpenStreetMap) for geocoding services
 * Privacy-friendly and free to use with proper attribution
 */

export interface GeocodingResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  displayName?: string;
  country?: string;
  city?: string;
  state?: string;
}

/**
 * Reverse geocode coordinates to get location information
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Location information with name and address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Triper/1.0', // Nominatim requires user agent
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract meaningful name from display_name
    const name = extractLocationName(data);
    const address = data.display_name || formatCoordinates(lat, lng);
    
    return {
      name,
      address,
      lat,
      lng,
      displayName: data.display_name,
      country: data.address?.country,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    
    // Fallback to coordinates
    return {
      name: 'Selected Location',
      address: formatCoordinates(lat, lng),
      lat,
      lng,
    };
  }
}

/**
 * Extract a meaningful location name from Nominatim result
 */
function extractLocationName(data: any): string {
  // Priority order for location name
  const candidates = [
    data.address?.amenity,
    data.address?.building,
    data.address?.shop,
    data.address?.tourism,
    data.address?.road,
    data.address?.suburb,
    data.address?.neighbourhood,
    data.address?.city,
    data.address?.town,
    data.address?.village,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') {
      return candidate;
    }
  }

  // Fallback: first part of display name
  if (data.display_name) {
    const parts = data.display_name.split(',');
    return parts[0].trim();
  }

  return 'Selected Location';
}

/**
 * Format coordinates as a readable string
 */
function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Forward geocode: search for a location by name
 * 
 * @param query - Search query (e.g., "Eiffel Tower, Paris")
 * @param limit - Maximum number of results
 * @returns Array of location results
 */
export async function forwardGeocode(
  query: string,
  limit: number = 5
): Promise<GeocodingResult[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Triper/1.0',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((result: any) => ({
      name: extractLocationName(result),
      address: result.display_name || formatCoordinates(result.lat, result.lon),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      country: result.address?.country,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
    }));
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    return [];
  }
}

/**
 * Debounced geocoding search for autocomplete
 */
let geocodeTimeout: NodeJS.Timeout | null = null;

export function debouncedGeocode(
  query: string,
  callback: (results: GeocodingResult[]) => void,
  delay: number = 300
): void {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout);
  }

  geocodeTimeout = setTimeout(async () => {
    const results = await forwardGeocode(query);
    callback(results);
  }, delay);
}
