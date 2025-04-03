import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { getSearchParams } from '@/services/places/details/get-search-params/get-search-params';
import type { DetailResponse } from '@/types/details';
import type { ErrorResponse } from '@/types/error-response';

export async function GET(
  request: NextRequest
): Promise<NextResponse<DetailResponse | ErrorResponse>> {
  try {
    const { id, bypassCache } = getSearchParams(request);
    const details = await getPlaceDetailsWithCache({ id, bypassCache });

    // Send event to create place if it doesn't exist
    // without blocking the response
    inngest.send({
      name: 'places/create',
      data: {
        id,
        details,
      },
    });

    return NextResponse.json(details);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch place details', message: String(error) },
      { status: 500 }
    );
  }
}
