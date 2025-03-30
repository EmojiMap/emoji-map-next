import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import type { AdminClerkUsersResponse } from '@/types/admin-clerk-users';
import type { ErrorResponse } from '@/types/error-response';

export async function GET(
  request: NextRequest
): Promise<NextResponse<AdminClerkUsersResponse | ErrorResponse>> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user?.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get pagination parameters from query string
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const query = searchParams.get('query')?.trim();

  try {
    const client = await clerkClient();

    // If there's a search query, use Clerk's query parameter
    const response = await client.users.getUserList({
      limit,
      offset,
      ...(query && {
        query, // Clerk's API will search across userId, emailAddress, phoneNumber, username, firstName and lastName.
        orderBy: '-created_at', // Most recent first to find newer matches
      }),
    });

    return NextResponse.json({
      users: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
