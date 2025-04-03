import { ReviewStatus } from '@prisma/client';
import type {
  PlaceWithReviews,
  ReviewWithoutTimeStamps,
} from '@/types/details';
import { getReviewId } from '../get-review-id/get-review-id';
import {
  mapPriceLevel,
  type ValidatedGoogleDetailsResponse,
} from '../validator/details-validator';

export function transformDetailsData(
  data: ValidatedGoogleDetailsResponse
): PlaceWithReviews {
  // Filter out reviews with empty text
  const transformedReviews: ReviewWithoutTimeStamps[] = data.reviews
    .map((review) => ({
      placeId: data.id,
      id: getReviewId(review.name),
      status: ReviewStatus.DEFAULT,
      rating: review.rating,
      relativePublishTimeDescription: review.relativePublishTimeDescription,
      text: review.text?.text ?? review.originalText?.text ?? '',
    }))
    .filter((review) => review.text !== '');

  // Transform to Detail type with default values for required fields
  const normalizedData: PlaceWithReviews = {
    id: data.id,
    acceptsCashOnly: data.paymentOptions?.acceptsCashOnly || false,
    acceptsCreditCards: data.paymentOptions?.acceptsCreditCards || false,
    acceptsDebitCards: data.paymentOptions?.acceptsDebitCards || false,
    address: data.formattedAddress || '',
    allowsDogs: data.allowsDogs || false,
    delivery: data.delivery || false,
    dineIn: data.dineIn || false,
    editorialSummary: data.editorialSummary?.text || '',
    generativeSummary: data.generativeSummary?.overview?.text || '',
    goodForChildren: data.goodForChildren || false,
    goodForGroups: data.goodForGroups || false,
    isFree: data.priceLevel === 'PRICE_LEVEL_FREE',
    latitude: data.location.latitude,
    liveMusic: data.liveMusic || false,
    longitude: data.location.longitude,
    menuForChildren: data.menuForChildren || false,
    merchantId: null,
    name: data.displayName?.text || '',
    openNow: data.currentOpeningHours?.openNow || null,
    outdoorSeating: data.outdoorSeating || false,
    priceLevel: mapPriceLevel(data.priceLevel),
    primaryTypeDisplayName: data.primaryTypeDisplayName?.text || '',
    googleRating: data.rating || 0,
    restroom: data.restroom || false,
    reviews: transformedReviews,
    servesCoffee: data.servesCoffee || false,
    servesDessert: data.servesDessert || false,
    takeout: data.takeout || false,
    userRatingCount: data.userRatingCount || 0,

    // Following fields are for backwards compatibility with the old API
    displayName: data.displayName?.text || '',
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    },
    rating: data.rating || 0,
    paymentOptions: {
      acceptsCreditCards: data.paymentOptions?.acceptsCreditCards || false,
      acceptsDebitCards: data.paymentOptions?.acceptsDebitCards || false,
      acceptsCashOnly: data.paymentOptions?.acceptsCashOnly || false,
    },
  };

  return normalizedData;
}
