import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/places/details/route';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import type { PlaceWithReviews } from '@/types/details';
import type { Place, Review } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    place: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    review: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/services/places/details/fetch-details/fetch-details', () => ({
  fetchDetails: vi.fn(),
}));

describe('Details API Route', () => {
  const mockCreatedAt = '2024-01-01T00:00:00.000Z';
  const mockUpdatedAt = '2024-01-01T00:00:00.000Z';

  const mockPlace: Place & { reviews: Review[] } = {
    id: 'test_place_123',
    name: 'Test Place',
    latitude: 37.7749,
    longitude: -122.4194,
    googleRating: 4.5,
    userRatingCount: 100,
    priceLevel: 2,
    address: '123 Test St',
    primaryTypeDisplayName: 'Restaurant',
    editorialSummary: 'A test place',
    generativeSummary: 'A generated summary',
    isFree: false,
    openNow: true,
    merchantId: null,
    dineIn: true,
    takeout: true,
    delivery: false,
    servesCoffee: true,
    servesDessert: true,
    outdoorSeating: true,
    liveMusic: false,
    acceptsCreditCards: true,
    acceptsDebitCards: true,
    acceptsCashOnly: false,
    goodForChildren: true,
    goodForGroups: true,
    menuForChildren: false,
    restroom: true,
    allowsDogs: false,
    // @ts-expect-error - mockCreatedAt is a string
    createdAt: mockCreatedAt,
    // @ts-expect-error - mockUpdatedAt is a string
    updatedAt: mockUpdatedAt,
    reviews: [
      {
        id: 'review_1',
        placeId: 'test_place_123',
        rating: 5,
        text: 'Great place!',
        relativePublishTimeDescription: '2 days ago',
        status: 'DEFAULT',
        // @ts-expect-error - mockCreatedAt is a string
        createdAt: mockCreatedAt,
        // @ts-expect-error - mockUpdatedAt is a string
        updatedAt: mockUpdatedAt,
      },
    ],
  };

  const mockGoogleDetails: PlaceWithReviews = {
    id: 'test_place_123',
    name: 'Test Place',
    latitude: 37.7749,
    longitude: -122.4194,
    googleRating: 4.5,
    userRatingCount: 100,
    priceLevel: 2,
    address: '123 Test St',
    primaryTypeDisplayName: 'Restaurant',
    editorialSummary: 'A test place',
    generativeSummary: 'A generated summary',
    isFree: false,
    openNow: true,
    merchantId: null,
    dineIn: true,
    takeout: true,
    delivery: false,
    servesCoffee: true,
    servesDessert: true,
    outdoorSeating: true,
    liveMusic: false,
    acceptsCreditCards: true,
    acceptsDebitCards: true,
    acceptsCashOnly: false,
    goodForChildren: true,
    goodForGroups: true,
    menuForChildren: false,
    restroom: true,
    allowsDogs: false,
    reviews: [
      {
        id: 'review_1',
        rating: 5,
        text: 'Great place!',
        relativePublishTimeDescription: '2 days ago',
        status: 'DEFAULT',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data if available', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/places/details?id=test_place_123'
    );
    vi.mocked(redis.get).mockResolvedValueOnce(mockPlace);

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: mockPlace,
      cacheHit: true,
      count: 1,
    });
  });

  it('should return data from database if not cached', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/places/details?id=test_place_123'
    );
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: mockPlace,
      cacheHit: false,
      count: 1,
    });
  });

  it('should fetch from Google Places API if not in database', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/places/details?id=test_place_123'
    );
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(prisma.place.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockPlace);
    vi.mocked(fetchDetails).mockResolvedValueOnce(mockGoogleDetails);
    vi.mocked(prisma.place.create).mockResolvedValueOnce(mockPlace);
    vi.mocked(prisma.review.createMany).mockResolvedValueOnce({ count: 1 });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: mockPlace,
      cacheHit: false,
      count: 1,
    });
  });

  it('should bypass cache when bypassCache=true', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/places/details?id=test_place_123&bypassCache=true'
    );
    vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: mockPlace,
      cacheHit: false,
      count: 1,
    });
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('should return 500 if place not found after creation', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/places/details?id=test_place_123'
    );
    vi.mocked(redis.get).mockResolvedValueOnce(null);
    vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(null);
    vi.mocked(fetchDetails).mockRejectedValueOnce(new Error('PLACE_NOT_FOUND'));

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
  });

  it('should return 500 if an error occurs', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/places/details?id=test_place_123'
    );
    vi.mocked(redis.get).mockRejectedValueOnce(new Error('Redis error'));

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
  });
});
