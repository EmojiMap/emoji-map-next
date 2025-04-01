import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/places/favorite/route';
import { prisma } from '@/lib/db';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { transformGoogleDetailsToDbPlace } from '@/services/places/details/transformers/google-details-to-db-place';
import { getUserId } from '@/services/user/get-user-id';
import type { Detail } from '@/types/details';
import { log } from '@/utils/log';
import type { Favorite, Place, User, Review } from '@prisma/client';

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
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/user/get-user-id', () => ({
  getUserId: vi.fn(),
}));

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

// Mock fetchDetails service
vi.mock('@/services/places/details/fetch-details/fetch-details', () => ({
  fetchDetails: vi.fn(),
}));

// Mock transformGoogleDetailsToDbPlace service
vi.mock(
  '@/services/places/details/transformers/google-details-to-db-place',
  () => ({
    transformGoogleDetailsToDbPlace: vi.fn(),
  })
);

vi.mock('@/utils/log', () => ({
  log: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Favorite API Routes', () => {
  // Fixed mock date for consistent testing
  const mockDate = new Date('2023-01-01T12:00:00Z');

  // Mock data
  const mockUserId = 'user123';
  const mockPlaceId = 'place123';
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  } as User;

  const mockPlace: Place = {
    id: mockPlaceId,
    name: 'Test Place',
    latitude: 37.7749,
    longitude: -122.4194,
    createdAt: mockDate,
    updatedAt: mockDate,
    address: '123 Test St',
    merchantId: null,
    allowsDogs: false,
    delivery: false,
    editorialSummary: 'A great restaurant with amazing food',
    formattedAddress: '123 Test St, San Francisco, CA',
    generativeSummary: 'This is a generative summary of the restaurant',
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
    rating: 4.5,
    servesCoffee: true,
    servesDessert: true,
    takeout: true,
    restroom: true,
    userRatingCount: 100,
  };

  const mockFavorite: Favorite = {
    id: 'favorite123',
    userId: mockUserId,
    placeId: mockPlaceId,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    // Reset mocks before each test
    vi.resetAllMocks();

    // Default getUserId mock to return a userId
    vi.mocked(getUserId).mockResolvedValue(mockUserId);

    // Default auth mock to return a userId (for GET endpoint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any);
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
    it('should return 401 if user is not authenticated', async () => {
      // Mock getUserId to throw an unauthorized error
      vi.mocked(getUserId).mockRejectedValueOnce(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost/api/places/favorite', {
        method: 'POST',
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

    it('should create a place if it does not exist and add it to favorites', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place not found, then created
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(null);

      // Mock Google Places details
      const mockGoogleDetails: Detail = {
        name: 'Test Place',
        rating: 4.5,
        reviews: [
          {
            id: 'review_1',
            relativePublishTimeDescription: '2 days ago',
            rating: 5,
            text: {
              text: 'Great place!',
              languageCode: 'en',
            },
            originalText: {
              text: 'Great place!',
              languageCode: 'en',
            },
            status: 'DEFAULT',
          },
          {
            id: 'review_2',
            relativePublishTimeDescription: '1 week ago',
            rating: 4,
            text: {
              text: 'Good experience',
              languageCode: 'en',
            },
            originalText: {
              text: 'Good experience',
              languageCode: 'en',
            },
            status: 'DEFAULT',
          },
        ],
        priceLevel: 2,
        userRatingCount: 100,
        displayName: 'Test Place Display Name',
        primaryTypeDisplayName: 'Restaurant',
        takeout: true,
        delivery: false,
        dineIn: true,
        editorialSummary: 'A great restaurant with amazing food',
        outdoorSeating: true,
        liveMusic: false,
        menuForChildren: true,
        servesDessert: true,
        servesCoffee: true,
        goodForChildren: true,
        goodForGroups: true,
        allowsDogs: false,
        restroom: true,
        paymentOptions: {
          acceptsCreditCards: true,
          acceptsDebitCards: true,
          acceptsCashOnly: false,
        },
        generativeSummary: 'This is a generative summary of the restaurant',
        isFree: false,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Test St, San Francisco, CA',
      };

      // Mock fetchDetails to return our mock Google details
      const mockFetchDetails = vi.mocked(fetchDetails);
      mockFetchDetails.mockResolvedValue(mockGoogleDetails);

      // Mock transformed reviews
      const mockTransformedReviews: Omit<
        Review,
        'placeId' | 'createdAt' | 'updatedAt'
      >[] = [
        {
          id: 'review_1',
          relativePublishTimeDescription: '2 days ago',
          rating: 5,
          text: 'Great place!',
          status: 'DEFAULT',
        },
        {
          id: 'review_2',
          relativePublishTimeDescription: '1 week ago',
          rating: 4,
          text: 'Good experience',
          status: 'DEFAULT',
        },
      ];

      // Mock transformGoogleDetailsToDbPlace to return our transformed data
      const mockTransform = vi.mocked(transformGoogleDetailsToDbPlace);
      mockTransform.mockReturnValue({
        place: mockPlace,
        reviews: mockTransformedReviews,
      });

      // Mock place creation
      vi.mocked(prisma.place.create).mockResolvedValueOnce(mockPlace);

      // Mock reviews creation
      vi.mocked(prisma.review.createMany).mockResolvedValue({ count: 2 });

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
      expect(mockFetchDetails).toHaveBeenCalledWith(mockPlaceId);
      expect(mockTransform).toHaveBeenCalledWith(mockGoogleDetails);
      expect(prisma.place.create).toHaveBeenCalledWith({
        data: mockPlace,
      });
      expect(prisma.review.createMany).toHaveBeenCalledWith({
        data: mockTransformedReviews.map((review) => ({
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
        place: mockPlace,
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
        body: JSON.stringify({ placeId: mockPlaceId }),
      });

      const response = await POST(request);
      const body = await getResponseBody(response);

      expect(getUserId).toHaveBeenCalledWith(request);
      expect(prisma.place.create).not.toHaveBeenCalled();
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          placeId: mockPlaceId,
        },
      });
      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        message: 'Favorite added',
        place: mockPlace,
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
        place: mockPlace,
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
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return no userId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
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

    it('should return isFavorite=false if place does not exist', async () => {
      // Mock user found
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

      // Mock place not found
      vi.mocked(prisma.place.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body).toEqual({
        isFavorite: false,
        message: 'Place not found',
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
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        isFavorite: false,
        place: mockPlace,
        favorite: null,
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
        'http://localhost/api/places/favorite?id=place123'
      );

      const response = await GET(request);
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expectObjectsToMatch(body, {
        isFavorite: true,
        place: mockPlace,
        favorite: mockFavorite,
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
