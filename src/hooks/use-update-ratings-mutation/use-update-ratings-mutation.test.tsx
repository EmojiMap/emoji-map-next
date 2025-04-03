import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateRatingsMutation } from './use-update-ratings-mutation';
import type { Mock } from 'vitest';

// Mock useAuth hook
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useUpdateRatingsMutation', () => {
  let queryClient: QueryClient;
  const mockToken = 'mock-token';
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();

    // Setup useAuth mock with proper Vitest typing
    (useAuth as Mock).mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockToken),
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully updates rating', async () => {
    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ rating: 4 }),
    });

    const { result } = renderHook(
      () =>
        useUpdateRatingsMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation
    await result.current.mutateAsync({
      placeId: 'test-place-id',
      rating: 4,
    });

    // Verify fetch was called with correct arguments
    expect(mockFetch).toHaveBeenCalledWith('/api/places/rating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ placeId: 'test-place-id', rating: 4 }),
    });

    // Verify onSuccess callback was called
    expect(mockOnSuccess).toHaveBeenCalledWith({ rating: 4 });
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('handles error when placeId is missing', async () => {
    const { result } = renderHook(
      () =>
        useUpdateRatingsMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation with missing placeId
    await result.current
      .mutateAsync({
        placeId: '',
        rating: 4,
      })
      .catch(() => {});

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(new Error('No place ID'));
  });

  it('handles API error response', async () => {
    // Setup mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(
      () =>
        useUpdateRatingsMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation
    await result.current
      .mutateAsync({
        placeId: 'test-place-id',
        rating: 4,
      })
      .catch(() => {});

    expect(mockFetch).toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(
      new Error('Failed to toggle favorite')
    );
  });

  it('handles network error', async () => {
    // Setup mock network error
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(
      () =>
        useUpdateRatingsMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation
    await result.current
      .mutateAsync({
        placeId: 'test-place-id',
        rating: 4,
      })
      .catch(() => {});

    expect(mockFetch).toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(networkError);
  });
});
