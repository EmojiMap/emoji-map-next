import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';
import type { Favorite } from '@prisma/client';

type FavoriteResponse = {
  message: string;
  favorite: Favorite | null;
  action: 'added' | 'removed';
};

/**
 * @description API endpoint for managing place favorites
 *
 * @example POST Request - Add/Remove Favorite
 * POST /api/places/favorite
 * {
 *   "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4" // Place ID
 * }
 *
 * @example POST Success Response - Add Favorite
 * {
 *   "message": "Favorite added",
 *   "favorite": {
 *     "id": "cl9z...",
 *     "userId": "user_2...",
 *     "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
 *     "createdAt": "2024-01-15T...",
 *     "updatedAt": "2024-01-15T..."
 *   },
 *   "action": "added"
 * }
 *
 * @example POST Success Response - Remove Favorite
 * {
 *   "message": "Favorite removed",
 *   "favorite": null,
 *   "action": "removed"
 * }
 *
 * @example GET Request
 * GET /api/places/favorite?id=ChIJN1t_tDeuEmsRUsoyG83frY4
 *
 * @example GET Success Response
 * {
 *   "favorite": {
 *     "id": "cl9z...",
 *     "userId": "user_2...",
 *     "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
 *     "createdAt": "2024-01-15T...",
 *     "updatedAt": "2024-01-15T..."
 *   }
 * }
 *
 * @example Error Response
 * {
 *   "error": "Error message"
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<FavoriteResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      log.error('[FAVORITE] User not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await request.json();
    const placeId = params?.placeId;

    if (!placeId) {
      log.error('[FAVORITE] Place ID is required');
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    // Check if this place exists in the database
    let place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    // If place doesn't exist, create it
    if (!place) {
      log.debug('[FAVORITE] Place not found, creating it');

      const details = await getPlaceDetailsWithCache({ id: placeId });

      await prisma.place.create({
        data: {
          id: details.data.id,
          name: details.data.displayName,
          latitude: details.data.location.latitude,
          longitude: details.data.location.longitude,
          address: details.data.address,
          merchantId: null,
          allowsDogs: details.data.allowsDogs,
          delivery: details.data.delivery,
          editorialSummary: details.data.editorialSummary,
          generativeSummary: details.data.generativeSummary,
          goodForChildren: details.data.goodForChildren,
          dineIn: details.data.dineIn,
          goodForGroups: details.data.goodForGroups,
          isFree: details.data.isFree,
          liveMusic: details.data.liveMusic,
          menuForChildren: details.data.menuForChildren,
          outdoorSeating: details.data.outdoorSeating,
          acceptsCashOnly: details.data.acceptsCashOnly,
          acceptsCreditCards: details.data.acceptsCreditCards,
          acceptsDebitCards: details.data.acceptsDebitCards,
          priceLevel: details.data.priceLevel,
          primaryTypeDisplayName: details.data.primaryTypeDisplayName,
          googleRating: details.data.rating,
          servesCoffee: details.data.servesCoffee,
          servesDessert: details.data.servesDessert,
          takeout: details.data.takeout,
          restroom: details.data.restroom,
          openNow: details.data.openNow,
          userRatingCount: details.data.userRatingCount,
        },
      });

      log.debug('[FAVORITE] Place created');

      if (details.data.reviews.length > 0) {
        log.debug('[FAVORITE] Creating reviews for place');
        await prisma.review.createMany({
          data: details.data.reviews.map((review) => ({
            ...review,
            placeId,
          })),
        });
      }

      place = await prisma.place.findUnique({
        where: { id: placeId },
      });
    }

    // Check if the user has already favorited this place
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId,
        },
      },
    });

    let action: 'added' | 'removed';
    let favorite: Favorite | null = null;

    // If favorite exists, remove it (toggle off)
    if (existingFavorite) {
      log.debug('[FAVORITE] Favorite exists, removing it');
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });

      action = 'removed';
    }
    // If favorite doesn't exist, create it (toggle on)
    else {
      log.debug('[FAVORITE] Favorite does not exist, creating it');
      favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          placeId,
        },
      });

      action = 'added';
    }

    return NextResponse.json(
      {
        message: action === 'added' ? 'Favorite added' : 'Favorite removed',
        favorite,
        action,
      },
      { status: 200 }
    );
  } catch (error) {
    log.error('[FAVORITE] Failed to process favorite', { error });
    return NextResponse.json(
      { error: 'Failed to process favorite' },
      { status: 500 }
    );
  }
}

type GetFavoriteResponse = {
  isFavorite: boolean;
};

/**
 * @description API endpoint for getting favorite status of a place
 *
 * @example GET Request
 * GET /api/places/favorite?id=ChIJN1t_tDeuEmsRUsoyG83frY4
 *
 * @example GET Success Response
 * {
 *   "isFavorite": true
 * }
 *
 * @example Error Response
 * {
 *   "error": "Error message"
 * }
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GetFavoriteResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // Get the place ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('id');

    if (!placeId) {
      log.error('[FAVORITE] Place ID is required in query params');
      return NextResponse.json(
        { error: 'Place ID is required in query params' },
        { status: 400 }
      );
    }

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      log.error('[FAVORITE] User not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the place exists
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      log.error('[FAVORITE] Place not found');
      return NextResponse.json(
        {
          error: 'Place not found',
        },
        { status: 404 }
      );
    }

    // Check if the user has favorited this place
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: place.id,
        },
      },
    });

    return NextResponse.json(
      {
        isFavorite: !!favorite,
      },
      { status: 200 }
    );
  } catch (error) {
    log.error('[FAVORITE] Failed to check favorite status', { error });
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}
