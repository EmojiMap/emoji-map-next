import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DetailResponse } from '@/types/details';
import { usePlaceDetailsQuery } from './use-place-details-query';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePlaceDetailsQuery', () => {
  let queryClient: QueryClient;
  const mockSetLastRequest = vi.fn();

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
          gcTime: 0,
          staleTime: 0,
        },
      },
    });
  });

  it('fetches place details successfully when enabled', async () => {
    const mockResponse = {
      // Mock with minimum required fields from DetailResponse type
      // You'll need to add the actual required fields based on your DetailResponse type
    } as DetailResponse;

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const { result } = renderHook(
      () =>
        usePlaceDetailsQuery({
          placeId: 'test-place',
          enabled: true,
          setLastRequest: mockSetLastRequest,
          bypassCache: false,
        }),
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
    expect(mockFetch).toHaveBeenCalledWith('/api/places/details?id=test-place');

    // Verify lastRequest was set correctly
    expect(mockSetLastRequest).toHaveBeenCalledWith({
      url: '/api/places/details',
      params: 'id=test-place',
    });
  });

  it('includes bypassCache parameter when true', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({} as DetailResponse), { status: 200 })
    );

    renderHook(
      () =>
        usePlaceDetailsQuery({
          placeId: 'test-place',
          enabled: true,
          setLastRequest: mockSetLastRequest,
          bypassCache: true,
        }),
      { wrapper }
    );

    // Verify fetch was called with bypassCache parameter
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/places/details?id=test-place&bypassCache=true'
    );

    // Verify lastRequest was set correctly
    expect(mockSetLastRequest).toHaveBeenCalledWith({
      url: '/api/places/details',
      params: 'id=test-place&bypassCache=true',
    });
  });

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(
      () =>
        usePlaceDetailsQuery({
          placeId: 'test-place',
          enabled: false,
          setLastRequest: mockSetLastRequest,
          bypassCache: false,
        }),
      { wrapper }
    );

    // Should not be loading or have data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();

    // Verify fetch was not called
    expect(mockFetch).not.toHaveBeenCalled();
    // Verify lastRequest was not set
    expect(mockSetLastRequest).not.toHaveBeenCalled();
  });

  it('handles empty placeId', async () => {
    const { result } = renderHook(
      () =>
        usePlaceDetailsQuery({
          placeId: '',
          enabled: true,
          setLastRequest: mockSetLastRequest,
          bypassCache: false,
        }),
      { wrapper }
    );

    // Wait for the query to complete and check error state
    await waitFor(
      () => {
        expect(result.current.fetchStatus).toBe('idle');
      },
      { timeout: 2000 }
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();

    // Verify error message
    const error = result.current.error as Error;
    expect(error.message).toBe('ID is required');

    // Verify toast error was shown
    expect(toast.error).toHaveBeenCalledWith('Place ID is required');
  });
});
