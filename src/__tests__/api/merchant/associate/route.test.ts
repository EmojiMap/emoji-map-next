import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/merchant/associate/route';
import { transformGoogleDetailsToDbPlace } from '@/services/places/details/transformers/google-details-to-db-place';
import type { Detail } from '@/types/details';
import type { Place, Review } from '@prisma/client';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock(
  '@/services/places/details/transformers/google-details-to-db-place',
  () => ({
    transformGoogleDetailsToDbPlace: vi.fn(),
  })
);

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
    user: { findUnique: vi.fn() },
    place: { findUnique: vi.fn(), upsert: vi.fn() },
    merchant: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Types
type RequestBody = {
  placeId?: string;
};

// Mock transaction object
const mockTx = {
  user: { findUnique: vi.fn() },
  place: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  merchant: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

// Fixed mock date for consistent testing
const mockDate = new Date('2023-01-01T12:00:00Z');

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
};

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

const mockPlace: Place = {
  id: 'place-1',
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

const mockMerchant = {
  id: 'merchant-1',
  userId: 'user-1',
  places: [],
  user: mockUser,
};

// Helper function to create NextRequest
function createNextRequest(body: RequestBody): NextRequest {
  return new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('Merchant Associate Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up fake timers
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    // Default auth mock to return a userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
    global.fetch = vi.fn();
  });

  it('should handle invalid params', async () => {
    const request = createNextRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid parameters');
  });

  it('should handle unauthorized requests', async () => {
    // Mock auth to return no userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it("should make request to create place if it doesn't exist", async () => {
    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.merchant.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.merchant.create).mockResolvedValue(mockMerchant);
    vi.mocked(mockTx.place.upsert).mockResolvedValue({
      ...mockPlace,
      photos: [],
      ratings: [],
      reviews: mockTransformedReviews,
      favorites: [],
    });

    // Mock the place details API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockGoogleDetails }),
    });

    // Mock transformGoogleDetailsToDbPlace
    vi.mocked(transformGoogleDetailsToDbPlace).mockReturnValue({
      place: mockPlace,
      reviews: mockTransformedReviews,
    });

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(global.fetch).toHaveBeenCalled();
    expect(transformGoogleDetailsToDbPlace).toHaveBeenCalledWith(
      mockGoogleDetails
    );
    expect(mockTx.place.upsert).toHaveBeenCalledWith({
      where: { id: 'place-1' },
      create: {
        ...mockPlace,
        reviews: {
          createMany: {
            data: mockTransformedReviews,
          },
        },
      },
      update: {},
      include: {
        photos: true,
        ratings: true,
        reviews: true,
        favorites: true,
      },
    });
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.merchant).toEqual(mockMerchant);
  });

  it('should not make request to create place if it already exists', async () => {
    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue(mockPlace);
    vi.mocked(mockTx.merchant.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.merchant.create).mockResolvedValue(mockMerchant);

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should make the user a merchant if they are not already a merchant', async () => {
    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue(mockPlace);
    vi.mocked(mockTx.merchant.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.merchant.create).mockResolvedValue(mockMerchant);

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(mockTx.merchant.create).toHaveBeenCalled();
    expect(mockTx.merchant.update).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.data.merchant).toEqual(mockMerchant);
  });

  it('should handle the case where the user is already a merchant', async () => {
    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue(mockPlace);
    vi.mocked(mockTx.merchant.findUnique).mockResolvedValue(mockMerchant);
    vi.mocked(mockTx.merchant.update).mockResolvedValue({
      ...mockMerchant,
      places: [mockPlace],
    });

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(mockTx.merchant.create).not.toHaveBeenCalled();
    expect(mockTx.merchant.update).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.data.merchant.places).toHaveLength(1);
  });

  it('should handle the case where the place is already claimed by another merchant', async () => {
    const otherMerchant = {
      ...mockMerchant,
      id: 'merchant-2',
      userId: 'user-2',
      user: { ...mockUser, id: 'user-2', email: 'other@example.com' },
    };

    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue({
      ...mockPlace,
      merchantId: otherMerchant.id,
    });
    vi.mocked(mockTx.merchant.findUnique).mockImplementation((args) => {
      if (args.where.id === otherMerchant.id) {
        return Promise.resolve(otherMerchant);
      }
      return Promise.resolve(null);
    });

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already claimed');
  });

  it('should handle the case where the user already has a place associated with them, adding this place to their merchant account', async () => {
    const existingPlace = { ...mockPlace, id: 'place-0' };
    const merchantWithPlace = {
      ...mockMerchant,
      places: [existingPlace],
    };

    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue(mockPlace);
    vi.mocked(mockTx.merchant.findUnique).mockResolvedValue(merchantWithPlace);
    vi.mocked(mockTx.merchant.update).mockResolvedValue({
      ...merchantWithPlace,
      places: [...merchantWithPlace.places, mockPlace],
    });

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(mockTx.merchant.update).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.data.merchant.places).toHaveLength(2);
  });

  it('should return the merchant account with all necessary data', async () => {
    vi.mocked(mockTx.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(mockTx.place.findUnique).mockResolvedValue(mockPlace);
    vi.mocked(mockTx.merchant.findUnique).mockResolvedValue(null);
    vi.mocked(mockTx.merchant.create).mockResolvedValue(mockMerchant);

    const request = createNextRequest({ placeId: 'place-1' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.merchant).toEqual(mockMerchant);
    expect(data.data.merchant.user).toBeDefined();
    expect(data.data.merchant.places).toBeDefined();
  });
});
