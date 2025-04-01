import { v4 } from 'uuid';
import type { Detail } from '@/types/details';
import {
  mapPriceLevel,
  type ValidatedGoogleDetailsResponse,
} from '../validator/details-validator';

export function transformDetailsData(
  data: ValidatedGoogleDetailsResponse
): Detail {
  // Map the price level to the Detail format
  const mappedPriceLevel = mapPriceLevel(data.priceLevel);

  // Check if the place is free
  const isFree = data.priceLevel === 'PRICE_LEVEL_FREE';

  // Transform to Detail type with default values for required fields
  const normalizedData: Detail = {
    name: data.name || '',
    reviews: data.reviews.map((review) => ({
      ...review,
      status: 'DEFAULT',
      id: v4(),
    })),
    rating: data.rating || 0,
    priceLevel: mappedPriceLevel,
    userRatingCount: data.userRatingCount || 0,
    openNow: data.currentOpeningHours?.openNow || undefined,
    displayName: data.displayName?.text || '',
    primaryTypeDisplayName: data.primaryTypeDisplayName?.text || '',
    takeout: data.takeout || false,
    delivery: data.delivery || false,
    dineIn: data.dineIn || false,
    editorialSummary: data.editorialSummary?.text || '',
    outdoorSeating: data.outdoorSeating || false,
    liveMusic: data.liveMusic || false,
    menuForChildren: data.menuForChildren || false,
    servesDessert: data.servesDessert || false,
    servesCoffee: data.servesCoffee || false,
    goodForChildren: data.goodForChildren || false,
    goodForGroups: data.goodForGroups || false,
    allowsDogs: data.allowsDogs || false,
    restroom: data.restroom || false,
    paymentOptions: data.paymentOptions || {
      acceptsCreditCards: false,
      acceptsDebitCards: false,
      acceptsCashOnly: false,
    },
    generativeSummary: data.generativeSummary?.overview?.text || '',
    isFree,
    location: data.location,
    formattedAddress: data.formattedAddress || '',
  };

  return normalizedData;
}
