import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePlacePhotosQuery } from './use-place-photos-query';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePlacePhotosQuery', () => {
  const mockPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
  const mockPhotoUrls = [
    new URL('https://example.com/photo1.jpg'),
    new URL('https://example.com/photo2.jpg'),
  ];
  const mockResponse = {
    data: mockPhotoUrls,
    count: mockPhotoUrls.length,
    cacheHit: true,
  };

  // Create a new QueryClient for each test
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Disable retries for easier testing
          retry: false,
        },
      },
    });
    mockFetch.mockReset();
    // Reset console.error mock before each test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to wrap hook with QueryClientProvider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch photos successfully', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => usePlacePhotosQuery({ placeId: mockPlaceId }),
      { wrapper }
    );

    // Initially in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/places/photos?id=${mockPlaceId}`
    );

    // Verify data is correct
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should handle fetch errors', async () => {
    const consoleError = vi.spyOn(console, 'error');

    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(
      () => usePlacePhotosQuery({ placeId: mockPlaceId }),
      { wrapper }
    );

    // Wait for the query to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching place photos:',
      expect.any(Error)
    );

    // Verify error state
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe(
      'Failed to fetch place photos'
    );
  });

  it('should handle network errors', async () => {
    const consoleError = vi.spyOn(console, 'error');
    const networkError = new Error('Network error');

    // Mock network error
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(
      () => usePlacePhotosQuery({ placeId: mockPlaceId }),
      { wrapper }
    );

    // Wait for the query to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching place photos:',
      networkError
    );

    // Verify error state
    expect(result.current.error).toBe(networkError);
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => usePlacePhotosQuery({ placeId: mockPlaceId, enabled: false }),
      { wrapper }
    );

    // Should be in disabled state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    // Verify fetch was not called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should refetch when enabled changes from false to true', async () => {
    // Start with enabled: false
    const { result, rerender } = renderHook(
      ({ enabled }) => usePlacePhotosQuery({ placeId: mockPlaceId, enabled }),
      {
        wrapper,
        initialProps: { enabled: false },
      }
    );

    // Verify no initial fetch
    expect(mockFetch).not.toHaveBeenCalled();

    // Mock successful response for when we enable
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // Enable the query
    rerender({ enabled: true });

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify fetch was called after enabling
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/places/photos?id=${mockPlaceId}`
    );
    expect(result.current.data).toEqual(mockResponse);
  });
});
