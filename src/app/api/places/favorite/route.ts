import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/db';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';
import type { Favorite, Place } from '@prisma/client';

type FavoriteResponse = {
  message: string;
  favorite: Favorite | null;
  action: 'added' | 'removed';
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<FavoriteResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // Find the user by id
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      log.error('User not found', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await request.json();
    const placeId = params?.placeId;

    if (!placeId) {
      log.error('Place ID is required');
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
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
      log.debug('Favorite exists, removing it');
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });

      action = 'removed';
    }
    // If favorite doesn't exist, create it (toggle on)
    else {
      log.debug('Favorite does not exist, creating it');
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
    log.error('Failed to process favorite', { error });
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
