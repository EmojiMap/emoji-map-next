import { NextRequest } from 'next/server';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/places/details/route';
import { inngest } from '@/inngest/client';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { getSearchParams } from '@/services/places/details/get-search-params/get-search-params';
import type { DetailResponse } from '@/types/details';

// Mock all the dependencies
vi.mock(
  '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache',
  () => ({
    getPlaceDetailsWithCache: vi.fn(),
  })
);

vi.mock(
  '@/services/places/details/get-search-params/get-search-params',
  () => ({
    getSearchParams: vi.fn(),
  })
);

vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Places Details API', () => {
  // Sample data for tests
  const mockPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';

  const mockDetailsResponse: DetailResponse = {
    data: {
      id: mockPlaceId,
      name: 'Test Place',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Test St, Test City, TC 12345',
      merchantId: null,
      allowsDogs: false,
      delivery: true,
      editorialSummary: 'A great place to eat',
      generativeSummary: 'This is a generated summary of the place',
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
      reviews: [],
      displayName: 'Test Place Display Name',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      paymentOptions: {
        acceptsCreditCards: true,
        acceptsDebitCards: true,
        acceptsCashOnly: false,
      },
      rating: 4.5,
    },
    count: 1,
    cacheHit: false,
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementations
    (getSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      id: mockPlaceId,
      bypassCache: false,
    });

    (
      getPlaceDetailsWithCache as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockDetailsResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return place details and trigger Inngest event for valid request', async () => {
    // Create a mock request
    const request = new NextRequest(
      `https://example.com/api/places/details?id=${mockPlaceId}`
    );

    // Execute the handler
    const response = await GET(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual(mockDetailsResponse);

    // Verify the correct functions were called
    expect(getSearchParams).toHaveBeenCalledWith(request);
    expect(getPlaceDetailsWithCache).toHaveBeenCalledWith({
      id: mockPlaceId,
      bypassCache: false,
    });

    // Verify Inngest event was sent
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create',
      data: {
        id: mockPlaceId,
        details: mockDetailsResponse,
      },
    });
  });

  it('should return cached data and still trigger Inngest event when available', async () => {
    // Create a cached response with cacheHit set to true
    const cachedResponse = {
      ...mockDetailsResponse,
      cacheHit: true,
    };

    // Mock getPlaceDetailsWithCache to return the cached data
    (
      getPlaceDetailsWithCache as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(cachedResponse);

    const request = new NextRequest(
      `https://example.com/api/places/details?id=${mockPlaceId}`
    );
    const response = await GET(request);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual(cachedResponse);
    expect(data.cacheHit).toBe(true);

    // Verify getPlaceDetailsWithCache was called with the correct parameters
    expect(getPlaceDetailsWithCache).toHaveBeenCalledWith({
      id: mockPlaceId,
      bypassCache: false,
    });

    // Verify Inngest event was still sent even with cached data
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create',
      data: {
        id: mockPlaceId,
        details: cachedResponse,
      },
    });
  });

  it('should fetch from Google when cache is bypassed', async () => {
    // Mock bypassCache parameter
    (getSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      id: mockPlaceId,
      bypassCache: true,
    });

    const request = new NextRequest(
      `https://example.com/api/places/details?id=${mockPlaceId}&bypassCache=true`
    );
    await GET(request);

    // Verify getPlaceDetailsWithCache was called with bypassCache=true
    expect(getPlaceDetailsWithCache).toHaveBeenCalledWith({
      id: mockPlaceId,
      bypassCache: true,
    });

    // Verify Inngest event was sent
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create',
      data: {
        id: mockPlaceId,
        details: mockDetailsResponse,
      },
    });
  });

  it('should handle errors gracefully and not send Inngest event', async () => {
    // Mock getPlaceDetailsWithCache to throw an error
    (
      getPlaceDetailsWithCache as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('Failed to fetch place details'));

    const request = new NextRequest(
      `https://example.com/api/places/details?id=${mockPlaceId}`
    );
    const response = await GET(request);
    const data = await response.json();

    // Verify the response is an error
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to fetch place details');
    expect(data).toHaveProperty('message');

    // Verify Inngest event was not sent
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it('should handle missing ID parameter', async () => {
    // Mock missing ID
    (getSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      id: undefined,
      bypassCache: false,
    });

    // Mock getPlaceDetailsWithCache to throw an error when ID is missing
    (
      getPlaceDetailsWithCache as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('ID is required'));

    const request = new NextRequest(`https://example.com/api/places/details`);
    const response = await GET(request);
    const data = await response.json();

    // Verify the response is an error
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.message).toContain('ID is required');

    // Verify Inngest event was not sent
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it('should pass additional parameters correctly', async () => {
    // Mock request with additional parameters
    (getSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      id: mockPlaceId,
      bypassCache: true,
      // Add any other parameters that might be supported in the future
    });

    const request = new NextRequest(
      `https://example.com/api/places/details?id=${mockPlaceId}&bypassCache=true`
    );
    await GET(request);

    // Verify parameters were passed correctly
    expect(getPlaceDetailsWithCache).toHaveBeenCalledWith({
      id: mockPlaceId,
      bypassCache: true,
    });

    // Verify Inngest event was sent
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'places/create',
      data: {
        id: mockPlaceId,
        details: mockDetailsResponse,
      },
    });
  });
});
