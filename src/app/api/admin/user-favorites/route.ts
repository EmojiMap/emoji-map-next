import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import type { FavoriteResponse } from '@/types/admin-user-favorites';
import type { ErrorResponse } from '@/types/error-response';

export async function GET(
  request: Request
): Promise<NextResponse<FavoriteResponse | ErrorResponse>> {
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
    // Get all favorites for this user with place details
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        place: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      favorites,
      totalCount: favorites.length,
      limit: 10,
      offset: 0,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
