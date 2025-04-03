import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchPlacePhotos } from '@/services/places/photos/fetch-place-photos/fetch-place-photos';
import { getSearchParams } from '@/services/places/photos/get-search-params/getSearchParams';
import type { ErrorResponse } from '@/types/error-response';
import type { PhotosResponse } from '@/types/google-photos';
import { log } from '@/utils/log';

/**
 * API route handler for fetching place photos.
 *
 * This endpoint retrieves photos for a specific place from Google Places API.
 * It supports caching to improve performance and reduce API calls.
 *
 * @param request - The NextRequest object containing the request details
 *
 * @returns A NextResponse containing either:
 *          - A PhotosResponse object with the photos data
 *          - An ErrorResponse object if an error occurs
 *
 * @example
 * // Basic usage
 * GET /api/places/photos?id=ChIJN1t_tDeuEmsRUsoyG83frY4
 *
 * @example
 * // With limit parameter
 * GET /api/places/photos?id=ChIJN1t_tDeuEmsRUsoyG83frY4&limit=5
 *
 * @example
 * // Bypass cache (any of these formats works)
 * GET /api/places/photos?id=ChIJN1t_tDeuEmsRUsoyG83frY4&bypassCache
 * GET /api/places/photos?id=ChIJN1t_tDeuEmsRUsoyG83frY4&bypassCache=true
 * GET /api/places/photos?id=ChIJN1t_tDeuEmsRUsoyG83frY4&bypassCache=TRUE
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<PhotosResponse | ErrorResponse>> {
  try {
    const { id, limit, bypassCache } = getSearchParams(request);

    const photos = await fetchPlacePhotos({ id, limit, bypassCache });

    return NextResponse.json(photos);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('No photos found')
      ? 404
      : message.includes('Missing')
      ? 400
      : 500;

    log.error(`[API] Error in photos route`, { error });
    return NextResponse.json({ error: message }, { status });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// TODO: cache photos by place id
