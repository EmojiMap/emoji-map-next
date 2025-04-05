import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import type { MerchantResponse } from '@/types/merchant';

async function fetchMerchant({
  getToken,
}: {
  getToken: () => Promise<string | null>;
}) {
  const token = await getToken();
  if (!token) {
    throw new Error('No token found');
  }
  const response = await fetch('/api/merchant', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch merchant data');
  }
  return response.json() as Promise<MerchantResponse>;
}

export function useMerchantQuery() {
  const { getToken } = useAuth();

  return useQuery<MerchantResponse, Error>({
    queryKey: ['merchant'],
    queryFn: () => fetchMerchant({ getToken }),
  });
}
