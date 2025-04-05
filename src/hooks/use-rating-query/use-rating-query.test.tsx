import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRatingQuery } from './use-rating-query';

// Mock useAuth hook
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useRatingQuery', () => {
  let queryClient: QueryClient;

  // Helper function to wrap the hook with necessary providers
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock useAuth implementation with proper typing
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getToken: vi.fn().mockResolvedValue('mock-token'),
    });
  });

  it('fetches rating successfully when enabled', async () => {
    const mockResponse = { rating: 4.5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => useRatingQuery({ placeId: 'test-place', enabled: true }),
      { wrapper }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the data
    expect(result.current.data).toEqual(mockResponse);

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith('/api/places/rating?id=test-place', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    });
  });

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(
      () => useRatingQuery({ placeId: 'test-place', enabled: false }),
      { wrapper }
    );

    // Should not be loading or have data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();

    // Verify fetch was not called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(
      () => useRatingQuery({ placeId: 'test-place', enabled: true }),
      { wrapper }
    );

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify error message
    expect(result.current.error).toEqual(new Error('Failed to fetch rating'));
  });

  it('returns null when placeId is empty', async () => {
    const { result } = renderHook(
      () => useRatingQuery({ placeId: '', enabled: true }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });
});
