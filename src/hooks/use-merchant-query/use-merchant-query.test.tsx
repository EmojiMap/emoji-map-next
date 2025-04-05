import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMerchantQuery } from './use-merchant-query';

// Mock Clerk's useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useMerchantQuery', () => {
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

  it('successfully fetches merchant data', async () => {
    const mockResponse = {
      data: {
        id: '123',
        displayName: 'Test Merchant',
        formattedAddress: '123 Test St',
        nationalPhoneNumber: '123-456-7890',
      },
      count: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useMerchantQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant', {
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
  });

  it('handles missing auth token', async () => {
    mockGetToken.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useMerchantQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.error?.message).toBe('No token found');
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const { result } = renderHook(() => useMerchantQuery(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.error?.message).toBe(
          'Failed to fetch merchant data'
        );
      },
      { timeout: 2000 }
    );

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant', {
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
  });

  it('handles network error', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useMerchantQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant', {
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
  });
});
