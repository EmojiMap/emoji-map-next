import { Redis } from '@upstash/redis';
import { SEARCH_CONFIG } from '@/constants/search';
import { env } from '@/env';
import { log } from '@/utils/log';

const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
});

/**
 * Rounds a coordinate to a specified number of decimal places
 *
 * Precision levels:
 * - 0 decimal places: ~111 km precision
 * - 1 decimal place: ~11.1 km precision
 * - 2 decimal places: ~1.11 km precision (default, good balance for caching)
 * - 3 decimal places: ~111 m precision
 * - 4 decimal places: ~11.1 m precision
 * - 5 decimal places: ~1.11 m precision
 * - 6 decimal places: ~0.111 m precision
 *
 * For most location-based caching, 2 decimal places (~1.11km) provides a good balance
 * between cache efficiency and location accuracy
 */
export function roundCoordinate(
  coordinate: number,
  decimals: number = 2
): number {
  const factor = Math.pow(10, decimals);
  return Math.round(coordinate * factor) / factor;
}

/**
 * Normalizes a location string by rounding the coordinates
 * Format: "lat,lng" -> "rounded_lat,rounded_lng"
 */
export function normalizeLocation(
  location: string,
  decimals: number = 2
): string {
  const [lat, lng] = location.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) {
    return location; // Return original if parsing fails
  }

  const roundedLat = roundCoordinate(lat, decimals);
  const roundedLng = roundCoordinate(lng, decimals);

  return `${roundedLat},${roundedLng}`;
}

export async function retrieveOrCache<T>(
  key: string,
  retrieveFn: () => Promise<T>,
  ttl: number = SEARCH_CONFIG.CACHE_EXPIRATION_TIME
): Promise<T & { cacheHit: boolean }> {
  const result = await redis.get<T>(key);

  if (result) {
    log.success(`[SEARCH - ${key}] Cache hit`);
    return { ...result, cacheHit: true };
  }

  log.debug(`[SEARCH - ${key}] Cache miss`);
  const dataToCache = await retrieveFn();
  await redis.set(key, dataToCache, { px: ttl });
  log.info(`[SEARCH - ${key}] cache set`);

  return { ...dataToCache, cacheHit: false };
}
