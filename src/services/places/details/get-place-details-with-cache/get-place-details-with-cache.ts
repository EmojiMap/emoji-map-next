import { DETAILS_CONFIG } from '@/constants/details';
import { redis } from '@/lib/redis';
import type { DetailResponse, PlaceWithReviews } from '@/types/details';
import { log } from '@/utils/log';
import { fetchDetails } from '../fetch-details/fetch-details';
import { generateCacheKey } from '../generate-cache-key/generate-cache-key';

interface FetchPlaceDetailsOptions {
  id: string;
  bypassCache?: boolean;
}

/**
 * Fetches place details from cache or API and caches the result
 *
 * @param options - The options for fetching place details
 * @param options.id - The ID of the place to fetch details for
 * @param options.bypassCache - Whether to bypass the cache and fetch fresh data from the API
 */
export async function getPlaceDetailsWithCache({
  id,
  bypassCache,
}: FetchPlaceDetailsOptions): Promise<DetailResponse> {
  const cacheKey = generateCacheKey({ id });

  // Check cache if not bypassing
  if (!bypassCache && cacheKey) {
    const cachedData = await redis.get<PlaceWithReviews>(cacheKey);
    if (cachedData) {
      log.success(`[DETAILS]Cache hit`);

      return {
        data: cachedData,
        cacheHit: true,
        count: 1,
      };
    }
    log.debug(`[DETAILS] Cache miss`);
  }

  // Fetch details from API
  const details = await fetchDetails(id);

  // Cache the results
  await redis.set(cacheKey, details, {
    ex: DETAILS_CONFIG.CACHE_EXPIRATION_TIME,
  });

  log.info(`[DETAILS] cache set`);

  return {
    data: details,
    cacheHit: false,
    count: 1,
  };
}
