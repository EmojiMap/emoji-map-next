import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/places/rating/route';
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/db';
import { getUserId } from '@/services/user/get-user-id';
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
  },
}));

// Mock getUserId service
vi.mock('@/services/user/get-user-id', () => ({
  getUserId: vi.fn(),
}));

// Mock inngest
vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
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
  const mockPlace: Place = {
    id: 'place_123',
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
    id: 'user_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };

  const createMockRating = (rating: number): Rating => ({
    id: 'rating_123',
    userId: 'user_123',
    placeId: 'place_123',
    rating,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });

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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found
      const existingRating = createMockRating(4);
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

    it('should create a new rating and trigger place details fetch if place does not exist', async () => {
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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place not found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(null);

      // Mock rating not found
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);

      // Mock rating creation
      const mockRating = createMockRating(4);
      vi.mocked(prisma.rating.create).mockResolvedValue(mockRating);

      await POST(mockRequest);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      });
      expect(prisma.place.findUnique).toHaveBeenCalledWith({
        where: { id: 'place_123' },
      });
      expect(inngest.send).toHaveBeenCalledWith({
        name: 'places/get-details',
        data: {
          id: 'place_123',
        },
      });
      expect(prisma.rating.findUnique).toHaveBeenCalledWith({
        where: {
          userId_placeId: {
            userId: 'user_123',
            placeId: 'place_123',
          },
        },
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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found
      const existingRating = createMockRating(4);
      vi.mocked(prisma.rating.findUnique).mockResolvedValue(existingRating);

      // Mock rating update
      const updatedRating = createMockRating(5);
      vi.mocked(prisma.rating.update).mockResolvedValue(updatedRating);

      await POST(mockRequest);

      expect(prisma.rating.update).toHaveBeenCalledWith({
        where: { id: 'rating_123' },
        data: { rating: 5 },
      });
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          message: 'Rating updated',
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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Mock place found
      vi.mocked(prisma.place.findUnique).mockResolvedValue(mockPlace);

      // Mock existing rating found with same rating
      const existingRating = createMockRating(4);
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
