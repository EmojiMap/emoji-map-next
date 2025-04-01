import { ReviewStatus } from '@prisma/client';
import { z } from 'zod';
import type { Detail } from '@/types/details';
import type { Place, Review } from '@prisma/client';

// Define Zod schema for the entire Google Details to Place transformation
const googleDetailsToPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string(),
  merchantId: z.string().nullable(),
  allowsDogs: z.boolean(),
  delivery: z.boolean(),
  editorialSummary: z.string().nullable(),
  formattedAddress: z.string().nullable(),
  generativeSummary: z.string().nullable(),
  goodForChildren: z.boolean(),
  dineIn: z.boolean(),
  goodForGroups: z.boolean(),
  isFree: z.boolean(),
  liveMusic: z.boolean(),
  menuForChildren: z.boolean(),
  outdoorSeating: z.boolean(),
  priceLevel: z.number(),
  primaryTypeDisplayName: z.string().nullable(),
  rating: z.number(),
  servesCoffee: z.boolean(),
  servesDessert: z.boolean(),
  takeout: z.boolean(),
  restroom: z.boolean(),
  userRatingCount: z.number(),
  acceptsCashOnly: z.boolean(),
  acceptsCreditCards: z.boolean(),
  acceptsDebitCards: z.boolean(),
});

type PlaceWithoutTimeStamps = Omit<Place, 'createdAt' | 'updatedAt'>;
type ReviewWithoutTimeStamps = Omit<
  Review,
  'createdAt' | 'updatedAt' | 'placeId'
>;

type ReturnType = {
  place: PlaceWithoutTimeStamps;
  reviews: ReviewWithoutTimeStamps[];
};

export function transformGoogleDetailsToDbPlace(details: Detail): ReturnType {
  // Extract place ID from the name (format: "places/{id}")
  const id = details.name.split('/')[1];

  if (!id) {
    throw new Error('Invalid place name format. Expected "places/{id}"');
  }

  const transformedReviews: ReviewWithoutTimeStamps[] = details.reviews
    .map((review) => ({
      id: review.id,
      status: ReviewStatus.DEFAULT,
      rating: review.rating,
      relativePublishTimeDescription: review.relativePublishTimeDescription,
      text: review.text?.text ?? review.originalText?.text ?? '',
    }))
    .filter((review) => review.text !== '');

  // Create the place object with all required fields
  const place: PlaceWithoutTimeStamps = {
    id,
    name: details.displayName,
    latitude: details.location.latitude,
    longitude: details.location.longitude,
    address: details.formattedAddress ?? '',
    merchantId: null,
    allowsDogs: details.allowsDogs ?? false,
    delivery: details.delivery ?? false,
    editorialSummary: details.editorialSummary,
    formattedAddress: details.formattedAddress,
    generativeSummary: details.generativeSummary,
    goodForChildren: details.goodForChildren ?? false,
    dineIn: details.dineIn ?? false,
    goodForGroups: details.goodForGroups ?? false,
    isFree: details.isFree ?? false,
    liveMusic: details.liveMusic ?? false,
    menuForChildren: details.menuForChildren ?? false,
    outdoorSeating: details.outdoorSeating ?? false,
    acceptsCashOnly: details.paymentOptions?.acceptsCashOnly,
    acceptsCreditCards: details.paymentOptions?.acceptsCreditCards,
    acceptsDebitCards: details.paymentOptions?.acceptsDebitCards,
    priceLevel: details.priceLevel,
    primaryTypeDisplayName: details.primaryTypeDisplayName,
    rating: details.rating ?? 0,
    servesCoffee: details.servesCoffee ?? false,
    servesDessert: details.servesDessert ?? false,
    takeout: details.takeout ?? false,
    restroom: details.restroom ?? false,
    userRatingCount: details.userRatingCount ?? 0,
  };

  // Validate and transform using Zod schema
  return {
    place: googleDetailsToPlaceSchema.parse(place),
    reviews: transformedReviews,
  };
}
