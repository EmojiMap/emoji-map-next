import type { SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DetailResponse } from '@/types/details';

type UsePlaceDetailsQueryProps = {
  placeId: string;
  bypassCache?: boolean;
  setLastRequest: (
    value: SetStateAction<{
      url: string;
      params: string;
    } | null>
  ) => void;
  enabled: boolean;
};

export const usePlaceDetailsQuery = ({
  placeId,
  bypassCache,
  setLastRequest,
  enabled,
}: UsePlaceDetailsQueryProps) => {
  const placeDetailsQuery = useQuery({
    queryKey: ['placeDetails', placeId, bypassCache],
    queryFn: async () => {
      if (!placeId) {
        toast.error('Place ID is required');
        throw new Error('ID is required');
      }

      const params = new URLSearchParams({
        id: placeId,
      });

      if (bypassCache) {
        params.append('bypassCache', 'true');
      }

      // Store the request details for debugging
      setLastRequest({
        url: `/api/places/details`,
        params: params.toString(),
      });

      try {
        const response = await fetch(
          `/api/places/details?${params.toString()}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API returned ${response.status}: ${response.statusText}. ${errorText}`
          );
        }

        return response.json() as Promise<DetailResponse>;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Place details query failed: ${errorMessage}`);
        throw error;
      }
    },
    enabled: enabled,
    retry: 1,
  });

  return placeDetailsQuery;
};
