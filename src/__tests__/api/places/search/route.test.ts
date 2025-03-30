import { v1 } from '@googlemaps/places';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/places/search/route';
import { CATEGORY_MAP_LOOKUP } from '@/constants/category-map';
import type { GooglePlace } from '@/types/google-places';
import { log } from '@/utils/log';
import { retrieveOrCache } from '@/utils/redis/cache-utils';

// Mock dependencies
vi.mock('@googlemaps/places', () => ({
  v1: {
    PlacesClient: vi.fn().mockImplementation(() => ({
      searchNearby: vi.fn().mockResolvedValue([
        {
          places: [
            {
              id: 'place-id-1',
              displayName: { text: 'Test Place 1', languageCode: 'en' },
              location: { latitude: 37.775, longitude: -122.419 },
              types: ['restaurant', 'food'],
              currentOpeningHours: {
                openNow: true,
                periods: [],
                weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
              },
              rating: 4.5,
              priceLevel: 'PRICE_LEVEL_MODERATE',
            },
            {
              id: 'place-id-2',
              displayName: { text: 'Test Place 2', languageCode: 'en' },
              location: { latitude: 37.776, longitude: -122.418 },
              types: ['cafe', 'food'],
              currentOpeningHours: {
                openNow: false,
                periods: [],
                weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
              },
              rating: 3.5,
              priceLevel: 'PRICE_LEVEL_EXPENSIVE',
            },
          ],
        },
      ]),
    })),
  },
}));

vi.mock('@/utils/redis/cache-utils', () => ({
  retrieveOrCache: vi.fn().mockImplementation(async (_, fn) => {
    const result = await fn();
    return result;
  }),
}));

vi.mock('@/env', () => ({
  env: {
    GOOGLE_PLACES_API_KEY: 'test-api-key',
  },
}));

vi.mock('@/utils/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@/constants/category-map', () => ({
  CATEGORY_MAP: [
    {
      primaryType: ['restaurant', 'food'],
      emoji: '🍽️',
    },
    {
      primaryType: ['cafe', 'food'],
      emoji: '☕',
    },
  ],
  EMOJI_OVERRIDES: {},
  CATEGORY_MAP_LOOKUP: {
    1: {
      primaryType: ['restaurant', 'food'],
      emoji: '🍽️',
    },
    2: {
      primaryType: ['cafe', 'food'],
      emoji: '☕',
    },
  },
}));

vi.mock('@/utils/emoji/get-emoji-for-types', () => ({
  getEmojiForTypes: vi.fn((name: string, types: string[]) => {
    if (types.includes('restaurant')) return '🍽️';
    if (types.includes('cafe')) return '☕';
    return '😶‍🌫️';
  }),
}));

// Sample data
const sampleLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const samplePlaceResponse = {
  places: [
    {
      id: 'place-id-1',
      displayName: { text: 'Test Place 1', languageCode: 'en' },
      location: { latitude: 37.775, longitude: -122.419 },
      types: ['restaurant', 'food'],
      currentOpeningHours: {
        openNow: true,
        periods: [],
        weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
      },
      rating: 4.5,
      priceLevel: 'PRICE_LEVEL_MODERATE',
    },
    {
      id: 'place-id-2',
      displayName: { text: 'Test Place 2', languageCode: 'en' },
      location: { latitude: 37.776, longitude: -122.418 },
      types: ['cafe', 'food'],
      currentOpeningHours: {
        openNow: false,
        periods: [],
        weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
      },
      rating: 3.5,
      priceLevel: 'PRICE_LEVEL_EXPENSIVE',
    },
  ],
};

const transformedResponse = {
  results: [
    {
      id: 'place-id-1',
      location: { latitude: 37.775, longitude: -122.419 },
      emoji: '🍽️',
    },
    {
      id: 'place-id-2',
      location: { latitude: 37.776, longitude: -122.418 },
      emoji: '☕',
    },
  ],
  count: 2,
  cacheHit: false,
};

describe('Places Search API', () => {
  let mockSearchNearby: ReturnType<typeof vi.fn>;
  let mockPlacesClient: { searchNearby: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchNearby = vi.fn().mockResolvedValue([samplePlaceResponse]);
    mockPlacesClient = {
      searchNearby: mockSearchNearby,
    };
    (v1.PlacesClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mockPlacesClient
    );
    (retrieveOrCache as ReturnType<typeof vi.fn>).mockImplementation(
      async (_, fn) => {
        const result = await fn();
        return result;
      }
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('validates request parameters', async () => {
    const invalidRequest = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(invalidRequest);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('issues');
  });

  test('handles successful search with default parameters', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({ location: sampleLocation }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(transformedResponse);

    expect(mockSearchNearby).toHaveBeenCalledWith(
      expect.objectContaining({
        locationRestriction: expect.objectContaining({
          circle: expect.objectContaining({
            center: sampleLocation,
          }),
        }),
      }),
      expect.any(Object)
    );
  });

  test('filters by openNow when specified', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        openNow: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('place-id-1');
  });

  test('filters by minimumRating when specified', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        minimumRating: 4.0,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('place-id-1');
  });

  test('filters by priceLevels when specified', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        priceLevels: [2], // PRICE_LEVEL_MODERATE
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('place-id-1');
  });

  test('combines multiple filters correctly', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        openNow: true,
        minimumRating: 4.0,
        priceLevels: [2],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('place-id-1');
  });

  test('uses cache when available', async () => {
    const cachedPlaces: Partial<GooglePlace>[] = [
      {
        id: 'cached-id-1',
        displayName: { text: 'Cached Place 1', languageCode: 'en' },
        location: { latitude: 37.775, longitude: -122.419 },
        types: ['restaurant'],
        currentOpeningHours: {
          openNow: true,
          periods: [],
          weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
        },
        rating: 4.5,
        priceLevel: 'PRICE_LEVEL_MODERATE',
      },
    ];

    (retrieveOrCache as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      places: cachedPlaces,
      cacheHit: true,
    });

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(retrieveOrCache).toHaveBeenCalled();
    expect(data).toEqual({
      results: [
        {
          id: 'cached-id-1',
          location: { latitude: 37.775, longitude: -122.419 },
          emoji: '🍽️', // Since we're passing key: [1] which maps to restaurant emoji
        },
      ],
      count: 1,
      cacheHit: true,
    });
  });

  test('bypasses cache when bypassCache is true', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        bypassCache: true,
      }),
    });

    await POST(request);

    expect(retrieveOrCache).not.toHaveBeenCalled();
    expect(mockSearchNearby).toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    mockSearchNearby.mockRejectedValueOnce(new Error('API Error'));

    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({ location: sampleLocation }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(log.error).toHaveBeenCalled();
    expect(data).toEqual({
      results: [],
      count: 0,
      cacheHit: false,
    });
  });

  test('includes correct fields in API request', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({ location: sampleLocation }),
    });

    await POST(request);

    expect(mockSearchNearby).toHaveBeenCalledWith(
      expect.objectContaining({
        locationRestriction: expect.objectContaining({
          circle: expect.objectContaining({
            center: sampleLocation,
          }),
        }),
      }),
      expect.objectContaining({
        otherArgs: expect.objectContaining({
          headers: expect.objectContaining({
            'X-Goog-FieldMask': expect.stringContaining('places.id'),
          }),
        }),
      })
    );
  });

  test('transforms API response correctly', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({ location: sampleLocation }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          location: expect.objectContaining({
            latitude: expect.any(Number),
            longitude: expect.any(Number),
          }),
          emoji: expect.any(String),
        }),
      ])
    );
  });

  test('uses category types from provided keys', async () => {
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        keys: [1, 2], // Food and Cafe categories
      }),
    });

    await POST(request);

    const expectedTypes = [
      ...CATEGORY_MAP_LOOKUP[1].primaryType,
      ...CATEGORY_MAP_LOOKUP[2].primaryType,
    ];

    expect(mockSearchNearby).toHaveBeenCalledWith(
      expect.objectContaining({
        includedTypes: expect.arrayContaining(expectedTypes),
      }),
      expect.any(Object)
    );
  });

  test('respects maxResultCount parameter', async () => {
    const maxResultCount = 1;
    const request = new Request('http://localhost/api/places/search', {
      method: 'POST',
      body: JSON.stringify({
        location: sampleLocation,
        maxResultCount,
      }),
    });

    await POST(request);

    expect(mockSearchNearby).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResultCount,
      }),
      expect.any(Object)
    );
  });

  describe('emoji assignment', () => {
    test('uses category emoji directly when single key is provided', async () => {
      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
          keys: [1], // Restaurant category
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            emoji: '🍽️', // Should use the emoji directly from CATEGORY_MAP_LOOKUP
          }),
        ])
      );
    });

    test('uses getEmojiForTypes when multiple keys are provided', async () => {
      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
          keys: [1, 2], // Restaurant and Cafe categories
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should use getEmojiForTypes which will look at the place types
      expect(data.results[0].emoji).toBe('🍽️');
      expect(data.results[1].emoji).toBe('☕');
    });

    test('uses getEmojiForTypes when no keys are provided', async () => {
      const request = new Request('http://localhost/api/places/search', {
        method: 'POST',
        body: JSON.stringify({
          location: sampleLocation,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should use getEmojiForTypes which will look at the place types
      expect(data.results[0].emoji).toBe('🍽️');
      expect(data.results[1].emoji).toBe('☕');
    });
  });
});
