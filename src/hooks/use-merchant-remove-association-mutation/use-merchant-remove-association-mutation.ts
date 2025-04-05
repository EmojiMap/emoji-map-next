import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import type { ErrorResponse } from '@/types/error-response';

interface RemoveAssociationResponse {
  success: boolean;
  place?: {
    id: string;
    name: string;
    merchantId: string | null;
  };
  error?: string;
}

interface RemoveAssociationVariables {
  placeId: string;
}

async function removeAssociation({
  placeId,
  getToken,
}: RemoveAssociationVariables & {
  getToken: () => Promise<string | null>;
}): Promise<RemoveAssociationResponse> {
  const token = await getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('/api/merchant/associate', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ placeId }),
  });

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.error || 'Failed to remove merchant association');
  }

  return response.json();
}

export function useMerchantRemoveAssociationMutation({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: ({ placeId }: RemoveAssociationVariables) =>
      removeAssociation({ placeId, getToken }),
    onSuccess,
  });
}
