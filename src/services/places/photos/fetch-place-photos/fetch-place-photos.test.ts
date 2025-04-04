import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PHOTOS_CONFIG } from '@/constants/photos';
import { redis } from '@/lib/redis';
import { fetchPlacePhotos } from './fetch-place-photos';
import { fetchPhoto } from '../fetch-photo/fetch-photo';
import { fetchPhotoMetadata } from '../fetch-photo-metadata/fetch-photo-metadata';

// Mock dependencies
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
  CACHE_EXPIRATION_TIME: 60 * 60 * 24 * 30, // 30 days
}));

vi.mock('../fetch-photo/fetch-photo', () => ({
  fetchPhoto: vi.fn(),
}));

vi.mock('../fetch-photo-metadata/fetch-photo-metadata', () => ({
  fetchPhotoMetadata: vi.fn(),
}));

describe('fetchPlacePhotos', () => {
  const mockPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  const mockPhotoNames = ['photo1', 'photo2', 'photo3'];
  const mockPhotoUrls = [
    new URL('https://example.com/photo1.jpg'),
    new URL('https://example.com/photo2.jpg'),
    new URL('https://example.com/photo3.jpg'),
  ];
  const mockCacheKey = `${PHOTOS_CONFIG.CACHE_KEY}:${PHOTOS_CONFIG.CACHE_VERSION}:${mockPlaceId}`;

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementations
    (redis.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (redis.set as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined
    );
    (
      fetchPhotoMetadata as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockPhotoNames);

    // Mock fetchPhoto to return URLs
    mockPhotoNames.forEach(() => {
      (fetchPhoto as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (photoName: string) => {
          const idx = mockPhotoNames.indexOf(photoName);
          if (idx !== -1) {
            return Promise.resolve(mockPhotoUrls[idx]);
          }
          return Promise.reject(new Error(`Photo not found: ${photoName}`));
        }
      );
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached photos when available', async () => {
    // Mock cache hit
    (redis.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPhotoUrls
    );

    const result = await fetchPlacePhotos({ id: mockPlaceId });

    // Verify cache was checked
    expect(redis.get).toHaveBeenCalledWith(mockCacheKey);

    // Verify result contains cached data
    expect(result).toEqual({
      data: mockPhotoUrls,
      count: mockPhotoUrls.length,
      cacheHit: true,
    });

    // Verify no API calls were made
    expect(fetchPhotoMetadata).not.toHaveBeenCalled();
    expect(fetchPhoto).not.toHaveBeenCalled();
  });

  it('should fetch photos from API when cache is empty', async () => {
    const result = await fetchPlacePhotos({ id: mockPlaceId });

    // Verify cache was checked
    expect(redis.get).toHaveBeenCalledWith(mockCacheKey);

    // Verify API calls were made
    expect(fetchPhotoMetadata).toHaveBeenCalledWith(mockPlaceId);
    expect(fetchPhoto).toHaveBeenCalledTimes(mockPhotoNames.length);

    // Verify result contains API data
    expect(result).toEqual({
      data: mockPhotoUrls,
      count: mockPhotoUrls.length,
      cacheHit: false,
    });

    // Verify cache was updated
    expect(redis.set).toHaveBeenCalledWith(
      mockCacheKey,
      mockPhotoUrls,
      expect.any(Object)
    );
  });

  it('should bypass cache when bypassCache is true', async () => {
    // Even with cached data available
    (redis.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPhotoUrls
    );

    const result = await fetchPlacePhotos({
      id: mockPlaceId,
      bypassCache: true,
    });

    // Verify cache was not checked
    expect(redis.get).not.toHaveBeenCalled();

    // Verify API calls were made
    expect(fetchPhotoMetadata).toHaveBeenCalledWith(mockPlaceId);
    expect(fetchPhoto).toHaveBeenCalledTimes(mockPhotoNames.length);

    // Verify result contains API data
    expect(result).toEqual({
      data: mockPhotoUrls,
      count: mockPhotoUrls.length,
      cacheHit: false,
    });
  });

  it('should respect the limit parameter', async () => {
    const limit = 2;
    const result = await fetchPlacePhotos({ id: mockPlaceId, limit });

    // Verify only the specified number of photos were fetched
    expect(fetchPhoto).toHaveBeenCalledTimes(limit);

    // Verify result contains limited data
    expect(result.data.length).toBe(limit);
    expect(result.count).toBe(limit);
  });

  it('should handle partial failures with Promise.allSettled', async () => {
    // Mock one photo fetch to fail
    (fetchPhoto as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockPhotoUrls[0])
      .mockRejectedValueOnce(new Error('Failed to fetch photo'))
      .mockResolvedValueOnce(mockPhotoUrls[2]);

    const result = await fetchPlacePhotos({ id: mockPlaceId });

    // Verify all photo fetches were attempted
    expect(fetchPhoto).toHaveBeenCalledTimes(mockPhotoNames.length);

    // Verify only successful photos are in the result
    expect(result.data.length).toBe(2);
    expect(result.data).toEqual([mockPhotoUrls[0], mockPhotoUrls[2]]);

    // Verify cache was still updated with successful photos
    expect(redis.set).toHaveBeenCalledWith(
      mockCacheKey,
      [mockPhotoUrls[0], mockPhotoUrls[2]],
      expect.any(Object)
    );
  });

  it('should handle all failures with Promise.allSettled', async () => {
    // Mock all photo fetches to fail
    (fetchPhoto as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to fetch photo')
    );

    const result = await fetchPlacePhotos({ id: mockPlaceId });

    // Verify all photo fetches were attempted
    expect(fetchPhoto).toHaveBeenCalledTimes(mockPhotoNames.length);

    // Verify result contains empty data
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);

    // Verify cache was not updated
    expect(redis.set).not.toHaveBeenCalled();
  });
});
