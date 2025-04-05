import { useQuery } from '@tanstack/react-query';
import type { AdminClerkUsersResponse } from '@/types/admin-clerk-users';

interface UsePaginatedClerkUsersParams {
  limit?: number;
  offset?: number;
}

async function fetchClerkUsers({
  limit = 10,
  offset = 0,
}: UsePaginatedClerkUsersParams = {}): Promise<AdminClerkUsersResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`/api/admin/clerk-users?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch Clerk users');
  }

  return response.json();
}

export function useClerkUsers(options: UsePaginatedClerkUsersParams = {}) {
  return useQuery({
    queryKey: ['clerk-users', options.limit, options.offset],
    queryFn: () => fetchClerkUsers(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
