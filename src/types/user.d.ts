import type { Favorite, Rating, User } from '@prisma/client';

export type UserResponse = {
  user: User & {
    favorites?: Favorite[];
    ratings?: Rating[];
  };
};
