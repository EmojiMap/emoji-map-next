import { describe, expect, test } from 'vitest';
import { SEARCH_CONFIG } from '@/constants/search';
import { generateCacheKey, extractLocationFromCacheKey } from './cache-utils';

describe('generateCacheKey', () => {
  test('generates consistent key with all parameters', () => {
    const params = {
      location: { latitude: 47.6162, longitude: -122.3321 },
      keys: [3, 1, 2],
      openNow: true,
      priceLevels: [2, 1],
      radius: 5000,
      minimumRating: 4.5,
      maxResultCount: 20,
    };

    const expected = [
      SEARCH_CONFIG.CACHE_KEY,
      '47.62',
      '-122.33',
      '5000',
      '1,2,3',
      'true',
      '1,2',
      '4.5',
      '20',
      SEARCH_CONFIG.CACHE_KEY_VERSION,
    ].join(':');

    expect(generateCacheKey(params)).toBe(expected);
  });

  test('generates consistent key with minimal parameters', () => {
    const params = {
      location: { latitude: 47.6162, longitude: -122.3321 },
    };

    const expected = [
      SEARCH_CONFIG.CACHE_KEY,
      '47.62',
      '-122.33',
      SEARCH_CONFIG.DEFAULT_RADIUS_METERS,
      'all',
      'false',
      'any',
      'any',
      SEARCH_CONFIG.DEFAULT_RECORD_COUNT,
      SEARCH_CONFIG.CACHE_KEY_VERSION,
    ].join(':');

    expect(generateCacheKey(params)).toBe(expected);
  });

  test('sorts arrays consistently regardless of input order', () => {
    const params1 = {
      location: { latitude: 47.6162, longitude: -122.3321 },
      keys: [3, 1, 2],
      priceLevels: [2, 1],
    };

    const params2 = {
      location: { latitude: 47.6162, longitude: -122.3321 },
      keys: [1, 2, 3],
      priceLevels: [1, 2],
    };

    expect(generateCacheKey(params1)).toBe(generateCacheKey(params2));
  });

  test('rounds coordinates to configured decimal places', () => {
    const params = {
      location: { latitude: 47.61629876, longitude: -122.33219876 },
    };

    const key = generateCacheKey(params);
    const coords = extractLocationFromCacheKey(key);

    expect(coords).toEqual({
      latitude: 47.62,
      longitude: -122.33,
    });
  });
});

describe('extractLocationFromCacheKey', () => {
  test('extracts location from valid cache key', () => {
    const key = `${SEARCH_CONFIG.CACHE_KEY}:47.62:-122.33:5000:all:false:any:any:20:v1`;

    expect(extractLocationFromCacheKey(key)).toEqual({
      latitude: 47.62,
      longitude: -122.33,
    });
  });

  test('returns null for invalid cache key', () => {
    const invalidKey = 'invalid:key';
    expect(extractLocationFromCacheKey(invalidKey)).toBeNull();
  });

  test('returns null for non-numeric coordinates', () => {
    const invalidKey = `${SEARCH_CONFIG.CACHE_KEY}:invalid:-122.33:5000:all:false:any:any:20:v1`;
    expect(extractLocationFromCacheKey(invalidKey)).toBeNull();
  });
});
