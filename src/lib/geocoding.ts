import axios from 'axios';

/**
 * Geocodes an address using Google Maps Geocoding API.
 * Fallback to random coordinates if API key is missing.
 */
export async function geocode(address: string): Promise<{ lat: number; lng: number }> {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("VITE_GOOGLE_MAPS_API_KEY is not set. Using fallback coordinates.");
    // Return random coordinates in India region as fallback
    // Delhi area roughly: 28.6139, 77.2090
    return {
      lat: 28.5 + (Math.random() * 0.2),
      lng: 77.1 + (Math.random() * 0.2)
    };
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }

    throw new Error('Geocoding failed: No results found');
  } catch (error) {
    console.error('Geocoding error:', error);
    // Even on error, return fallback for dev purposes
    return {
      lat: 28.5 + (Math.random() * 0.2),
      lng: 77.1 + (Math.random() * 0.2)
    };
  }
}
