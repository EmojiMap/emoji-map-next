import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/services/user/get-user-id';
import type { ErrorResponse } from '@/types/error-response';
import type { UserResponse } from '@/types/user';
import { log } from '@/utils/log';

export async function GET(
  request: NextRequest
): Promise<NextResponse<UserResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // check if user exists in our database
    log.info(`Looking for user ${userId} in database...`);

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          favorites: true,
          ratings: true,
        },
      });

      if (!dbUser) {
        log.error(`User ${userId} not found in database`);
        return NextResponse.json(
          {
            error: 'User not found in database',
            userId: userId,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      log.info(`User ${userId} found, returning data`);
      // Make sure we're returning the exact structure expected by the Zod schema
      return NextResponse.json(
        {
          user: dbUser,
        },
        {
          status: 200,
        }
      );
    } catch (dbError) {
      log.error('Database error when fetching user:', dbError);
      return NextResponse.json(
        {
          error: 'Database error',
          message:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('Unexpected error in /api/user:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

type DeleteUserResponse = {
  message: string;
  userId: string;
  timestamp: string;
};

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<DeleteUserResponse | ErrorResponse>> {
  try {
    const userId = await getUserId(request);

    // check if user exists in our database
    log.info(`Looking for user ${userId} in database...`);

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!dbUser) {
        log.error(`User ${userId} not found in database`);
        return NextResponse.json(
          {
            error: 'User not found in database',
            userId: userId,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      // delete user from clerk
      const client = await clerkClient();
      await client.users.deleteUser(userId);

      return NextResponse.json(
        {
          message: 'User deleted successfully',
          userId: userId,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (dbError) {
      log.error('Database error when fetching user:', dbError);
      return NextResponse.json(
        {
          error: 'Database error',
          message:
            dbError instanceof Error
              ? dbError.message
              : 'Unknown database error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('Unexpected error in /api/user/delete:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    const { email, firstName, lastName } = await request.json();

    const client = await clerkClient();
    // update email first
    await client.emailAddresses.createEmailAddress({
      userId,
      emailAddress: email,
      primary: true,
      verified: true,
    });

    // update name if provided
    if (firstName || lastName) {
      await client.users.updateUser(userId, {
        firstName,
        lastName,
      });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      userId: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Unexpected error in /api/user/patch:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
