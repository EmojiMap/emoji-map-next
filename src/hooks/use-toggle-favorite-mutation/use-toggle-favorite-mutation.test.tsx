import { useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToggleFavoriteMutation } from './use-toggle-favorite-mutation';
import type { Mock } from 'vitest';

// Mock useAuth hook
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useToggleFavoriteMutation', () => {
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

  it('successfully toggles favorite', async () => {
    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(
      () =>
        useToggleFavoriteMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation
    await result.current.mutateAsync({
      placeId: 'test-place-id',
    });

    // Verify fetch was called with correct arguments
    expect(mockFetch).toHaveBeenCalledWith('/api/places/favorite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ placeId: 'test-place-id' }),
    });

    // Verify onSuccess callback was called
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('handles error when placeId is missing', async () => {
    const { result } = renderHook(
      () =>
        useToggleFavoriteMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation with missing placeId
    await result.current
      .mutateAsync({
        placeId: '',
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
        useToggleFavoriteMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation
    await result.current
      .mutateAsync({
        placeId: 'test-place-id',
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
        useToggleFavoriteMutation({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Trigger mutation
    await result.current
      .mutateAsync({
        placeId: 'test-place-id',
      })
      .catch(() => {});

    expect(mockFetch).toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(networkError);
  });
});
