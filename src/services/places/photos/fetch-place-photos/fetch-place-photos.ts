import { PHOTOS_CONFIG } from '@/constants/photos';
import { redis } from '@/lib/redis';
import type { PhotosResponse } from '@/types/google-photos';
import { log } from '@/utils/log';
import { fetchPhoto } from '../fetch-photo/fetch-photo';
import { fetchPhotoMetadata } from '../fetch-photo-metadata/fetch-photo-metadata';

/**
 * Represents the response from the photo fetching operation.
 *
 * @interface PhotosResponse
 * @property {URL[]} data - Array of URLs for the fetched photos
 * @property {number} count - Total number of photos returned
 * @property {boolean} cacheHit - Indicates whether the data was retrieved from cache
 */
interface FetchPlacePhotosOptions {
  id: string;
  limit?: number;
  bypassCache?: boolean;
}

/**
 * Fetches and caches place photos from Google Places API.
 *
 * This function first checks the cache for existing photos (unless bypassCache is true),
 * and if not found or if bypassing cache, it fetches the photo metadata and then
 * retrieves the actual photo URLs.
 *
 * @param options - The options for fetching place photos
 * @param options.id - The place ID to fetch photos for
 * @param options.limit - The maximum number of photos to return (defaults to PHOTOS_CONFIG.DEFAULT_LIMIT)
 * @param options.bypassCache - Whether to bypass the cache and fetch fresh data from the API
 *                             (defaults to false)
 *
 * @returns A Promise that resolves to a PhotosResponse object containing:
 *          - data: Array of URL objects representing the photo URLs
 *          - count: The number of photos returned
 *          - cacheHit: Whether the data was retrieved from cache
 *
 * @example
 * // Fetch photos with cache
 * const photos = await fetchPlacePhotos({ id: 'ChIJN1t_tDeuEmsRUsoyG83frY4' });
 *
 * @example
 * // Fetch photos bypassing cache
 * const freshPhotos = await fetchPlacePhotos({
 *   id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
 *   bypassCache: true
 * });
 */
export async function fetchPlacePhotos({
  id,
  limit = PHOTOS_CONFIG.DEFAULT_LIMIT,
  bypassCache = false,
}: FetchPlacePhotosOptions): Promise<PhotosResponse> {
  const cacheKey = `${PHOTOS_CONFIG.CACHE_KEY}:${PHOTOS_CONFIG.CACHE_VERSION}:${id}`;
  let cachedPhotos: URL[] | null = null;

  // Check cache if not bypassing
  if (!bypassCache) {
    cachedPhotos = await redis.get<URL[]>(cacheKey);
    if (cachedPhotos) {
      log.success('Cache hit', { cacheKey, photoCount: cachedPhotos.length });

      const data = cachedPhotos
        .slice(0, limit)
        .map((photoName) => new URL(photoName));

      return {
        data,
        cacheHit: true,
        count: data.length,
      };
    }
    log.debug('Cache miss', { cacheKey });
  }

  // Fetch photo metadata
  const photoNames = await fetchPhotoMetadata(id);

  // Fetch actual photo URLs (limited to `limit`)
  const photoPromises = photoNames
    .slice(0, limit)
    .map((name) => fetchPhoto(name));

  // Use Promise.allSettled instead of Promise.all to handle potential failures
  const results = await Promise.allSettled(photoPromises);

  // Filter out rejected promises and extract successful results
  const photos = results
    .filter(
      (result): result is PromiseFulfilledResult<URL> =>
        result.status === 'fulfilled'
    )
    .map((result) => result.value);

  // Log any failures
  const failedCount = results.filter(
    (result) => result.status === 'rejected'
  ).length;
  if (failedCount > 0) {
    log.error('Some photos failed to fetch', {
      placeId: id,
      totalAttempted: photoPromises.length,
      failedCount,
      successCount: photos.length,
    });
  }

  // Cache the successfully fetched photos
  if (photos.length > 0) {
    await redis.set(cacheKey, photos, {
      px: PHOTOS_CONFIG.CACHE_EXPIRATION_TIME,
    });
    log.info('Photos cached', { cacheKey, photoCount: photos.length });
  } else {
    log.warn('No photos were successfully fetched to cache', { placeId: id });
  }

  return {
    data: photos,
    cacheHit: false,
    count: photos.length,
  };
}
