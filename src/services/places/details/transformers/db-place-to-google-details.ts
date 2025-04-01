import type { Detail } from '@/types/details';
import type { Place, Review } from '@prisma/client';

export function transformDbPlaceToGoogleDetails(
  place: Place & { reviews: Review[] }
): Detail {
  // Transform reviews to match the expected format
  const transformedReviews = place.reviews.map((review) => ({
    id: review.id,
    relativePublishTimeDescription: review.relativePublishTimeDescription,
    rating: review.rating,
    text: {
      text: review.text,
    },
    originalText: {
      text: review.text,
    },
    status: review.status,
  }));

  // Ensure priceLevel is within valid range (1-4 or null)
  const priceLevel =
    place.priceLevel !== null
      ? place.priceLevel >= 1 && place.priceLevel <= 4
        ? (place.priceLevel as 1 | 2 | 3 | 4)
        : null
      : null;

  // Create the detail object
  const detail: Detail = {
    allowsDogs: place.allowsDogs,
    delivery: place.delivery,
    dineIn: place.dineIn,
    displayName: place.name,
    editorialSummary: place.editorialSummary,
    formattedAddress: place.formattedAddress,
    generativeSummary: place.generativeSummary,
    goodForChildren: place.goodForChildren,
    goodForGroups: place.goodForGroups,
    isFree: place.isFree,
    liveMusic: place.liveMusic,
    location: {
      latitude: place.latitude,
      longitude: place.longitude,
    },
    menuForChildren: place.menuForChildren,
    name: `places/${place.id}`,
    outdoorSeating: place.outdoorSeating,
    paymentOptions: {
      acceptsCashOnly: place.acceptsCashOnly ?? false,
      acceptsCreditCards: place.acceptsCreditCards ?? false,
      acceptsDebitCards: place.acceptsDebitCards ?? false,
    },
    priceLevel,
    primaryTypeDisplayName: place.primaryTypeDisplayName,
    rating: place.rating,
    restroom: place.restroom,
    reviews: transformedReviews,
    servesCoffee: place.servesCoffee,
    servesDessert: place.servesDessert,
    takeout: place.takeout,
    userRatingCount: place.userRatingCount,
  };

  return detail;
}
