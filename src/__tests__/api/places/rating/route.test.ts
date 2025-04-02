import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/places/rating/route';
import { prisma } from '@/lib/db';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { getUserId } from '@/services/user/get-user-id';
import type { PlaceWithReviews } from '@/types/details';
import type { User, Place, Rating } from '@prisma/client';

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

// Mock fetchDetails service
vi.mock('@/services/places/details/fetch-details/fetch-details', () => ({
  fetchDetails: vi.fn(),
}));

// Mock logger
vi.mock('@/utils/log', () => ({
  log: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock NextRequest
class MockNextRequest {
  private body: Record<string, unknown>;
  headers: Headers;

  constructor(
    body: Record<string, unknown>,
    headers: Record<string, string> = {}
  ) {
    this.body = body;
    this.headers = new Headers(headers);
  }

  async json() {
    return this.body;
  }

  clone() {
    return this;
  }
}

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((data, options) => ({ data, options })),
    },
  };
});

describe('Rating API Routes', () => {
  // Fixed mock date for all tests
  const FIXED_DATE = new Date('2023-01-01T12:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers and set a fixed system time
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    // Default mock for getUserId to return a valid user ID
    vi.mocked(getUserId).mockResolvedValue('user_123');
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  describe('POST /api/places/rating', () => {
    it('should return 500 if getUserId throws an Unauthorized error', async () => {
      const mockRequest = new MockNextRequest(
        {},
        {
          authorization: 'Bearer invalid-token',
        }
      ) as unknown as NextRequest;

      // Mock getUserId to throw Unauthorized error
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      await POST(mockRequest);

      expect(getUserId).toHaveBeenCalledWith(mockRequest);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to process rating' },
        { status: 500 }
      );
    });

    it('should return 400 if placeId is not provided', async () => {
      const mockRequest = new MockNextRequest(
        {},
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user found
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      await POST(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    });

    it('should return 400 if rating is not provided for a new rating', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user found
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      const mockPlace: Place = {
        id: 'place_123',
        name: 'Test Place',
        latitude: 0,
        longitude: 0,
        address: '',
        merchantId: null,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        allowsDogs: false,
        delivery: false,
        editorialSummary: null,
        generativeSummary: null,
        goodForChildren: false,
        dineIn: false,
        goodForGroups: false,
        isFree: false,
        liveMusic: false,
        menuForChildren: false,
        outdoorSeating: false,
        acceptsCashOnly: null,
        acceptsCreditCards: null,
        acceptsDebitCards: null,
        priceLevel: null,
        primaryTypeDisplayName: null,
        servesCoffee: false,
        servesDessert: false,
        takeout: false,
        restroom: false,
        googleRating: 0,
        openNow: false,
        userRatingCount: 0,
      };
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock no existing rating found
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);

      await POST(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Rating is required' },
        { status: 400 }
      );
    });

    it('should remove an existing rating if no new rating is provided', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user found
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      const mockPlace: Place = {
        id: 'place_123',
        name: 'Test Place',
        latitude: 0,
        longitude: 0,
        address: '',
        merchantId: null,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        allowsDogs: false,
        delivery: false,
        editorialSummary: null,
        generativeSummary: null,
        goodForChildren: false,
        dineIn: false,
        goodForGroups: false,
        isFree: false,
        liveMusic: false,
        menuForChildren: false,
        outdoorSeating: false,
        acceptsCashOnly: null,
        acceptsCreditCards: null,
        acceptsDebitCards: null,
        priceLevel: null,
        primaryTypeDisplayName: null,
        servesCoffee: false,
        servesDessert: false,
        takeout: false,
        restroom: false,
        googleRating: 0,
        openNow: false,
        userRatingCount: 0,
      };
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found
      const existingRating: Rating = {
        id: 'rating_123',
        userId: 'user_123',
        placeId: 'place_123',
        rating: 4,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating deletion (since no rating is provided, it should delete existing)
      vi.mocked(prisma.rating.delete).mockResolvedValue(existingRating);

      await POST(mockRequest);

      // The implementation should delete the rating if no new rating is provided
      expect(prisma.rating.delete).toHaveBeenCalledWith({
        where: { id: 'rating_123' },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          message: 'Rating removed',
          place: mockPlace,
          rating: existingRating,
          action: 'removed',
        },
        { status: 200 }
      );
    });

    it('should return 404 if user is not found', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
          rating: 4,
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await POST(mockRequest);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'User not found' },
        { status: 404 }
      );
    });

    it('should create a new place with reviews if it does not exist', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
          rating: 4,
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user found
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place not found initially
      vi.mocked(prisma.place.findUnique).mockResolvedValue(null);

      // Mock Google Places details
      const mockGoogleDetails: PlaceWithReviews = {
        id: 'place_123',
        name: 'Test Place',
        googleRating: 4.5,
        merchantId: null,
        reviews: [
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
        ],
        priceLevel: 2,
        userRatingCount: 100,
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
        acceptsCashOnly: false,
        acceptsCreditCards: true,
        acceptsDebitCards: true,
        generativeSummary: 'This is a generative summary of the restaurant',
        isFree: false,
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Test St, San Francisco, CA',
        openNow: true,
      };

      // Mock fetchDetails to return our mock Google details
      const mockFetchDetails = vi.mocked(fetchDetails);
      mockFetchDetails.mockResolvedValue(mockGoogleDetails);

      // Mock place creation
      const mockTransformedPlace = {
        id: 'place_123',
        name: 'Test Place',
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Test St, San Francisco, CA',
        merchantId: null,
        allowsDogs: false,
        delivery: false,
        editorialSummary: 'A great restaurant with amazing food',
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
        servesCoffee: true,
        servesDessert: true,
        takeout: true,
        restroom: true,
        googleRating: 4.5,
        openNow: true,
        userRatingCount: 100,
      };

      // Mock place creation with timestamps
      const mockPlaceWithTimestamps = {
        ...mockTransformedPlace,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };

      vi.mocked(prisma.place.create).mockResolvedValue(mockPlaceWithTimestamps);

      // Mock reviews creation
      vi.mocked(prisma.review.createMany).mockResolvedValue({ count: 2 });

      // Mock rating not found
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);

      // Mock rating creation
      const mockRating: Rating = {
        id: 'rating_123',
        userId: 'user_123',
        placeId: 'place_123',
        rating: 4,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.rating.create).mockResolvedValue(mockRating);

      const response = await POST(mockRequest);
      console.log('Response:', response);

      // Verify the flow
      expect(mockFetchDetails).toHaveBeenCalledWith('place_123');

      expect(prisma.place.create).toHaveBeenCalledWith({
        data: mockTransformedPlace,
      });

      expect(prisma.review.createMany).toHaveBeenCalledWith({
        data: mockGoogleDetails.reviews.map((review) => ({
          ...review,
          placeId: 'place_123',
        })),
      });

      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          placeId: 'place_123',
          rating: 4,
        },
      });

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          message: 'Rating added',
          place: mockPlaceWithTimestamps,
          rating: mockRating,
          action: 'added',
        },
        { status: 200 }
      );
    });

    it('should update an existing rating', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
          rating: 5,
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user found
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      const mockPlace: Place = {
        id: 'place_123',
        name: 'Test Place',
        latitude: 0,
        longitude: 0,
        address: '',
        merchantId: null,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        allowsDogs: false,
        delivery: false,
        editorialSummary: null,
        generativeSummary: null,
        goodForChildren: false,
        dineIn: false,
        goodForGroups: false,
        isFree: false,
        liveMusic: false,
        menuForChildren: false,
        outdoorSeating: false,
        acceptsCashOnly: null,
        acceptsCreditCards: null,
        acceptsDebitCards: null,
        priceLevel: null,
        primaryTypeDisplayName: null,
        servesCoffee: false,
        servesDessert: false,
        takeout: false,
        restroom: false,
        googleRating: 0,
        openNow: false,
        userRatingCount: 0,
      };
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found
      const existingRating: Rating = {
        id: 'rating_123',
        userId: 'user_123',
        placeId: 'place_123',
        rating: 4, // Previous rating
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating update
      const updatedRating: Rating = {
        id: 'rating_123',
        userId: 'user_123',
        placeId: 'place_123',
        rating: 5, // Updated rating
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.rating.update).mockResolvedValue(updatedRating);

      await POST(mockRequest);

      expect(prisma.rating.update).toHaveBeenCalledWith({
        where: { id: 'rating_123' },
        data: { rating: 5 },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          message: 'Rating updated',
          place: mockPlace,
          rating: updatedRating,
          action: 'updated',
        },
        { status: 200 }
      );
    });

    it('should remove a rating if the same rating is submitted again', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
          rating: 4, // Same as existing rating
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock user found
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      const mockPlace: Place = {
        id: 'place_123',
        name: 'Test Place',
        latitude: 0,
        longitude: 0,
        address: '',
        merchantId: null,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        allowsDogs: false,
        delivery: false,
        editorialSummary: null,
        generativeSummary: null,
        goodForChildren: false,
        dineIn: false,
        goodForGroups: false,
        isFree: false,
        liveMusic: false,
        menuForChildren: false,
        outdoorSeating: false,
        acceptsCashOnly: null,
        acceptsCreditCards: null,
        acceptsDebitCards: null,
        priceLevel: null,
        primaryTypeDisplayName: null,
        servesCoffee: false,
        servesDessert: false,
        takeout: false,
        restroom: false,
        googleRating: 0,
        openNow: false,
        userRatingCount: 0,
      };
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found with same rating
      const existingRating: Rating = {
        id: 'rating_123',
        userId: 'user_123',
        placeId: 'place_123',
        rating: 4, // Same rating
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
      };
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating deletion
      vi.mocked(prisma.rating.delete).mockResolvedValue(existingRating);

      await POST(mockRequest);

      expect(prisma.rating.delete).toHaveBeenCalledWith({
        where: { id: 'rating_123' },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          message: 'Rating removed',
          place: mockPlace,
          rating: existingRating,
          action: 'removed',
        },
        { status: 200 }
      );
    });

    it('should handle errors and return 500 status', async () => {
      const mockRequest = new MockNextRequest(
        {
          placeId: 'place_123',
          rating: 4,
        },
        {
          authorization: 'Bearer valid-token',
        }
      ) as unknown as NextRequest;

      // Mock database error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database error')
      );

      await POST(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to process rating' },
        { status: 500 }
      );
    });
  });
});
