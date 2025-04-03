import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isNull, isUndefined } from 'lodash-es';
import { prisma } from '@/lib/db';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';
import type { Rating } from '@prisma/client';

type RatingResponse = {
  message: string;
  rating: Rating | null;
  action: 'added' | 'removed' | 'updated';
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<RatingResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      log.error('[RATING] User not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await request.json();
    const placeId: string | undefined = params?.placeId;

    if (!placeId) {
      log.error('[RATING] Place ID is required');
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    const userRating: number | undefined = params?.rating;

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

      log.debug('[RATING] Place created');

      if (details.data.reviews.length > 0) {
        log.debug('[RATING] Creating reviews for place');
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

    // Check if the user has already rated this place
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId,
        },
      },
    });

    let action: 'added' | 'removed' | 'updated';
    let rating: Rating | null = null;

    // If rating exists, check if the rating is being updated or removed
    if (existingRating) {
      log.debug('[RATING] Prior rating exists');

      // If rating is not provided, remove the rating
      if (isNull(userRating) || isUndefined(userRating)) {
        log.debug('[RATING] Rating is being removed');
        rating = await prisma.rating.delete({
          where: { id: existingRating.id },
        });
        action = 'removed';
      }
      // If rating is being updated to the same rating, delete the rating
      else if (existingRating.rating === userRating) {
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
          data: { rating: userRating },
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
          placeId,
          rating: userRating,
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

type GetRatingResponse = {
  rating: number | null;
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetRatingResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    const placeId = request.nextUrl.searchParams.get('id');

    if (!placeId) {
      log.error('[RATING] Place ID is required');
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      log.error('[RATING] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the place exists
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      log.error('[RATING] Place not found');
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // Check if the user has rated this place
    const rating = await prisma.rating.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId,
        },
      },
    });

    return NextResponse.json(
      { rating: rating?.rating ?? null },
      { status: 200 }
    );
  } catch (error) {
    log.error('[RATING] Failed to get rating', { error });
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: 500 }
    );
  }
}
