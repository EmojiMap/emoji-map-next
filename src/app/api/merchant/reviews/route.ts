import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Validate each review update
const reviewUpdateSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  status: z.enum(['DEFAULT', 'HIDDEN', 'FEATURED'] as const),
});

// Validate the request body as an array of updates
const updateReviewsSchema = z.object({
  updates: z
    .array(reviewUpdateSchema)
    .min(1, 'At least one review update is required'),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { updates } = updateReviewsSchema.parse(body);

    // Update all reviews in a transaction
    const updatedReviews = await prisma.$transaction(
      updates.map(({ reviewId, status }) =>
        prisma.review.update({
          where: { id: reviewId },
          data: { status },
          select: {
            id: true,
            status: true,
            updatedAt: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updatedReviews,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error updating reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reviews',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
