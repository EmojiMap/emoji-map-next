import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';

export interface AssociateMerchantParams {
  placeId: string;
}

export interface AssociateMerchantResponse {
  merchant: {
    id: string;
    userId: string;
    places: Array<{
      id: string;
      name: string;
      address: string;
    }>;
    user: {
      id: string;
      email: string;
      username: string | null;
    };
  };
}

async function associateMerchant({
  placeId,
  getToken,
}: AssociateMerchantParams & {
  getToken: () => Promise<string | null>;
}): Promise<AssociateMerchantResponse> {
  const token = await getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('/api/merchant/associate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ placeId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to associate merchant');
  }

  const data = await response.json();
  return data.data;
}

export function useMerchantAssociateMutation({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: (params: AssociateMerchantParams) =>
      associateMerchant({ ...params, getToken }),
    onSuccess,
  });
}
