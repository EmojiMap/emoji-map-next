import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import type { MerchantPlaceSearchResponse } from '@/types/admin-search';

interface SearchParams {
  name: string;
  city: string;
  state: string;
}

async function searchMerchantPlaces(
  params: SearchParams,
  { getToken }: { getToken: () => Promise<string | null> }
) {
  const token = await getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('/api/merchant/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to search merchant places');
  }

  return response.json() as Promise<MerchantPlaceSearchResponse>;
}

export function useMerchantSearchMutation() {
  const { getToken } = useAuth();

  return useMutation<MerchantPlaceSearchResponse, Error, SearchParams>({
    mutationFn: (params) => searchMerchantPlaces(params, { getToken }),
  });
}
