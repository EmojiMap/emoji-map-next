import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { env } from '@/env';
import { prisma } from '@/lib/db';
import type { DetailResponse } from '@/types/details';
import type { ErrorResponse } from '@/types/error-response';

// Types for consistent response structure
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const MerchantSchema = z.object({
  placeId: z.string().min(1, 'Place ID cannot be empty'),
});

async function fetchPlaceDetails(
  placeId: string
): Promise<DetailResponse['data']> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_SITE_URL}/api/places/details?id=${placeId}`
  );

  if (!response.ok) {
    const errorData = (await response.json()) as ErrorResponse;
    throw new Error(errorData.error || 'Failed to fetch place details');
  }

  const data = (await response.json()) as DetailResponse;
  return data.data;
}

function createApiResponse<T>(
  data?: T,
  error?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: !error,
      ...(data && { data }),
      ...(error && { error }),
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request parameters
    const params = await request.json();
    const validatedParams = MerchantSchema.safeParse(params);

    if (!validatedParams.success) {
      return createApiResponse(
        undefined,
        'Invalid parameters: ' +
          validatedParams.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { placeId } = validatedParams.data;

    // 2. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return createApiResponse(undefined, 'Unauthorized', 401);
    }

    // 3. Process the request within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if place exists and if it already has a merchant
      let place = await tx.place.findUnique({
        where: { id: placeId },
        include: {
          photos: true,
          ratings: true,
          reviews: true,
          favorites: true,
        },
      });

      if (!place) {
        const placeDetails = await fetchPlaceDetails(placeId);
        place = await tx.place.upsert({
          where: { id: placeId },
          create: {
            id: placeId,
            name: placeDetails.displayName,
            description: placeDetails.editorialSummary,
            latitude: placeDetails.location.latitude,
            longitude: placeDetails.location.longitude,
            reviews: {
              createMany: {
                data: placeDetails.reviews
                  .map((review) => ({
                    name: review.name,
                    relativePublishTimeDescription:
                      review.relativePublishTimeDescription,
                    rating: review.rating,
                    text: review.text?.text || '',
                  }))
                  .filter((review) => Boolean(review.text)),
              },
            },
          },
          update: {}, // No updates needed if it exists
          include: {
            photos: true,
            ratings: true,
            reviews: true,
            favorites: true,
          },
        });
      }

      // Check if place already has a merchant by checking merchantId
      if (place?.merchantId) {
        // Fetch the merchant details to get the user info
        const existingMerchant = await tx.merchant.findUnique({
          where: { id: place.merchantId },
          include: {
            user: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        });

        if (existingMerchant) {
          throw new Error(
            `This place is already claimed by ${
              existingMerchant.user.username || existingMerchant.user.email
            }`
          );
        }
      }

      // Get existing merchant record for the user if it exists
      const existingMerchant = await tx.merchant.findUnique({
        where: { userId },
        include: {
          places: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      // Create or update merchant
      const merchant = existingMerchant
        ? await tx.merchant.update({
            where: { id: existingMerchant.id },
            data: {
              places: {
                connect: { id: placeId },
              },
            },
            include: {
              places: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          })
        : await tx.merchant.create({
            data: {
              userId,
              places: {
                connect: { id: placeId },
              },
            },
            include: {
              places: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          });

      return merchant;
    });

    return createApiResponse({ merchant: result });
  } catch (error) {
    console.error('Error in merchant/associate:', error);

    if (error instanceof Error) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('Unauthorized')
        ? 401
        : error.message.includes('already claimed')
        ? 409
        : 500;

      return createApiResponse(undefined, error.message, status);
    }

    return createApiResponse(undefined, 'Internal server error', 500);
  }
}
