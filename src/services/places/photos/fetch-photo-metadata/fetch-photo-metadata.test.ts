import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env } from '@/env';
import { fetchPhotoMetadata } from './fetch-photo-metadata';

describe('fetchPhotoMetadata', () => {
  // Mock global fetch
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch photo metadata successfully', async () => {
    // GIVEN a valid place ID and a successful API response
    const placeId = 'test-place-id';
    const mockPhotos = [
      { name: 'places/test-place-id/photos/photo1' },
      { name: 'places/test-place-id/photos/photo2' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ photos: mockPhotos }),
    });

    // WHEN fetching photo metadata
    const result = await fetchPhotoMetadata(placeId);

    // THEN it should return the photo names
    expect(result).toEqual([
      'places/test-place-id/photos/photo1',
      'places/test-place-id/photos/photo2',
    ]);

    // AND it should call fetch with the correct URL
    const expectedUrl = `${env.GOOGLE_PLACES_URL}/places/${placeId}?fields=photos&key=${env.GOOGLE_PLACES_API_KEY}`;
    expect(mockFetch).toHaveBeenCalledWith(
      expectedUrl,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      })
    );
  });

  it('should throw an error when no photos are found', async () => {
    // GIVEN a valid place ID but no photos in the response
    const placeId = 'test-place-id';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ photos: [] }),
    });

    // WHEN fetching photo metadata
    // THEN it should throw an error
    await expect(fetchPhotoMetadata(placeId)).rejects.toThrow(
      'No photos found'
    );
  });

  it('should throw an error when photos property is missing', async () => {
    // GIVEN a valid place ID but missing photos property in the response
    const placeId = 'test-place-id';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    // WHEN fetching photo metadata
    // THEN it should throw an error
    await expect(fetchPhotoMetadata(placeId)).rejects.toThrow(
      'No photos found'
    );
  });

  it('should throw an error when API returns non-OK response', async () => {
    // GIVEN a valid place ID but API returns an error
    const placeId = 'test-place-id';

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // WHEN fetching photo metadata
    // THEN it should throw an error
    await expect(fetchPhotoMetadata(placeId)).rejects.toThrow(
      'API error: 404 Not Found'
    );
  });

  it('should throw an error when fetch fails', async () => {
    // GIVEN a valid place ID but fetch throws an error
    const placeId = 'test-place-id';
    const networkError = new Error('Network error');

    mockFetch.mockRejectedValueOnce(networkError);

    // WHEN fetching photo metadata
    // THEN it should throw the same error
    await expect(fetchPhotoMetadata(placeId)).rejects.toThrow(networkError);
  });

  it('should throw an error when place ID is empty', async () => {
    // GIVEN an empty place ID
    const placeId = '';

    // WHEN fetching photo metadata
    // THEN it should throw an error
    await expect(fetchPhotoMetadata(placeId)).rejects.toThrow(
      'Place ID is required'
    );
  });
});
