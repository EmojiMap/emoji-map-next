import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PHOTOS_CONFIG } from '@/constants/photos';
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/db';
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

vi.mock('@/lib/db', () => ({
  prisma: {
    photo: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
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
  const mockDbPhotos = mockPhotoUrls.map((url, index) => ({
    id: `photo-${index}`,
    url: url.toString(),
    placeId: mockPlaceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementations
    (redis.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (redis.set as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined
    );
    (
      prisma.photo.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (inngest.send as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
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

    // Verify Inngest event was sent
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create-photos',
      data: {
        id: mockPlaceId,
        photos: mockPhotoUrls.map((url) => url.toString()),
      },
    });
  });

  it('should return photos from database when available and cache is empty', async () => {
    // Mock database hit
    (
      prisma.photo.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockDbPhotos);

    const result = await fetchPlacePhotos({ id: mockPlaceId });

    // Verify cache was checked first
    expect(redis.get).toHaveBeenCalledWith(mockCacheKey);

    // Verify database was checked
    expect(prisma.photo.findMany).toHaveBeenCalledWith({
      where: { placeId: mockPlaceId },
    });

    // Verify result contains database data
    expect(result).toEqual({
      data: mockPhotoUrls,
      count: mockPhotoUrls.length,
      cacheHit: true,
    });

    // Verify no API calls were made
    expect(fetchPhotoMetadata).not.toHaveBeenCalled();
    expect(fetchPhoto).not.toHaveBeenCalled();

    // Verify cache was updated with database data
    expect(redis.set).toHaveBeenCalledWith(
      mockCacheKey,
      mockDbPhotos,
      expect.any(Object)
    );
  });

  it('should fetch photos from API when neither cache nor database has data', async () => {
    const result = await fetchPlacePhotos({ id: mockPlaceId });

    // Verify cache was checked
    expect(redis.get).toHaveBeenCalledWith(mockCacheKey);

    // Verify database was checked
    expect(prisma.photo.findMany).toHaveBeenCalledWith({
      where: { placeId: mockPlaceId },
    });

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

    // Verify Inngest event was sent
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create-photos',
      data: {
        id: mockPlaceId,
        photos: mockPhotoUrls.map((url) => url.toString()),
      },
    });
  });

  it('should bypass cache but still check database when bypassCache is true', async () => {
    // Mock database hit
    (
      prisma.photo.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockDbPhotos);

    const result = await fetchPlacePhotos({
      id: mockPlaceId,
      bypassCache: true,
    });

    // Verify cache was not checked
    expect(redis.get).not.toHaveBeenCalled();

    // Verify database was still checked
    expect(prisma.photo.findMany).toHaveBeenCalledWith({
      where: { placeId: mockPlaceId },
    });

    // Verify result contains database data
    expect(result).toEqual({
      data: mockPhotoUrls,
      count: mockPhotoUrls.length,
      cacheHit: true,
    });

    // Verify no API calls were made
    expect(fetchPhotoMetadata).not.toHaveBeenCalled();
    expect(fetchPhoto).not.toHaveBeenCalled();

    // Verify cache was updated with database data
    expect(redis.set).toHaveBeenCalledWith(
      mockCacheKey,
      mockDbPhotos,
      expect.any(Object)
    );
  });

  it('should respect the limit parameter', async () => {
    const limit = 2;
    const result = await fetchPlacePhotos({ id: mockPlaceId, limit });

    // Verify only the specified number of photos were fetched
    expect(fetchPhoto).toHaveBeenCalledTimes(limit);

    // Verify result contains limited data
    expect(result.data.length).toBe(limit);
    expect(result.count).toBe(limit);

    // Verify Inngest event was sent with limited photos
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create-photos',
      data: {
        id: mockPlaceId,
        photos: mockPhotoUrls.slice(0, limit).map((url) => url.toString()),
      },
    });
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

    // Verify Inngest event was sent with successful photos only
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create-photos',
      data: {
        id: mockPlaceId,
        photos: [mockPhotoUrls[0], mockPhotoUrls[2]].map((url) =>
          url.toString()
        ),
      },
    });
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

    // Verify Inngest event was sent with empty photos array
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create-photos',
      data: {
        id: mockPlaceId,
        photos: [],
      },
    });
  });
});
