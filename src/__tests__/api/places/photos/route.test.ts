import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/places/photos/route';
import { fetchPlacePhotos } from '@/services/places/photos/fetch-place-photos/fetch-place-photos';

// Mock dependencies
vi.mock(
  '@/services/places/photos/fetch-place-photos/fetch-place-photos',
  () => ({
    fetchPlacePhotos: vi.fn(),
  })
);

vi.mock('@/utils/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Photos API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should call fetchPlacePhotos with the correct parameters', async () => {
    // GIVEN a request with id and limit parameters
    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/places/photos?id=test-place-id&limit=5'
      )
    );

    // AND fetchPlacePhotos returns a successful response
    const photoUrl = new URL('https://example.com/photo1.jpg');
    const mockPhotos = {
      data: [photoUrl],
      count: 1,
      cacheHit: false,
    };
    vi.mocked(fetchPlacePhotos).mockResolvedValueOnce(mockPhotos);

    // WHEN the GET handler is called
    const response = await GET(request);
    const responseData = await response.json();

    // THEN it should call fetchPlacePhotos with the correct parameters
    expect(fetchPlacePhotos).toHaveBeenCalledWith({
      id: 'test-place-id',
      limit: 5,
      bypassCache: false,
    });

    // AND it should return the photos (note: URL objects are serialized to strings)
    expect(responseData).toEqual({
      data: [photoUrl.href],
      count: 1,
      cacheHit: false,
    });
  });

  it('should pass bypassCache=true when parameter is present without value', async () => {
    // GIVEN a request with id, limit, and bypassCache parameters (without value)
    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/places/photos?id=test-place-id&limit=5&bypassCache'
      )
    );

    // AND fetchPlacePhotos returns a successful response
    const photoUrl = new URL('https://example.com/photo1.jpg');
    const mockPhotos = {
      data: [photoUrl],
      count: 1,
      cacheHit: false,
    };
    vi.mocked(fetchPlacePhotos).mockResolvedValueOnce(mockPhotos);

    // WHEN the GET handler is called
    await GET(request);

    // THEN it should call fetchPlacePhotos with bypassCache=true
    expect(fetchPlacePhotos).toHaveBeenCalledWith({
      id: 'test-place-id',
      limit: 5,
      bypassCache: true,
    });
  });

  it('should pass bypassCache=true when parameter is "true"', async () => {
    // GIVEN a request with id, limit, and bypassCache=true
    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/places/photos?id=test-place-id&limit=5&bypassCache=true'
      )
    );

    // AND fetchPlacePhotos returns a successful response
    const photoUrl = new URL('https://example.com/photo1.jpg');
    const mockPhotos = {
      data: [photoUrl],
      count: 1,
      cacheHit: false,
    };
    vi.mocked(fetchPlacePhotos).mockResolvedValueOnce(mockPhotos);

    // WHEN the GET handler is called
    await GET(request);

    // THEN it should call fetchPlacePhotos with bypassCache=true
    expect(fetchPlacePhotos).toHaveBeenCalledWith({
      id: 'test-place-id',
      limit: 5,
      bypassCache: true,
    });
  });

  it('should pass bypassCache=true when parameter is "TRUE" (case-insensitive)', async () => {
    // GIVEN a request with id, limit, and bypassCache=TRUE
    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/places/photos?id=test-place-id&limit=5&bypassCache=TRUE'
      )
    );

    // AND fetchPlacePhotos returns a successful response
    const photoUrl = new URL('https://example.com/photo1.jpg');
    const mockPhotos = {
      data: [photoUrl],
      count: 1,
      cacheHit: false,
    };
    vi.mocked(fetchPlacePhotos).mockResolvedValueOnce(mockPhotos);

    // WHEN the GET handler is called
    await GET(request);

    // THEN it should call fetchPlacePhotos with bypassCache=true
    expect(fetchPlacePhotos).toHaveBeenCalledWith({
      id: 'test-place-id',
      limit: 5,
      bypassCache: true,
    });
  });

  it('should pass bypassCache=false when parameter has value other than "true"', async () => {
    // GIVEN a request with id, limit, and bypassCache=false
    const request = new NextRequest(
      new URL(
        'http://localhost:3000/api/places/photos?id=test-place-id&limit=5&bypassCache=false'
      )
    );

    // AND fetchPlacePhotos returns a successful response
    const photoUrl = new URL('https://example.com/photo1.jpg');
    const mockPhotos = {
      data: [photoUrl],
      count: 1,
      cacheHit: false,
    };
    vi.mocked(fetchPlacePhotos).mockResolvedValueOnce(mockPhotos);

    // WHEN the GET handler is called
    await GET(request);

    // THEN it should call fetchPlacePhotos with bypassCache=false
    expect(fetchPlacePhotos).toHaveBeenCalledWith({
      id: 'test-place-id',
      limit: 5,
      bypassCache: false,
    });
  });

  it('should handle errors and return appropriate status codes', async () => {
    // GIVEN a request with missing id parameter
    const request = new NextRequest(
      new URL('http://localhost:3000/api/places/photos')
    );

    // AND fetchPlacePhotos throws an error
    const error = new Error('Missing required parameter: id');
    vi.mocked(fetchPlacePhotos).mockRejectedValueOnce(error);

    // WHEN the GET handler is called
    const response = await GET(request);
    const responseData = await response.json();

    // THEN it should return a 400 status code
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: 'Missing required parameter: id' });
  });

  it('should return 404 for "No photos found" errors', async () => {
    // GIVEN a request with valid parameters
    const request = new NextRequest(
      new URL('http://localhost:3000/api/places/photos?id=test-place-id')
    );

    // AND fetchPlacePhotos throws a "No photos found" error
    const error = new Error('No photos found for place: test-place-id');
    vi.mocked(fetchPlacePhotos).mockRejectedValueOnce(error);

    // WHEN the GET handler is called
    const response = await GET(request);

    // THEN it should return a 404 status code
    expect(response.status).toBe(404);
  });
});
