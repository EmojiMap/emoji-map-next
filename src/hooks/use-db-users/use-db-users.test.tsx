import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDbUsers } from './use-db-users';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useDbUsers', () => {
  // Set up a fresh QueryClient for each test
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully fetches users with default pagination', async () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      count: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useDbUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/db-users?limit=10&offset=0'
    );
  });

  it('fetches users with custom pagination parameters', async () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      count: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useDbUsers({ limit: 20, offset: 40 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResponse);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/db-users?limit=20&offset=40'
    );
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const { result } = renderHook(() => useDbUsers(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.error?.message).toBe('Failed to fetch users');
      },
      { timeout: 2000 }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/db-users?limit=10&offset=0'
    );
  });

  it('handles network error', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useDbUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/db-users?limit=10&offset=0'
    );
  });
});
