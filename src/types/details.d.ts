import type { CachedResponse } from './generics';
import type { GooglePlaceDetails, Review } from './google-places-details';
import type { ReviewStatus } from '@prisma/client';

export type Detail = {
  name: GooglePlaceDetails['name'];
  reviews: {
    id: Review['id'] | null;
    relativePublishTimeDescription: Review['relativePublishTimeDescription'];
    rating: Review['rating'];
    text?: {
      text?: Review['text']['text'];
      languageCode?: Review['text']['languageCode'];
    };
    originalText?: {
      text?: Review['originalText']['text'];
      languageCode?: Review['originalText']['languageCode'];
    };
    status: ReviewStatus;
  }[];
  rating: GooglePlaceDetails['rating'] | null;
  priceLevel: (1 | 2 | 3 | 4) | null;
  userRatingCount: GooglePlaceDetails['userRatingCount'] | null;
  openNow?: GooglePlaceDetails['currentOpeningHours']['openNow'];
  displayName: GooglePlaceDetails['displayName']['text'];
  primaryTypeDisplayName:
    | GooglePlaceDetails['primaryTypeDisplayName']['text']
    | null;
  takeout: GooglePlaceDetails['takeout'] | null;
  delivery: GooglePlaceDetails['delivery'] | null;
  dineIn: GooglePlaceDetails['dineIn'] | null;
  editorialSummary: GooglePlaceDetails['editorialSummary']['text'] | null;
  outdoorSeating: GooglePlaceDetails['outdoorSeating'] | null;
  liveMusic: GooglePlaceDetails['liveMusic'] | null;
  menuForChildren: GooglePlaceDetails['menuForChildren'] | null;
  servesDessert: GooglePlaceDetails['servesDessert'] | null;
  servesCoffee: GooglePlaceDetails['servesCoffee'] | null;
  goodForChildren: GooglePlaceDetails['goodForChildren'] | null;
  goodForGroups: GooglePlaceDetails['goodForGroups'] | null;
  allowsDogs: GooglePlaceDetails['allowsDogs'] | null;
  restroom: GooglePlaceDetails['restroom'] | null;
  paymentOptions: GooglePlaceDetails['paymentOptions'];
  generativeSummary:
    | GooglePlaceDetails['generativeSummary']['overview']['text']
    | null;
  isFree: boolean | null;
  location: GooglePlaceDetails['location'];
  formattedAddress: GooglePlaceDetails['formattedAddress'] | null;
};

/**
 * Response type for the details API endpoint
 */
export type DetailResponse = CachedResponse<Detail>;

export type GoogleDetailsResponse = {
  name: GooglePlaceDetails['name'];
  reviews: GooglePlaceDetails['reviews'];
  rating: GooglePlaceDetails['rating'];
  priceLevel: GooglePlaceDetails['priceLevel'];
  userRatingCount: GooglePlaceDetails['userRatingCount'] | null;
  currentOpeningHours: GooglePlaceDetails['currentOpeningHours'];
  displayName: GooglePlaceDetails['displayName'];
  primaryTypeDisplayName: GooglePlaceDetails['primaryTypeDisplayName'];
  takeout: GooglePlaceDetails['takeout'];
  delivery: GooglePlaceDetails['delivery'];
  dineIn: GooglePlaceDetails['dineIn'];
  editorialSummary: GooglePlaceDetails['editorialSummary'];
  outdoorSeating: GooglePlaceDetails['outdoorSeating'] | null;
  liveMusic: GooglePlaceDetails['liveMusic'];
  menuForChildren: GooglePlaceDetails['menuForChildren'];
  servesDessert: GooglePlaceDetails['servesDessert'] | null;
  servesCoffee: GooglePlaceDetails['servesCoffee'] | null;
  goodForChildren: GooglePlaceDetails['goodForChildren'] | null;
  goodForGroups: GooglePlaceDetails['goodForGroups'] | null;
  allowsDogs: GooglePlaceDetails['allowsDogs'];
  restroom: GooglePlaceDetails['restroom'];
  paymentOptions: GooglePlaceDetails['paymentOptions'];
  generativeSummary: GooglePlaceDetails['generativeSummary'] | null;
  location: GooglePlaceDetails['location'];
  formattedAddress: GooglePlaceDetails['formattedAddress'];
};
