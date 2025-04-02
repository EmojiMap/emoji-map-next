import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';
import type { Favorite, Place } from '@prisma/client';

/**
 * POST handler for favoriting a place
 * if the place is already favorited, it will be removed from the users favorites
 * if the place is not favorited, it will first create the place in the database
 * and then create the favorite relationship
 *
 * @param request - The Next.js request object containing the place ID in the body
 * @returns A NextResponse with:
 *  - 200: {message: string, place: Place, favorite: Favorite | null, action: 'added' | 'removed'} if successful
 *  - 400: {error: string} if place ID missing
 *  - 401: {error: string} if unauthorized
 *  - 404: {error: string} if user not found
 *  - 500: {error: string} if server error
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<
    | {
        message: string;
        place: Place;
        favorite: Favorite | null;
        action: 'added' | 'removed';
      }
    | ErrorResponse
  >
> {
  try {
    const userId = await getUserId(request);

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
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

      const placeWithReviews = await fetchDetails(placeId);

      log.info(`[FAVORITE] fetched details from google`);

      place = await prisma.place.create({
        data: {
          id: placeWithReviews.id,
          name: placeWithReviews.name,
          latitude: placeWithReviews.latitude,
          longitude: placeWithReviews.longitude,
          address: placeWithReviews.address,
          merchantId: null,
          allowsDogs: placeWithReviews.allowsDogs,
          delivery: placeWithReviews.delivery,
          editorialSummary: placeWithReviews.editorialSummary,
          generativeSummary: placeWithReviews.generativeSummary,
          goodForChildren: placeWithReviews.goodForChildren,
          dineIn: placeWithReviews.dineIn,
          goodForGroups: placeWithReviews.goodForGroups,
          isFree: placeWithReviews.isFree,
          liveMusic: placeWithReviews.liveMusic,
          menuForChildren: placeWithReviews.menuForChildren,
          outdoorSeating: placeWithReviews.outdoorSeating,
          acceptsCashOnly: placeWithReviews.acceptsCashOnly,
          acceptsCreditCards: placeWithReviews.acceptsCreditCards,
          acceptsDebitCards: placeWithReviews.acceptsDebitCards,
          priceLevel: placeWithReviews.priceLevel,
          primaryTypeDisplayName: placeWithReviews.primaryTypeDisplayName,
          googleRating: placeWithReviews.googleRating,
          servesCoffee: placeWithReviews.servesCoffee,
          servesDessert: placeWithReviews.servesDessert,
          takeout: placeWithReviews.takeout,
          restroom: placeWithReviews.restroom,
          openNow: placeWithReviews.openNow,
          userRatingCount: placeWithReviews.userRatingCount,
        },
      });

      if (placeWithReviews.reviews.length > 0) {
        await prisma.review.createMany({
          data: placeWithReviews.reviews.map((review) => ({
            ...review,
            placeId: placeWithReviews.id,
          })),
        });
      }
    }

    // Check if the user has already favorited this place
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: place.id,
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
          placeId: place.id,
        },
      });

      action = 'added';
    }

    return NextResponse.json(
      {
        message: action === 'added' ? 'Favorite added' : 'Favorite removed',
        place,
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

/**
 * GET endpoint to check if a place is favorited by the authenticated user
 *
 * @param request - Next.js request object containing search params with place ID
 * @returns NextResponse with:
 *  - 200: {isFavorite: boolean, place: Place, favorite: Favorite | null} if successful
 *  - 400: {error: string} if place ID missing
 *  - 401: {error: string} if unauthorized
 *  - 404: {error: string} if user not found
 *  - 500: {error: string} if server error
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<
    | {
        isFavorite: boolean;
        place?: Place;
        favorite?: Favorite | null;
        message?: string;
      }
    | ErrorResponse
  >
> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the place ID from the URL search params
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('id');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required in query params' },
        { status: 400 }
      );
    }

    log.debug('placeId', { placeId });

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the place exists
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      return NextResponse.json(
        {
          isFavorite: false,
          message: 'Place not found',
        },
        { status: 200 }
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
        place,
        favorite,
      },
      { status: 200 }
    );
  } catch (error) {
    log.error('Failed to check favorite status', { error });
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}
