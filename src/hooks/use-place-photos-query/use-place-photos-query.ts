import { useQuery } from '@tanstack/react-query';
import type { PhotosResponse } from '@/types/google-photos';

type UsePlacePhotosQueryProps = {
  placeId: string;
  enabled?: boolean;
};

async function fetchPlacePhotos(placeId: string): Promise<PhotosResponse> {
  try {
    const response = await fetch(`/api/places/photos?id=${placeId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch place photos');
    }

    const data = (await response.json()) as PhotosResponse;

    return data;
  } catch (error) {
    console.error('Error fetching place photos:', error);
    throw error;
  }
}

export function usePlacePhotosQuery({
  placeId,
  enabled,
}: UsePlacePhotosQueryProps) {
  return useQuery({
    queryKey: ['placePhotos', placeId],
    queryFn: () => fetchPlacePhotos(placeId),
    enabled,
  });
}
