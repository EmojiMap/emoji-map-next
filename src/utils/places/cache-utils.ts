import { SEARCH_CONFIG } from '@/constants/search';

interface SearchParams {
  keys?: number[];
  openNow?: boolean;
  priceLevels?: number[];
  radius?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  bypassCache?: boolean;
  maxResultCount?: number;
  minimumRating?: number;
}

/**
 * Generates a cache key for Redis based on search parameters.
 * Format: search:{lat}:{lon}:{radius}:{keys}:{openNow}:{priceLevels}:{minRating}:{maxResults}:{version}
 * Example: search:47.61:-122.33:5000:1,2,3:false:1,2:4.5:20:v1
 *
 * @param params - Search parameters object
 * @param version - Cache version string to invalidate all keys when needed
 * @returns Formatted cache key string
 */
export function generateCacheKey(
  params: SearchParams,
  version = SEARCH_CONFIG.CACHE_KEY_VERSION
): string {
  // Round coordinates to specified decimal places
  const lat = Number(
    params.location.latitude.toFixed(SEARCH_CONFIG.LOCATION_DIGITS)
  );
  const lon = Number(
    params.location.longitude.toFixed(SEARCH_CONFIG.LOCATION_DIGITS)
  );

  // Sort arrays to ensure consistent key generation
  const sortedKeys = params.keys?.sort((a, b) => a - b).join(',') || 'all';
  const sortedPriceLevels =
    params.priceLevels?.sort((a, b) => a - b).join(',') || 'any';

  // Build key components
  const components = [
    SEARCH_CONFIG.CACHE_KEY,
    lat,
    lon,
    params.radius || SEARCH_CONFIG.DEFAULT_RADIUS_METERS,
    sortedKeys,
    params.openNow || false,
    sortedPriceLevels,
    params.minimumRating || 'any',
    params.maxResultCount || SEARCH_CONFIG.DEFAULT_RECORD_COUNT,
    version,
  ];

  return components.join(':');
}

/**
 * Extracts location coordinates from a cache key.
 * Useful for finding nearby cached results.
 *
 * @param cacheKey - The cache key to parse
 * @returns Location coordinates or null if invalid key
 */
export function extractLocationFromCacheKey(
  cacheKey: string
): { latitude: number; longitude: number } | null {
  const parts = cacheKey.split(':');
  if (parts.length < 3) return null;

  const lat = Number(parts[1]);
  const lon = Number(parts[2]);

  if (isNaN(lat) || isNaN(lon)) return null;

  return {
    latitude: lat,
    longitude: lon,
  };
}
