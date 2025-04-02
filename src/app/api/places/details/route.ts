import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DETAILS_CONFIG } from '@/constants/details';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { fetchDetails } from '@/services/places/details/fetch-details/fetch-details';
import { generateCacheKey } from '@/services/places/details/generate-cache-key/generate-cache-key';
import { getSearchParams } from '@/services/places/details/get-search-params/get-search-params';
import type { DetailResponse } from '@/types/details';
import type { ErrorResponse } from '@/types/error-response';
import { log } from '@/utils/log';

export async function GET(
  request: NextRequest
): Promise<NextResponse<DetailResponse | ErrorResponse>> {
  try {
    const { id, bypassCache } = getSearchParams(request);
    const cacheKey = generateCacheKey({ id });

    if (!bypassCache && cacheKey) {
      const cachedData = await redis.get<DetailResponse['data']>(cacheKey);

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

      await redis.set(cacheKey, place, {
        ex: DETAILS_CONFIG.CACHE_EXPIRATION_TIME,
      });

      log.info(`[DETAILS] cache set`);

      return NextResponse.json({
        data: place,
        cacheHit: false,
        count: 1,
      });
    }

    log.info(`[DETAILS] place not found in db`);

    const details = await fetchDetails(id);

    log.info(`[DETAILS] fetched details from google`);

    await prisma.place.create({
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

    // get updated place with reviews
    const placesWithReviews = await prisma.place.findUnique({
      where: {
        id,
      },
      include: {
        reviews: true,
      },
    });

    if (!placesWithReviews) {
      log.error(`[DETAILS] updated place not found in db`);
      return NextResponse.json(
        { error: 'Place not found in db', message: 'Place not found in db' },
        { status: 404 }
      );
    }

    await redis.set(cacheKey, placesWithReviews, {
      ex: DETAILS_CONFIG.CACHE_EXPIRATION_TIME,
    });

    log.info(`[DETAILS] cache set`);

    return NextResponse.json({
      data: placesWithReviews,
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
