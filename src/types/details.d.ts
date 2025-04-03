import type { CachedResponse } from './generics';
import type { Place, Review } from '@prisma/client';

export type ReviewWithoutTimeStamps = Omit<Review, 'createdAt' | 'updatedAt'>;

export type PlaceWithoutTimeStamps = Omit<Place, 'createdAt' | 'updatedAt'> & {
  displayName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  paymentOptions: {
    acceptsCreditCards: boolean;
    acceptsDebitCards: boolean;
    acceptsCashOnly: boolean;
  };
};

export type PlaceWithReviews = PlaceWithoutTimeStamps & {
  reviews: ReviewWithoutTimeStamps[];
};

/**
 * Response type for the details API endpoint
 */
export type DetailResponse = CachedResponse<PlaceWithReviews>;
