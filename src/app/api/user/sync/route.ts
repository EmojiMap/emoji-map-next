import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { transformGoogleDetailsToDbPlace } from '@/services/places/details/transformers/google-details-to-db-place';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import type { UserResponse } from '@/types/user';
import { log } from '@/utils/log';

// Validation schemas
const placeIdSchema = z.string().min(1);
const favoriteSchema = z.object({ placeId: placeIdSchema });
const favoritesSchema = z.array(favoriteSchema);

const ratingSchema = z.object({
  placeId: placeIdSchema,
  rating: z.number().int().min(1).max(5),
});
const ratingsSchema = z.array(ratingSchema);

/**
 * POST handler for syncing a user's favorites and ratings
 *
 * @param request - The NextRequest object containing the user's favorites and ratings
 * @param request.body - The body of the request containing the user's favorites and ratings
 * @param request.body.favorites - The user's favorites
 * @param request.body.ratings - The user's ratings
 *
 * @returns A NextResponse with the user's favorites and ratings
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<UserResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // check if user exists in our database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: true,
        ratings: true,
      },
    });

    // Dont create one if they dont exist, webhook should handle that
    // instead of creating a new user, we should just return an error
    if (!dbUser) {
      log.error('User not found in database');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const params = await request.json();
    const favorites = params?.favorites;
    const ratings = params?.ratings;

    // Track what was processed
    const result = {
      favorites: { processed: 0, created: 0, existing: 0, errors: 0 },
      ratings: { processed: 0, created: 0, existing: 0, updated: 0, errors: 0 },
    };

    // Process favorites
    if (favorites) {
      // Validate favorites data
      const validateResult = favoritesSchema.safeParse(favorites);

      if (!validateResult.success) {
        log.error('Invalid favorites', { error: validateResult.error });
        return NextResponse.json(
          { error: 'Invalid favorites' },
          { status: 400 }
        );
      }

      const validatedFavorites = validateResult.data;
      result.favorites.processed = validatedFavorites.length;

      // Use transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Get all place IDs to check
        const placeIds = validatedFavorites.map((fav) => fav.placeId);

        // Find existing places in one query
        const existingPlaces = await tx.place.findMany({
          where: {
            id: {
              in: placeIds,
            },
          },
          select: { id: true },
        });

        const existingPlaceIds = new Set(existingPlaces.map((p) => p.id));

        // Create missing places by fetching details from Google Places API
        const placesToCreate = placeIds.filter(
          (id) => !existingPlaceIds.has(id)
        );

        // Fetch and create places one by one since we need to call external API
        for (const placeId of placesToCreate) {
          try {
            const details = await fetchDetails(placeId);
            const { place: dbPlace, reviews: dbReviews } =
              transformGoogleDetailsToDbPlace(details);

            // Create the place
            await tx.place.create({
              data: dbPlace,
            });

            // Create reviews if any
            if (dbReviews.length > 0) {
              await tx.review.createMany({
                data: dbReviews.map((review) => ({
                  ...review,
                  placeId: dbPlace.id,
                })),
              });
            }
          } catch (error) {
            log.error('Error creating place', { error, placeId });
            result.favorites.errors++;
          }
        }

        // Find existing user favorites in one query
        const existingFavorites = await tx.favorite.findMany({
          where: {
            userId,
            placeId: {
              in: placeIds,
            },
          },
          select: { placeId: true },
        });

        const existingFavoriteIds = new Set(
          existingFavorites.map((f) => f.placeId)
        );
        result.favorites.existing = existingFavoriteIds.size;

        // Create missing favorites in bulk
        const favoritesToCreate = validatedFavorites
          .filter((fav) => !existingFavoriteIds.has(fav.placeId))
          .map((fav) => ({
            userId,
            placeId: fav.placeId,
          }));

        if (favoritesToCreate.length > 0) {
          await tx.favorite.createMany({
            data: favoritesToCreate,
            skipDuplicates: true,
          });
          result.favorites.created = favoritesToCreate.length;
        }
      });
    }

    // Process ratings
    if (ratings) {
      // Validate ratings data
      const validateResult = ratingsSchema.safeParse(ratings);

      if (!validateResult.success) {
        log.error('Invalid ratings', { error: validateResult.error });
        return NextResponse.json({ error: 'Invalid ratings' }, { status: 400 });
      }

      const validatedRatings = validateResult.data;
      result.ratings.processed = validatedRatings.length;

      // Use transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Get all place IDs to check
        const placeIds = validatedRatings.map((r) => r.placeId);

        // Find existing places in one query
        const existingPlaces = await tx.place.findMany({
          where: {
            id: {
              in: placeIds,
            },
          },
          select: { id: true },
        });

        const existingPlaceIds = new Set(existingPlaces.map((p) => p.id));

        // Create missing places by fetching details from Google Places API
        const placesToCreate = placeIds.filter(
          (id) => !existingPlaceIds.has(id)
        );

        // Fetch and create places one by one since we need to call external API
        for (const placeId of placesToCreate) {
          try {
            const details = await fetchDetails(placeId);
            const { place: dbPlace, reviews: dbReviews } =
              transformGoogleDetailsToDbPlace(details);

            // Create the place
            await tx.place.create({
              data: dbPlace,
            });

            // Create reviews if any
            if (dbReviews.length > 0) {
              await tx.review.createMany({
                data: dbReviews.map((review) => ({
                  ...review,
                  placeId: dbPlace.id,
                })),
              });
            }
          } catch (error) {
            log.error('Error creating place', { error, placeId });
            result.ratings.errors++;
          }
        }

        // For ratings, we need to use upsert to handle both creation and updates
        // We need to do this one by one since Prisma doesn't support bulk upserts
        await Promise.all(
          validatedRatings.map(async (rating) => {
            try {
              const upsertResult = await tx.rating.upsert({
                where: {
                  userId_placeId: {
                    userId,
                    placeId: rating.placeId,
                  },
                },
                update: {
                  rating: rating.rating,
                },
                create: {
                  userId,
                  placeId: rating.placeId,
                  rating: rating.rating,
                },
                select: {
                  id: true,
                  // We use this to determine if it was an update or create operation
                  createdAt: true,
                  updatedAt: true,
                },
              });

              // If createdAt equals updatedAt, it's a new record
              if (
                upsertResult.createdAt?.getTime() ===
                upsertResult.updatedAt?.getTime()
              ) {
                result.ratings.created++;
              } else {
                result.ratings.updated++;
              }
            } catch (error) {
              result.ratings.errors++;
              log.error('Error upserting rating', {
                error,
                userId,
                placeId: rating.placeId,
              });
            }
          })
        );
      });
    }

    // Fetch updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: true,
        ratings: true,
      },
    });

    if (!updatedUser) {
      log.error('Failed to fetch updated user data');
      return NextResponse.json(
        { error: 'Failed to fetch updated user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    log.error('Error syncing user', { error });
    return NextResponse.json({ error: 'Error syncing user' }, { status: 500 });
  }
}
