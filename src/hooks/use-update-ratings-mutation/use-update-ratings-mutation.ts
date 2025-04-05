import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';

type UseUpdateRatingsMutationProps = {
  onSuccess: ({ rating }: { rating: number }) => void;
  onError: (error: Error) => void;
};

export function useUpdateRatingsMutation({
  onSuccess,
  onError,
}: UseUpdateRatingsMutationProps) {
  const { getToken } = useAuth();

  const updateRatingMutation = useMutation({
    mutationFn: async ({
      placeId,
      rating,
    }: {
      placeId: string;
      rating: number;
    }) => {
      if (!placeId) throw new Error('No place ID');
      const token = await getToken();

      const response = await fetch('/api/places/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ placeId, rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      return response.json();
    },
    onSuccess: (_, { rating }) => {
      onSuccess({ rating });
    },
    onError: (error) => {
      onError(error);
    },
  });

  return updateRatingMutation;
}
