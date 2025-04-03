import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import type { RatingResponse } from '@/types/admin-user-ratings';
import type { ErrorResponse } from '@/types/error-response';

export async function GET(
  request: Request
): Promise<NextResponse<RatingResponse | ErrorResponse>> {
  // Check if user is admin
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (!user?.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user ID from query params
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get all ratings for this user with place details
    const ratings = await prisma.rating.findMany({
      where: {
        userId,
      },
      include: {
        place: {
          select: {
            name: true,
            editorialSummary: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ratings,
      totalCount: ratings.length,
      limit: 10,
      offset: 0,
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
