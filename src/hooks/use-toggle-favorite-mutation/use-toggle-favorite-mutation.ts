import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';

type UseToggleFavoriteMutationProps = {
  onSuccess: () => void;
  onError: (error: Error) => void;
};

export function useToggleFavoriteMutation({
  onSuccess,
  onError,
}: UseToggleFavoriteMutationProps) {
  const { getToken } = useAuth();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ placeId }: { placeId: string }) => {
      if (!placeId) throw new Error('No place ID');
      const token = await getToken();

      const response = await fetch('/api/places/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ placeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      onError(error);
    },
  });

  return toggleFavoriteMutation;
}
