import type { Merchant, Place } from '@prisma/client';

export type PlaceWithRelations = Place & {
  photos: Photo[];
  ratings: Rating[];
  reviews: Review[];
};

type MerchantWithPlaces = Merchant & {
  places: PlaceWithRelations[];
};

export type MerchantResponse = {
  merchant: MerchantWithPlaces | null;
};
