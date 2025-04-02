import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isNull, isUndefined, toNumber } from 'lodash-es';
import { prisma } from '@/lib/db';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';
import type { Place, Rating } from '@prisma/client';

/**
 * POST handler for rating a place
 *
 * if the user has already rated the place,
 * they can either update their rating by providing a non null
 * rating param, or they can delete their rating by providing a
 * null rating param
 *
 * if a user has not already rated a place,
 * they can create a rating by providing a non null rating param
 * if the place does not exist, it will be created
 *
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<
    | {
        message: string;
        place: Place;
        rating: Rating | null;
        action: 'added' | 'removed' | 'updated';
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
      log.error('[RATING] User not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await request.json();
    const placeId = params?.placeId;

    if (!placeId) {
      log.error('[RATING] Place ID is required');
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    const userRating: string | undefined = params?.rating;

    if (!userRating) {
      log.error(
        '[RATING] Rating not provided, if exiting rating found, it will be removed'
      );
    }

    // Check if this place exists in the database
    let place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    // If place doesn't exist, create it
    if (!place) {
      log.debug('[RATING] Place not found, creating it');

      const details = await fetchDetails(placeId);

      log.info(`[RATING] fetched details from google`);

      place = await prisma.place.create({
        data: {
          id: details.id,
          name: details.name,
          latitude: details.latitude,
          longitude: details.longitude,
          address: details.address,
          merchantId: null,
          allowsDogs: details.allowsDogs,
          delivery: details.delivery,
          editorialSummary: details.editorialSummary,
          generativeSummary: details.generativeSummary,
          goodForChildren: details.goodForChildren,
          dineIn: details.dineIn,
          goodForGroups: details.goodForGroups,
          isFree: details.isFree,
          liveMusic: details.liveMusic,
          menuForChildren: details.menuForChildren,
          outdoorSeating: details.outdoorSeating,
          acceptsCashOnly: details.acceptsCashOnly,
          acceptsCreditCards: details.acceptsCreditCards,
          acceptsDebitCards: details.acceptsDebitCards,
          priceLevel: details.priceLevel,
          primaryTypeDisplayName: details.primaryTypeDisplayName,
          googleRating: details.googleRating,
          servesCoffee: details.servesCoffee,
          servesDessert: details.servesDessert,
          takeout: details.takeout,
          restroom: details.restroom,
          openNow: details.openNow,
          userRatingCount: details.userRatingCount,
        },
      });

      if (details.reviews.length > 0) {
        await prisma.review.createMany({
          data: details.reviews.map((review) => ({
            ...review,
            placeId: details.id,
          })),
        });
      }
    }

    // Check if the user has already rated this place
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: place.id,
        },
      },
    });

    let action: 'added' | 'removed' | 'updated';
    let rating: Rating | null = null;

    // If rating exists, check if the rating is being updated or removed
    if (existingRating) {
      log.debug('[RATING] Prior rating exists');

      // If rating is not provided, remove the rating
      if (!userRating || isNull(userRating) || isUndefined(userRating)) {
        log.debug('[RATING] Rating is being removed');
        rating = await prisma.rating.delete({
          where: { id: existingRating.id },
        });
        action = 'removed';
      }
      // If rating is being updated to the same rating, delete the rating
      else if (existingRating.rating === toNumber(userRating)) {
        log.debug('[RATING] Rating is being removed');
        rating = await prisma.rating.delete({
          where: { id: existingRating.id },
        });
        action = 'removed';
      }
      // If rating is being updated to a different rating, update the rating
      else {
        log.debug('[RATING] Rating is being updated');
        rating = await prisma.rating.update({
          where: { id: existingRating.id },
          data: { rating: toNumber(userRating) },
        });
        action = 'updated';
      }
    }
    // If rating doesn't exist, create it
    else {
      log.debug('[RATING] Rating does not exist, creating it');

      // If rating doesn't exist, create it (toggle on)
      if (!userRating) {
        return NextResponse.json(
          { error: 'Rating is required' },
          { status: 400 }
        );
      }

      rating = await prisma.rating.create({
        data: {
          userId: user.id,
          placeId: place.id,
          rating: toNumber(userRating),
        },
      });

      action = 'added';
    }

    return NextResponse.json(
      {
        message:
          action === 'added'
            ? 'Rating added'
            : action === 'updated'
            ? 'Rating updated'
            : 'Rating removed',
        place,
        rating,
        action,
      },
      { status: 200 }
    );
  } catch (error) {
    log.error('[RATING] Failed to process rating', { error });
    return NextResponse.json(
      { error: 'Failed to process rating' },
      { status: 500 }
    );
  }
}
