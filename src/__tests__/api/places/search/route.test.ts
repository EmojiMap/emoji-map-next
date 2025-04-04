import { NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/places/search/route';
import { redis } from '@/lib/redis';

// Mock dependencies
vi.mock('next/server', () => {
  const mockJson = vi.fn();

  return {
    NextResponse: {
      json: mockJson,
      __esModule: true,
    },
  };
});

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/env', () => ({
  env: {
    GOOGLE_PLACES_URL: 'https://places.googleapis.com/v1',
    GOOGLE_PLACES_API_KEY: 'test-api-key',
  },
}));

vi.mock('@/constants/category-map', () => ({
  CATEGORY_MAP: [
    {
      key: 1,
      name: 'Food',
      emoji: '🍽️',
      primaryType: ['restaurant', 'food'],
      keywords: ['restaurant', 'food'],
    },
    {
      key: 2,
      name: 'Cafe',
      emoji: '☕',
      primaryType: ['cafe'],
      keywords: ['cafe', 'coffee'],
    },
    {
      key: 3,
      name: 'Burger',
      emoji: '🍔',
      primaryType: ['burger_restaurant'],
      keywords: ['burger', 'hamburger'],
      examples: ["McDonald's", 'Burger King'],
    },
    {
      key: 6,
      name: 'Mexican',
      emoji: '🌮',
      primaryType: ['mexican_restaurant'],
      keywords: ['burrito', 'taco'],
      examples: ['Burrito Factory'],
    },
    {
      key: 8,
      name: 'Japanese',
      emoji: '🍱',
      primaryType: ['japanese_restaurant'],
      keywords: ['sushi'],
      examples: ['Sushi Express', 'sushi house'],
    },
  ],
}));

vi.mock('@/utils/log', () => ({
  log: {
    debug: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

// Sample data
const sampleLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const samplePlaceResponse = {
  places: [
    {
      name: 'Test Place 1',
      id: 'place-id-1',
      types: ['restaurant', 'food'],
      location: {
        latitude: 37.775,
        longitude: -122.419,
      },
      priceLevel: 'PRICE_LEVEL_MODERATE',
      currentOpeningHours: {
        openNow: true,
      },
    },
    {
      name: 'Test Place 2',
      id: 'place-id-2',
      types: ['cafe', 'food'],
      location: {
        latitude: 37.776,
        longitude: -122.418,
      },
      priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
      currentOpeningHours: {
        openNow: false,
      },
    },
  ],
};

describe('Places Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup NextResponse.json mock
    (NextResponse.json as ReturnType<typeof vi.fn>).mockImplementation(
      (data) => {
        return { data };
      }
    );

    // Setup fetch mock to return sample data
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => samplePlaceResponse,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should validate request parameters', async () => {
    // Mock NextResponse.json to return an error for invalid requests
    (NextResponse.json as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (data, options) => {
        return { data, status: options?.status || 200 };
      }
    );

    // Missing required location parameter
    const invalidRequest = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const invalidResponse = (await POST(invalidRequest)) as unknown as {
      data: { error: string };
      status: number;
    };
    expect(invalidResponse.data.error).toBe('Failed to process request');
    expect(invalidResponse.status).toBe(500);

    // Valid request
    const validRequest = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({ location: sampleLocation }),
    });

    await POST(validRequest);
    expect(NextResponse.json).toHaveBeenCalled();
  });

  it('should validate price levels', async () => {
    // Mock NextResponse.json to return an error for invalid requests
    (NextResponse.json as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (data, options) => {
        return { data, status: options?.status || 200 };
      }
    );

    // Invalid price level (outside 1-4 range)
    const invalidRequest = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        priceLevels: [0, 5],
      }),
    });

    const invalidResponse = (await POST(invalidRequest)) as unknown as {
      data: { error: string };
      status: number;
    };
    expect(invalidResponse.data.error).toBe('Failed to process request');
    expect(invalidResponse.status).toBe(500);

    // Valid price levels
    const validRequest = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        priceLevels: [1, 2],
      }),
    });

    await POST(validRequest);
    expect(NextResponse.json).toHaveBeenCalled();
  });

  it('should check cache before making API requests', async () => {
    // Mock cache hit
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      samplePlaceResponse.places
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1], // Single key for simplicity
      }),
    });

    await POST(request);

    // Should check cache
    expect(redis.get).toHaveBeenCalled();
    // Should not make API request when cache hit
    expect(global.fetch).not.toHaveBeenCalled();
    // Response should indicate cache hit
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: true,
      count: expect.any(Number),
      results: expect.arrayContaining([
        expect.objectContaining({
          id: 'place-id-1',
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ]),
    });
  });

  it('should bypass cache when priceLevels is provided', async () => {
    // Clear previous mocks
    vi.clearAllMocks();

    // Mock fetch to return sample data
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => samplePlaceResponse,
    });

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        priceLevels: [2], // Only PRICE_LEVEL_MODERATE (2)
      }),
    });

    await POST(request);

    // Verify API request was made (since cache is bypassed)
    expect(global.fetch).toHaveBeenCalled();

    // Verify response indicates cache miss and only includes places with matching price level
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1, // Only one place matches price level 2
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the moderate price level place
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });
  });

  it('should not bypass cache when priceLevels contains all values [1,2,3,4]', async () => {
    // Mock cache hit
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      samplePlaceResponse.places
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        priceLevels: [1, 2, 3, 4], // All price levels
      }),
    });

    await POST(request);

    // Should check cache
    expect(redis.get).toHaveBeenCalled();
    // Should not make API request when cache hit
    expect(global.fetch).not.toHaveBeenCalled();
    // Response should indicate cache hit
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: true,
      count: expect.any(Number),
      results: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ]),
    });
  });

  it('should filter results by price level', async () => {
    // Mock API response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => samplePlaceResponse,
    });

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        priceLevels: [2], // Only PRICE_LEVEL_MODERATE (2)
      }),
    });

    await POST(request);

    // Should only include places with matching price level
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1,
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the moderate price level place
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });
  });

  it('should filter results by openNow', async () => {
    // Mock API response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => samplePlaceResponse,
    });

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        openNow: true,
      }),
    });

    await POST(request);

    // Should only include places that are open now
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1,
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the open place
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('API Error')
    );

    // Mock empty response for this test
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ places: [] }),
    });

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
      }),
    });

    await POST(request);

    // Should return empty results on error
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 0,
      results: [],
    });
  });

  it('should handle streaming mode', async () => {
    // Mock TransformStream
    const mockWriter = {
      write: vi.fn(),
      close: vi.fn(),
    };

    // Mock TransformStream constructor
    const mockTransformStream = {
      readable: 'mock-readable-stream',
      writable: { getWriter: () => mockWriter },
    };

    // @ts-expect-error - Mocking global TransformStream
    global.TransformStream = vi.fn(() => mockTransformStream);

    // Mock NextResponse constructor for streaming response
    const mockNextResponseFn = vi.fn().mockReturnValue('streaming-response');

    // Save original NextResponse
    const originalNextResponse = NextResponse;

    // Replace NextResponse temporarily
    // @ts-expect-error - Temporarily replacing NextResponse
    NextResponse = mockNextResponseFn;

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        stream: true,
      }),
    });

    await POST(request);

    // Should return a streaming response
    expect(mockNextResponseFn).toHaveBeenCalledWith(
      'mock-readable-stream',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
        }),
      })
    );

    // Restore NextResponse
    // @ts-expect-error - Restoring NextResponse
    NextResponse = originalNextResponse;
  });

  it('should use default keys when none are provided', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
      }),
    });

    await POST(request);

    // Should use all category keys as default
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"includedPrimaryTypes"'),
      })
    );
  });

  it('should group similar categories when multiple keys are provided', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1, 2],
      }),
    });

    await POST(request);

    // Should make API requests with grouped keys
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should limit results based on maxResultCount parameter', async () => {
    // Mock API response with multiple places
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Test Place 1',
              id: 'place-id-1',
              types: ['restaurant'],
              location: { latitude: 37.775, longitude: -122.419 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
            },
            {
              name: 'Test Place 2',
              id: 'place-id-2',
              types: ['restaurant'],
              location: { latitude: 37.776, longitude: -122.418 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
            },
            {
              name: 'Test Place 3',
              id: 'place-id-3',
              types: ['restaurant'],
              location: { latitude: 37.777, longitude: -122.417 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
            },
          ],
        }),
      }
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        maxResultCount: 2, // Limit to 2 results
      }),
    });

    await POST(request);

    // Should limit results to maxResultCount (2)
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 2,
        results: expect.arrayContaining([
          expect.objectContaining({ id: 'place-id-1' }),
          expect.objectContaining({ id: 'place-id-2' }),
        ]),
      })
    );

    // Should not include the third place
    const jsonCall = (NextResponse.json as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(jsonCall.results.length).toBe(2);
    expect(
      jsonCall.results.some(
        (place: { id: string }) => place.id === 'place-id-3'
      )
    ).toBe(false);
  });

  it('should pass maxResultCount to Google Places API', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        maxResultCount: 10,
      }),
    });

    await POST(request);

    // Should include maxResultCount in the API request
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"maxResultCount":10'),
      })
    );
  });

  it('should limit cached results based on maxResultCount', async () => {
    // Mock cache hit with multiple places
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        name: 'Cached Place 1',
        id: 'cached-id-1',
        types: ['restaurant'],
        location: { latitude: 37.775, longitude: -122.419 },
        priceLevel: 'PRICE_LEVEL_MODERATE',
        currentOpeningHours: { openNow: true },
      },
      {
        name: 'Cached Place 2',
        id: 'cached-id-2',
        types: ['restaurant'],
        location: { latitude: 37.776, longitude: -122.418 },
        priceLevel: 'PRICE_LEVEL_MODERATE',
        currentOpeningHours: { openNow: true },
      },
      {
        name: 'Cached Place 3',
        id: 'cached-id-3',
        types: ['restaurant'],
        location: { latitude: 37.777, longitude: -122.417 },
        priceLevel: 'PRICE_LEVEL_MODERATE',
        currentOpeningHours: { openNow: true },
      },
    ]);

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        maxResultCount: 2, // Limit to 2 results
      }),
    });

    await POST(request);

    // Should check cache
    expect(redis.get).toHaveBeenCalled();
    // Should not make API request when cache hit
    expect(global.fetch).not.toHaveBeenCalled();

    // Should limit cached results to maxResultCount (2)
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: true,
      count: 2,
      results: expect.arrayContaining([
        expect.objectContaining({ id: 'cached-id-1' }),
        expect.objectContaining({ id: 'cached-id-2' }),
      ]),
    });

    // Should not include the third cached place
    const jsonCall = (NextResponse.json as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(jsonCall.results.length).toBe(2);
    expect(
      jsonCall.results.some(
        (place: { id: string }) => place.id === 'cached-id-3'
      )
    ).toBe(false);
  });

  it('should accept minimumRating parameter', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        minimumRating: 4.5,
      }),
    });

    const response = await POST(request);

    expect(response).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          results: [],
          count: 0,
          cacheHit: false,
        }),
      })
    );
  });

  // New tests to prevent regression of the maxResultCount bug
  it('should request more results from Google when filtering by price level', async () => {
    // Mock API response with multiple places
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Test Place 1',
              id: 'place-id-1',
              types: ['restaurant'],
              location: { latitude: 37.775, longitude: -122.419 },
              priceLevel: 'PRICE_LEVEL_EXPENSIVE',
              currentOpeningHours: { openNow: true },
            },
            {
              name: 'Test Place 2',
              id: 'place-id-2',
              types: ['restaurant'],
              location: { latitude: 37.776, longitude: -122.418 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
            },
            {
              name: 'Test Place 3',
              id: 'place-id-3',
              types: ['restaurant'],
              location: { latitude: 37.777, longitude: -122.417 },
              priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
              currentOpeningHours: { openNow: true },
            },
          ],
        }),
      }
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        priceLevels: [3], // Only PRICE_LEVEL_EXPENSIVE (3)
        maxResultCount: 1, // Limit to 1 result
      }),
    });

    await POST(request);

    // Should request maximum results from Google (20) when filtering
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"maxResultCount":20'),
      })
    );

    // Should only include places with matching price level and respect maxResultCount
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1,
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the expensive place
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });
  });

  it('should request more results from Google when filtering by openNow', async () => {
    // Mock API response with multiple places
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Test Place 1',
              id: 'place-id-1',
              types: ['restaurant'],
              location: { latitude: 37.775, longitude: -122.419 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
            },
            {
              name: 'Test Place 2',
              id: 'place-id-2',
              types: ['restaurant'],
              location: { latitude: 37.776, longitude: -122.418 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: false },
            },
            {
              name: 'Test Place 3',
              id: 'place-id-3',
              types: ['restaurant'],
              location: { latitude: 37.777, longitude: -122.417 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
            },
          ],
        }),
      }
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        openNow: true,
        maxResultCount: 1, // Limit to 1 result
      }),
    });

    await POST(request);

    // Should request maximum results from Google (20) when filtering
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"maxResultCount":20'),
      })
    );

    // Should only include places that are open and respect maxResultCount
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1,
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the first open place
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });
  });

  it('should request more results from Google when filtering by minimumRating', async () => {
    // Mock API response with multiple places with ratings
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Test Place 1',
              id: 'place-id-1',
              types: ['restaurant'],
              location: { latitude: 37.775, longitude: -122.419 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
              rating: 4.8,
            },
            {
              name: 'Test Place 2',
              id: 'place-id-2',
              types: ['restaurant'],
              location: { latitude: 37.776, longitude: -122.418 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
              rating: 3.5,
            },
            {
              name: 'Test Place 3',
              id: 'place-id-3',
              types: ['restaurant'],
              location: { latitude: 37.777, longitude: -122.417 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
              rating: 4.6,
            },
          ],
        }),
      }
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        minimumRating: 4.5,
        maxResultCount: 1, // Limit to 1 result
      }),
    });

    await POST(request);

    // Should request maximum results from Google (20) when filtering
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"maxResultCount":20'),
      })
    );

    // Should only include places with rating >= 4.5 and respect maxResultCount
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1,
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the first place with high rating
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });
  });

  it('should apply multiple filters correctly with maxResultCount', async () => {
    // Mock API response with multiple places with various attributes
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      {
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Test Place 1',
              id: 'place-id-1',
              types: ['restaurant'],
              location: { latitude: 37.775, longitude: -122.419 },
              priceLevel: 'PRICE_LEVEL_EXPENSIVE',
              currentOpeningHours: { openNow: true },
              rating: 4.8,
            },
            {
              name: 'Test Place 2',
              id: 'place-id-2',
              types: ['restaurant'],
              location: { latitude: 37.776, longitude: -122.418 },
              priceLevel: 'PRICE_LEVEL_EXPENSIVE',
              currentOpeningHours: { openNow: false },
              rating: 4.9,
            },
            {
              name: 'Test Place 3',
              id: 'place-id-3',
              types: ['restaurant'],
              location: { latitude: 37.777, longitude: -122.417 },
              priceLevel: 'PRICE_LEVEL_MODERATE',
              currentOpeningHours: { openNow: true },
              rating: 4.7,
            },
            {
              name: 'Test Place 4',
              id: 'place-id-4',
              types: ['restaurant'],
              location: { latitude: 37.778, longitude: -122.416 },
              priceLevel: 'PRICE_LEVEL_EXPENSIVE',
              currentOpeningHours: { openNow: true },
              rating: 4.6,
            },
          ],
        }),
      }
    );

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
        priceLevels: [3], // Only PRICE_LEVEL_EXPENSIVE (3)
        openNow: true,
        minimumRating: 4.5,
        maxResultCount: 1, // Limit to 1 result
      }),
    });

    await POST(request);

    // Should request maximum results from Google (20) when filtering
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"maxResultCount":20'),
      })
    );

    // Should only include places that match all filters and respect maxResultCount
    expect(NextResponse.json).toHaveBeenCalledWith({
      cacheHit: false,
      count: 1,
      results: [
        expect.objectContaining({
          id: 'place-id-1', // Only the first place matching all criteria
          emoji: expect.any(String),
          location: expect.any(Object),
        }),
      ],
    });

    // Verify that only one result is returned even though two places match all filters
    const jsonCall = (NextResponse.json as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(jsonCall.results.length).toBe(1);
    expect(
      jsonCall.results.some(
        (place: { id: string }) => place.id === 'place-id-4'
      )
    ).toBe(false);
  });

  // Add new test cases for emoji matching logic
  describe('Emoji Matching Logic', () => {
    it('should match exact example names with correct emoji', async () => {
      // Mock fetch to return McDonald's data
      (
        global.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              name: "McDonald's",
              id: 'place-id-1',
              types: ['restaurant', 'burger_restaurant', 'food'],
              location: {
                latitude: 37.775,
                longitude: -122.419,
              },
              displayName: {
                text: "McDonald's",
              },
            },
          ],
        }),
      });

      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
        }),
      });

      await POST(request);

      // Should match McDonald's with burger emoji
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({
              emoji: '🍔',
              id: 'place-id-1',
            }),
          ],
        })
      );
    });

    it('should match based on exact word matches from keywords', async () => {
      // Mock fetch to return Burrito Factory data
      (
        global.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Burrito Factory',
              id: 'place-id-1',
              types: ['restaurant', 'mexican_restaurant', 'food'],
              location: {
                latitude: 37.775,
                longitude: -122.419,
              },
              displayName: {
                text: 'Burrito Factory',
              },
            },
          ],
        }),
      });

      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
        }),
      });

      await POST(request);

      // Should match Burrito Factory with taco emoji due to "burrito" keyword
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({
              emoji: '🌮',
              id: 'place-id-1',
            }),
          ],
        })
      );
    });

    it('should handle case-insensitive matching', async () => {
      // Mock fetch to return sushi places data
      (
        global.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'SUSHI EXPRESS',
              id: 'place-id-1',
              types: ['restaurant', 'japanese_restaurant', 'food'],
              location: {
                latitude: 37.775,
                longitude: -122.419,
              },
              displayName: {
                text: 'SUSHI EXPRESS',
              },
            },
            {
              name: 'sushi house',
              id: 'place-id-2',
              types: ['restaurant', 'japanese_restaurant', 'food'],
              location: {
                latitude: 37.776,
                longitude: -122.418,
              },
              displayName: {
                text: 'sushi house',
              },
            },
          ],
        }),
      });

      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
        }),
      });

      await POST(request);

      // Both should match with sushi emoji regardless of case
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              emoji: '🍱',
              id: 'place-id-1',
            }),
            expect.objectContaining({
              emoji: '🍱',
              id: 'place-id-2',
            }),
          ]),
        })
      );
    });

    it('should match based on primary types when no name match', async () => {
      // Mock fetch to return cafe data
      (
        global.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Local Eatery',
              id: 'place-id-1',
              types: ['cafe', 'food'],
              location: {
                latitude: 37.775,
                longitude: -122.419,
              },
              displayName: {
                text: 'Local Eatery',
              },
            },
          ],
        }),
      });

      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
          keys: [2], // Cafe category
        }),
      });

      await POST(request);

      // Should match with cafe emoji based on primary type
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({
              emoji: '☕',
              id: 'place-id-1',
            }),
          ],
        })
      );
    });

    it('should use default emoji when no matches found', async () => {
      // Mock fetch to return generic place data
      (
        global.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              name: 'Generic Place',
              id: 'place-id-1',
              types: ['point_of_interest'],
              location: {
                latitude: 37.775,
                longitude: -122.419,
              },
              displayName: {
                text: 'Generic Place',
              },
            },
          ],
        }),
      });

      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
        }),
      });

      await POST(request);

      // Should use default emoji when no matches
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({
              emoji: '🍽️',
              id: 'place-id-1',
            }),
          ],
        })
      );
    });
  });
});
