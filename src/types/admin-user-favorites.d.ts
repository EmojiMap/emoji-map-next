import type { Favorite, Place } from '@prisma/client';

export type FavoriteWithPlace = Favorite & {
  place: Pick<Place, 'name' | 'description'>;
};

export type FavoriteResponse = {
  favorites: FavoriteWithPlace[];
  totalCount: number;
  limit: number;
  offset: number;
};
