import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '@/app/api/places/rating/route';
import { prisma } from '@/lib/db';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { getUserId } from '@/services/user/get-user-id';
import type { DetailResponse } from '@/types/details';
import type { User, Place, Rating } from '@prisma/client';

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

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    place: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    rating: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      createMany: vi.fn(),
    },
  },
}));

// Mock getUserId service
vi.mock('@/services/user/get-user-id', () => ({
  getUserId: vi.fn(),
}));

vi.mock(
  '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache',
  () => ({
    getPlaceDetailsWithCache: vi.fn(),
  })
);

// Mock logger
vi.mock('@/utils/log', () => ({
  log: {
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Rating API Routes', () => {
  // Fixed mock date for all tests
  const FIXED_DATE = new Date('2023-01-01T12:00:00Z');

  // Mock data
  const mockUserId = 'user123';
  const mockPlaceId = 'place123';
  const mockRatingId = 'rating123';

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
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };

  const mockUser: User = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
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
          id: '',
          placeId: mockPlaceId,
          relativePublishTimeDescription: '1 month ago',
          rating: 5,
          text: 'Great place!',
          status: 'DEFAULT',
        },
      ],
    },
    cacheHit: true,
    count: 1,
  };

  const createMockRating = (rating: number): Rating => ({
    id: mockRatingId,
    userId: mockUserId,
    placeId: mockPlaceId,
    rating,
    // @ts-expect-error - mock date is a string
    createdAt: FIXED_DATE.toISOString(),
    // @ts-expect-error - mock date is a string
    updatedAt: FIXED_DATE.toISOString(),
  });

  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);

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

  describe('POST /api/places/rating', () => {
    it('should return 500 if getUserId throws an Unauthorized error', async () => {
      // Mock getUserId to throw Unauthorized error
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }
      );

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to process rating' });
    });

    it('should return 400 if placeId is not provided', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Place ID is required' });
    });

    it('should return 404 if user is not found', async () => {
      // Mock user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          body: JSON.stringify({ placeId: mockPlaceId }),
        }
      );

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: 'User not found' });
    });

    it('should return 400 if rating is not provided', async () => {
      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          body: JSON.stringify({ placeId: mockPlaceId }),
        }
      );

      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock no existing rating found
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Rating is required' });
    });

    it('should remove an existing rating if provided rating is the same as the existing rating', async () => {
      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ placeId: mockPlaceId, rating: 4 }),
        }
      );

      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found
      const existingRating = createMockRating(4);
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating deletion (since no new rating is provided, it should delete existing)
      vi.mocked(prisma.rating.delete).mockResolvedValue(existingRating);

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      // The implementation should delete the rating if no new rating is provided
      expect(prisma.rating.delete).toHaveBeenCalledWith({
        where: { id: mockRatingId },
      });
      expect(body).toEqual(
        expect.objectContaining({
          message: 'Rating removed',
          rating: existingRating,
          action: 'removed',
        })
      );
    });

    it('should fetch place details, create place with reviews if it does not exist, and add rating', async () => {
      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ placeId: mockPlaceId, rating: 4 }),
        }
      );

      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

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

      // Mock rating not found
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);

      // Mock rating creation
      const mockRating = createMockRating(4);
      vi.mocked(prisma.rating.create).mockResolvedValue(mockRating);

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(prisma.place.findUnique).toHaveBeenCalledWith({
        where: { id: mockPlaceId },
      });
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
      expect(prisma.rating.findUnique).toHaveBeenCalledWith({
        where: {
          userId_placeId: {
            userId: mockUserId,
            placeId: mockPlaceId,
          },
        },
      });
      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          placeId: mockPlaceId,
          rating: 4,
        },
      });
      expect(body).toEqual({
        message: 'Rating added',
        rating: mockRating,
        action: 'added',
      });
      expect(response.status).toBe(200);
    });

    it('should update an existing rating', async () => {
      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ placeId: mockPlaceId, rating: 5 }),
        }
      );

      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found
      const existingRating = createMockRating(4);
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating update
      const updatedRating = createMockRating(5);
      vi.mocked(prisma.rating.update).mockResolvedValue(updatedRating);

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(prisma.rating.update).toHaveBeenCalledWith({
        where: { id: mockRatingId },
        data: { rating: 5 },
      });
      expect(body).toEqual({
        message: 'Rating updated',
        rating: updatedRating,
        action: 'updated',
      });
      expect(response.status).toBe(200);
    });

    it('should remove a rating if the same rating is submitted again', async () => {
      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ placeId: mockPlaceId, rating: 4 }),
        }
      );

      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found with same rating
      const existingRating = createMockRating(4);
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating deletion
      vi.mocked(prisma.rating.delete).mockResolvedValue(existingRating);

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(prisma.rating.delete).toHaveBeenCalledWith({
        where: { id: mockRatingId },
      });
      expect(body).toEqual({
        message: 'Rating removed',
        rating: existingRating,
        action: 'removed',
      });
      expect(response.status).toBe(200);
    });

    it('should handle errors and return 500 status', async () => {
      const mockRequest = new NextRequest(
        'http://localhost/api/places/rating',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ placeId: mockPlaceId, rating: 4 }),
        }
      );

      // Mock database error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database error')
      );

      const response = await POST(mockRequest);
      const body = await getResponseBody(response);

      expect(body).toEqual({ error: 'Failed to process rating' });
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/places/rating', () => {
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
      expect(body).toEqual({ error: 'Failed to get rating' });
    });

    it('should return 400 if place ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/places/rating');

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Place ID is required' });
    });

    it('should return 404 if user is not found', async () => {
      // Mock user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost/api/places/rating?id=place123'
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
        'http://localhost/api/places/rating?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: 'Place not found',
      });
    });

    it('should return rating=null if place exists but is not rated', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

      // Mock no rating found
      vi.mocked(prisma.rating.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost/api/places/rating?id=place123',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body).toEqual({
        rating: null,
      });
    });

    it('should return rating if place is rated', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(mockPlace);

      // Mock rating found (rated 1 star)
      vi.mocked(prisma.rating.findUnique).mockResolvedValueOnce(
        createMockRating(1)
      );

      const request = new NextRequest(
        'http://localhost/api/places/rating?id=place123',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body).toEqual({
        rating: createMockRating(1).rating,
      });
    });

    it('should handle server errors', async () => {
      // Mock user found but then throw an error
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost/api/places/rating?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Failed to get rating',
      });
    });
  });
});
