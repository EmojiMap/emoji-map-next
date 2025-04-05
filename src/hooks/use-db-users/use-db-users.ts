import { useQuery } from '@tanstack/react-query';
import type {
  PaginatedDBUsersResponse,
  UsePaginatedDbUsersParams,
} from '@/types/admin-db-users';

async function fetchUsers({
  limit = 10,
  offset = 0,
}: UsePaginatedDbUsersParams = {}): Promise<PaginatedDBUsersResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`/api/admin/db-users?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const data = (await response.json()) as PaginatedDBUsersResponse;

  return data;
}

export function useDbUsers(options: UsePaginatedDbUsersParams = {}) {
  return useQuery({
    queryKey: ['db-users', options.limit, options.offset],
    queryFn: () => fetchUsers(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
