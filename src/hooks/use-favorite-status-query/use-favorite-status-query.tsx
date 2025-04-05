import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';

type UseFavoriteStatusQueryProps = {
  placeId: string;
  enabled: boolean;
};

export const useFavoriteStatusQuery = ({
  placeId,
  enabled,
}: UseFavoriteStatusQueryProps) => {
  const { getToken } = useAuth();

  const favoriteStatusQuery = useQuery({
    queryKey: ['favoriteStatus', placeId],
    queryFn: async () => {
      if (!placeId) return null;
      const token = await getToken();

      const response = await fetch(`/api/places/favorite?id=${placeId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch favorite status');
      }
      return response.json();
    },
    enabled: enabled,
  });

  return favoriteStatusQuery;
};
