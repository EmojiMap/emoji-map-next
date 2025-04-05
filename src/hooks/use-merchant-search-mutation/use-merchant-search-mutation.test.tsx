import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMerchantSearchMutation } from './use-merchant-search-mutation';

// Mock Clerk's useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useMerchantSearchMutation', () => {
  const mockToken = 'test-token';
  const mockGetToken = vi.fn().mockResolvedValue(mockToken);

  // Set up a fresh QueryClient for each test
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue(mockToken);

    // Mock useAuth implementation
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getToken: mockGetToken,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully searches for merchant places', async () => {
    const mockResponse = {
      data: [
        {
          id: '123',
          displayName: 'Test Restaurant',
          formattedAddress: '123 Test St',
          nationalPhoneNumber: '123-456-7890',
        },
      ],
      count: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const searchParams = {
      name: 'Test Restaurant',
      city: 'Test City',
      state: 'TS',
    };

    const { result } = renderHook(() => useMerchantSearchMutation(), {
      wrapper,
    });

    result.current.mutate(searchParams);

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(searchParams),
    });
  });

  it('handles missing auth token', async () => {
    mockGetToken.mockResolvedValueOnce(null);

    const searchParams = {
      name: 'Test Restaurant',
      city: 'Test City',
      state: 'TS',
    };

    const { result } = renderHook(() => useMerchantSearchMutation(), {
      wrapper,
    });

    result.current.mutate(searchParams);

    await waitFor(() => {
      expect(result.current.error?.message).toBe('No token found');
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles API error response', async () => {
    const searchParams = {
      name: 'Test Restaurant',
      city: 'Test City',
      state: 'TS',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const { result } = renderHook(() => useMerchantSearchMutation(), {
      wrapper,
    });

    result.current.mutate(searchParams);

    await waitFor(
      () => {
        expect(result.current.error?.message).toBe(
          'Failed to search merchant places'
        );
      },
      { timeout: 2000 }
    );

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(searchParams),
    });
  });

  it('handles network error', async () => {
    const searchParams = {
      name: 'Test Restaurant',
      city: 'Test City',
      state: 'TS',
    };

    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useMerchantSearchMutation(), {
      wrapper,
    });

    result.current.mutate(searchParams);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(searchParams),
    });
  });
});
