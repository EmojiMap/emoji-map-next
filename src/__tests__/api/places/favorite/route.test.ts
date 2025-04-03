import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/places/favorite/route';
import { prisma } from '@/lib/db';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { getUserId } from '@/services/user/get-user-id';
import type { DetailResponse } from '@/types/details';
import { log } from '@/utils/log';
import type { Favorite, Place, User } from '@prisma/client';

// Helper function to extract JSON from response
async function getResponseBody(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing response JSON:', error);
    return text;
  }
}

vi.mock('@/services/user/get-user-id', () => ({
  getUserId: vi.fn(),
}));

vi.mock(
  '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache',
  () => ({
    getPlaceDetailsWithCache: vi.fn(),
  })
);

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    place: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    favorite: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('@/utils/log', () => ({
  log: {
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Favorite API Routes', () => {
  // Fixed mock date for consistent testing
  const mockDate = new Date('2023-01-01T12:00:00Z');

  // Mock data
  const mockUserId = 'user123';
  const mockPlaceId = 'place123';
  const mockUser: User = {
    id: mockUserId,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPlace: Place = {
    id: mockPlaceId,
    name: 'Test Place',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Test St',
    merchantId: null,
    allowsDogs: false,
    delivery: true,
    editorialSummary: 'A great place to eat',
    generativeSummary: 'This is a generated summary',
    goodForChildren: true,
    dineIn: true,
    goodForGroups: true,
    isFree: false,
    liveMusic: false,
    menuForChildren: true,
    outdoorSeating: true,
    acceptsCashOnly: false,
    acceptsCreditCards: true,
    acceptsDebitCards: true,
    priceLevel: 2,
    primaryTypeDisplayName: 'Restaurant',
    googleRating: 4.5,
    servesCoffee: true,
    servesDessert: true,
    takeout: true,
    restroom: true,
    openNow: true,
    userRatingCount: 100,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockFavorite: Favorite = {
    id: 'favorite123',
    userId: mockUserId,
    placeId: mockPlaceId,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPlaceDetails: DetailResponse = {
    data: {
      id: mockPlaceId,
      name: 'Test Place',
      displayName: 'Test Place',
      latitude: 37.7749,
      longitude: -122.4194,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      address: '123 Test St',
      merchantId: null,
      allowsDogs: false,
      delivery: true,
      editorialSummary: 'A great place to eat',
      generativeSummary: 'This is a generated summary',
      goodForChildren: true,
      dineIn: true,
      goodForGroups: true,
      isFree: false,
      liveMusic: false,
      menuForChildren: true,
      outdoorSeating: true,
      paymentOptions: {
        acceptsCashOnly: false,
        acceptsCreditCards: true,
        acceptsDebitCards: true,
      },
      acceptsCashOnly: false,
      acceptsCreditCards: true,
      acceptsDebitCards: true,
      priceLevel: 2,
      primaryTypeDisplayName: 'Restaurant',
      rating: 4.5,
      googleRating: 4.5,
      servesCoffee: true,
      servesDessert: true,
      takeout: true,
      restroom: true,
      openNow: true,
      userRatingCount: 100,
      reviews: [
        {
          placeId: mockPlaceId,
          relativePublishTimeDescription: '1 month ago',
          rating: 5,
          text: 'Great place!',
          id: '',
          status: 'DEFAULT',
        },
      ],
    },
    cacheHit: true,
    count: 1,
  };

  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Reset mocks before each test
    vi.resetAllMocks();

    // Default getUserId mock to return a userId
    vi.mocked(getUserId).mockResolvedValue(mockUserId);
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Restore real timers
    vi.useRealTimers();
  });

  // Helper function to compare objects ignoring date formats
  function expectObjectsToMatch(
    actual: Record<string, unknown>,
    expected: Record<string, unknown>
  ): void {
    // Create a deep copy of the objects
    const actualCopy = JSON.parse(JSON.stringify(actual));
    const expectedCopy = JSON.parse(JSON.stringify(expected));

    expect(actualCopy).toEqual(expectedCopy);
  }

  describe('POST /api/places/favorite', () => {
    it('should handle case where user is not authenticated', async () => {
      // Mock getUserId to throw an unauthorized error
      vi.mocked(getUserId).mockRejectedValueOnce(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to process favorite' });
      expect(log.error).toHaveBeenCalled();
    });

    it('should return 400 if place ID is missing', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Place ID is required' });
    });

    it('should return 404 if user is not found', async () => {
      // Mock user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: 'User not found' });
    });

    it('should fetch place details, create place with reviews if it does not exist, and add it to favorites', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place not found initially, but found after creation
      vi.mocked(prisma.place.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockPlace);

      // Mock place details fetch
      vi.mocked(getPlaceDetailsWithCache).mockResolvedValueOnce(
        mockPlaceDetails
      );

      // Mock place creation
      vi.mocked(prisma.place.create).mockResolvedValueOnce(mockPlace);

      // Mock review creation
      vi.mocked(prisma.review.createMany).mockResolvedValueOnce({ count: 1 });

      // Mock no existing favorite
      vi.mocked(prisma.favorite.findUnique).mockResolvedValueOnce(null);

      // Mock favorite creation
      vi.mocked(prisma.favorite.create).mockResolvedValueOnce(mockFavorite);

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(getUserId).toHaveBeenCalledWith(request);
      expect(getPlaceDetailsWithCache).toHaveBeenCalledWith({
        id: mockPlaceId,
      });
      expect(prisma.place.create).toHaveBeenCalledWith({
        data: {
          id: mockPlaceDetails.data.id,
          name: mockPlaceDetails.data.displayName,
          latitude: mockPlaceDetails.data.location.latitude,
          longitude: mockPlaceDetails.data.location.longitude,
          address: mockPlaceDetails.data.address,
          merchantId: null,
          allowsDogs: mockPlaceDetails.data.allowsDogs,
          delivery: mockPlaceDetails.data.delivery,
          editorialSummary: mockPlaceDetails.data.editorialSummary,
          generativeSummary: mockPlaceDetails.data.generativeSummary,
          goodForChildren: mockPlaceDetails.data.goodForChildren,
          dineIn: mockPlaceDetails.data.dineIn,
          goodForGroups: mockPlaceDetails.data.goodForGroups,
          isFree: mockPlaceDetails.data.isFree,
          liveMusic: mockPlaceDetails.data.liveMusic,
          menuForChildren: mockPlaceDetails.data.menuForChildren,
          outdoorSeating: mockPlaceDetails.data.outdoorSeating,
          acceptsCashOnly: mockPlaceDetails.data.acceptsCashOnly,
          acceptsCreditCards: mockPlaceDetails.data.acceptsCreditCards,
          acceptsDebitCards: mockPlaceDetails.data.acceptsDebitCards,
          priceLevel: mockPlaceDetails.data.priceLevel,
          primaryTypeDisplayName: mockPlaceDetails.data.primaryTypeDisplayName,
          googleRating: mockPlaceDetails.data.rating,
          servesCoffee: mockPlaceDetails.data.servesCoffee,
          servesDessert: mockPlaceDetails.data.servesDessert,
          takeout: mockPlaceDetails.data.takeout,
          restroom: mockPlaceDetails.data.restroom,
          openNow: mockPlaceDetails.data.openNow,
          userRatingCount: mockPlaceDetails.data.userRatingCount,
        },
      });
      expect(prisma.review.createMany).toHaveBeenCalledWith({
        data: mockPlaceDetails.data.reviews.map((review) => ({
          ...review,
          placeId: mockPlaceId,
        })),
      });
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          placeId: mockPlaceId,
        },
      });
      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        message: 'Favorite added',
        favorite: mockFavorite,
        action: 'added',
      });
    });

    it('should use existing place and add it to favorites', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

      // Mock no existing favorite
      vi.mocked(prisma.favorite.findUnique).mockResolvedValueOnce(null);

      // Mock favorite creation
      vi.mocked(prisma.favorite.create).mockResolvedValueOnce(mockFavorite);

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(getUserId).toHaveBeenCalledWith(request);
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          placeId: mockPlaceId,
        },
      });
      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        message: 'Favorite added',
        favorite: mockFavorite,
        action: 'added',
      });
    });

    it('should remove favorite if it already exists', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

      // Mock existing favorite
      vi.mocked(prisma.favorite.findUnique).mockResolvedValueOnce(mockFavorite);

      // Mock favorite deletion
      vi.mocked(prisma.favorite.delete).mockResolvedValueOnce(mockFavorite);

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(getUserId).toHaveBeenCalledWith(request);
      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { id: mockFavorite.id },
      });
      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        message: 'Favorite removed',
        favorite: null,
        action: 'removed',
      });
    });

    it('should handle server errors', async () => {
      // Mock user found but then throw an error
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(log.error).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to process favorite' });
    });
  });

  describe('GET /api/places/favorite', () => {
    it('should handle case where user is not authenticated', async () => {
      // Mock getUserId to throw an unauthorized error
      vi.mocked(getUserId).mockRejectedValueOnce(new Error('Unauthorized'));

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to check favorite status' });
    });

    it('should return 400 if place ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/places/favorite');

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: 'Place ID is required in query params',
      });
    });

    it('should return 404 if user is not found', async () => {
      // Mock user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: 'User not found' });
    });

    it('should handle case where place does not exist', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place not found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: 'Place not found',
      });
    });

    it('should return isFavorite=false if place exists but is not favorited', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

      // Mock no favorite found
      vi.mocked(prisma.favorite.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        isFavorite: false,
      });
    });

    it('should return isFavorite=true if place is favorited', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

      // Mock favorite found
      vi.mocked(prisma.favorite.findUnique).mockResolvedValueOnce(mockFavorite);

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        isFavorite: true,
      });
    });

    it('should handle server errors', async () => {
      // Mock user found but then throw an error
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(log.error).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to check favorite status',
      });
    });
  });
});
