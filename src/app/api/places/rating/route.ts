import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isNull, isUndefined } from 'lodash-es';
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/db';
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
      log.error('User not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await request.json();
    const placeId: string | undefined = params?.placeId;

    if (!placeId) {
      log.error('Place ID is required');
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    const userRating: number | undefined = params?.rating;

    if (!userRating) {
      log.error(
        'Rating not provided, if exiting rating found, it will be removed'
      );
    }

    // Check if this place exists in the database
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    // If place doesn't exist, create it
    if (!place) {
      log.debug('Place not found, creating it');
      await inngest.send({
        name: 'places/get-details',
        data: {
          id: placeId,
        },
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
      log.debug('Prior rating exists');

      // If rating is not provided, remove the rating
      if (!userRating || isNull(userRating) || isUndefined(userRating)) {
        log.debug('Rating is being removed');
        rating = await prisma.rating.delete({
          where: { id: existingRating.id },
        });
        action = 'removed';
      }
      // If rating is being updated to the same rating, delete the rating
      else if (existingRating.rating === userRating) {
        log.debug('Rating is being removed');
        rating = await prisma.rating.delete({
          where: { id: existingRating.id },
        });
        action = 'removed';
      }
      // If rating is being updated to a different rating, update the rating
      else {
        log.debug('Rating is being updated');
        rating = await prisma.rating.update({
          where: { id: existingRating.id },
          data: { rating: userRating },
        });
        action = 'updated';
      }
    }
    // If rating doesn't exist, create it
    else {
      log.debug('Rating does not exist, creating it');

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
    log.error('Failed to process rating', { error });
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the place exists
    const place = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!place) {
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
    log.error('Failed to get rating', { error });
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: 500 }
    );
  }
}
