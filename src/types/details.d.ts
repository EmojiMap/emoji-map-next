import type { CachedResponse } from './generics';
import type { Place, Review } from '@prisma/client';

type ReviewWithoutTimeStamps = Omit<
  Review,
  'createdAt' | 'updatedAt' | 'placeId'
>;

type PlaceWithoutTimeStamps = Omit<Place, 'createdAt' | 'updatedAt'>;

export type PlaceWithReviews = PlaceWithoutTimeStamps & {
  reviews: ReviewWithoutTimeStamps[];
};

/**
 * Response type for the details API endpoint
 */
export type DetailResponse = CachedResponse<PlaceWithReviews>;
