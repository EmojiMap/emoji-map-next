import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

type UseRatingQueryProps = {
  placeId: string;
  enabled: boolean;
};

export const useRatingQuery = ({ placeId, enabled }: UseRatingQueryProps) => {
  const { getToken } = useAuth();

  const ratingQuery = useQuery({
    queryKey: ['rating', placeId],
    queryFn: async () => {
      if (!placeId) return null;
      const token = await getToken();

      const response = await fetch(`/api/places/rating?id=${placeId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch rating');
      }
      return response.json();
    },
    enabled: enabled,
  });

  return ratingQuery;
};
