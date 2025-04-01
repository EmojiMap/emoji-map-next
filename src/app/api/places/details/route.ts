import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DETAILS_CONFIG } from '@/constants/details';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { generateCacheKey } from '@/services/places/details/generate-cache-key/generate-cache-key';
import { getSearchParams } from '@/services/places/details/get-search-params/get-search-params';
import { transformDbPlaceToGoogleDetails } from '@/services/places/details/transformers/db-place-to-google-details';
import { transformGoogleDetailsToDbPlace } from '@/services/places/details/transformers/google-details-to-db-place';
import type { Detail, DetailResponse } from '@/types/details';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';

export async function GET(
  request: NextRequest
): Promise<NextResponse<DetailResponse | ErrorResponse>> {
  try {
    const { id, bypassCache } = getSearchParams(request);
    const cacheKey = generateCacheKey({ id });

    if (!bypassCache && cacheKey) {
      const cachedData = await redis.get<Detail>(cacheKey);

      if (cachedData) {
        log.success(`[DETAILS] Cache hit`);

        return NextResponse.json({
          data: cachedData,
          cacheHit: true,
          count: 1,
        });
      }

      log.debug(`[DETAILS] Cache miss`);
    }

    const place = await prisma.place.findUnique({
      where: {
        id,
      },
      include: {
        reviews: true,
      },
    });

    if (place) {
      log.info(`[DETAILS] found place in db`);

      const details = transformDbPlaceToGoogleDetails(place);

      await redis.set(cacheKey, details, {
        ex: DETAILS_CONFIG.CACHE_EXPIRATION_TIME,
      });

      log.info(`[DETAILS] cache set`);

      return NextResponse.json({
        data: details,
        cacheHit: false,
        count: 1,
      });
    }

    log.info(`[DETAILS] place not found in db`);

    const details = await fetchDetails(id);

    log.info(`[DETAILS] fetched details from google`);

    const { place: dbPlace, reviews: dbReviews } =
      transformGoogleDetailsToDbPlace(details);

    await prisma.place.create({
      data: dbPlace,
    });

    if (dbReviews.length > 0) {
      await prisma.review.createMany({
        data: dbReviews.map((review) => ({
          ...review,
          placeId: dbPlace.id,
        })),
      });
    }

    // get latest place + reviews from prisma
    const updatedPlace = await prisma.place.findUnique({
      where: {
        id,
      },
      include: { reviews: true },
    });

    if (!updatedPlace) {
      throw new Error('Updated Place not found, Whoopsie');
    }

    const updatedDetails = transformDbPlaceToGoogleDetails(updatedPlace);

    await redis.set(cacheKey, updatedDetails, {
      ex: DETAILS_CONFIG.CACHE_EXPIRATION_TIME,
    });

    log.info(`[DETAILS] cache set`);

    return NextResponse.json({
      data: updatedDetails,
      cacheHit: false,
      count: 1,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch place details', message: String(error) },
      { status: 500 }
    );
  }
}
