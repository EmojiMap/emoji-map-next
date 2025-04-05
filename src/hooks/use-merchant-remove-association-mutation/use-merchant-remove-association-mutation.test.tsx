import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMerchantRemoveAssociationMutation } from './use-merchant-remove-association-mutation';

// Mock Clerk's useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useMerchantRemoveAssociationMutation', () => {
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

  it('successfully removes merchant association', async () => {
    const mockResponse = {
      success: true,
      place: {
        id: '123',
        name: 'Test Place',
        merchantId: null,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => useMerchantRemoveAssociationMutation(),
      {
        wrapper,
      }
    );

    result.current.mutate({ placeId: '123' });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/merchant/associate', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ placeId: '123' }),
    });
  });

  it('handles API error response', async () => {
    const errorMessage = 'Failed to remove merchant association';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    });

    const { result } = renderHook(
      () => useMerchantRemoveAssociationMutation(),
      {
        wrapper,
      }
    );

    result.current.mutate({ placeId: '123' });

    await waitFor(() => {
      expect(result.current.error?.message).toBe(errorMessage);
    });
  });

  it('handles network error', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(
      () => useMerchantRemoveAssociationMutation(),
      {
        wrapper,
      }
    );

    result.current.mutate({ placeId: '123' });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
