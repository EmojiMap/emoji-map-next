import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMerchantAssociateMutation } from './use-merchant-associate-mutation';

// Mock Clerk's useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useMerchantAssociateMutation', () => {
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

  it('successfully associates merchant with place', async () => {
    const mockResponse = {
      data: {
        merchant: {
          id: 'merchant_123',
          userId: 'user_123',
          places: [
            {
              id: 'place_123',
              name: 'Test Restaurant',
              address: '123 Test St',
            },
          ],
          user: {
            id: 'user_123',
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useMerchantAssociateMutation(), {
      wrapper,
    });

    result.current.mutate({ placeId: 'place_123' });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse.data);
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/associate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ placeId: 'place_123' }),
    });
  });

  it('handles missing auth token', async () => {
    mockGetToken.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useMerchantAssociateMutation(), {
      wrapper,
    });

    result.current.mutate({ placeId: 'place_123' });

    await waitFor(() => {
      expect(result.current.error?.message).toBe('No token found');
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Place already claimed' }),
    });

    const { result } = renderHook(() => useMerchantAssociateMutation(), {
      wrapper,
    });

    result.current.mutate({ placeId: 'place_123' });

    await waitFor(() => {
      expect(result.current.error?.message).toBe('Place already claimed');
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/associate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ placeId: 'place_123' }),
    });
  });

  it('handles network error', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useMerchantAssociateMutation(), {
      wrapper,
    });

    result.current.mutate({ placeId: 'place_123' });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(mockGetToken).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/associate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ placeId: 'place_123' }),
    });
  });
});
