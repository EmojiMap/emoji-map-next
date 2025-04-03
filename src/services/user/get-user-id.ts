import type { NextRequest } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { env } from '@/env';
import { log } from '@/utils/log';

export async function getUserId(request: NextRequest) {
  try {
    // First check if userId is directly available in the request
    const directUserId = request.headers.get('x-user-id');
    if (directUserId) {
      log.info('Using direct userId from request headers');
      return directUserId;
    }

    // Then try to get the authorization header directly
    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      authHeader = request.headers.get('Authorization');
    }

    // If not found, check the Vercel-specific header
    if (!authHeader) {
      const vercelHeaders = request.headers.get('x-vercel-sc-headers');
      if (vercelHeaders) {
        try {
          const headers = JSON.parse(vercelHeaders);
          authHeader = headers.Authorization;
        } catch (error) {
          log.error('Failed to parse x-vercel-sc-headers:', error);
        }
      }
    }

    if (!authHeader) {
      log.error(
        'Unauthorized: No authorization header provided in any location'
      );
      throw new Error('Unauthorized: Missing authorization header');
    }

    // Check if the authorization header has the right format
    if (!authHeader.startsWith('Bearer ')) {
      log.error('Unauthorized: Invalid authorization header format');
      throw new Error('Unauthorized: Invalid authorization header format');
    }

    // Extract the token
    const token = authHeader.substring(7); // Skip 'Bearer '
    if (!token || token.trim() === '') {
      log.error('Unauthorized: Empty token provided');
      throw new Error('Unauthorized: Empty token provided');
    }

    try {
      const client = createClerkClient({
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      });

      const authResult = await client.authenticateRequest(request);
      const auth = authResult.toAuth();
      log.info('auth', { auth });
      const userId = authResult.toAuth()?.userId;

      if (!userId) {
        log.error('Unauthorized: Valid token but no userId returned');
        throw new Error(
          'Unauthorized: Authentication successful but no user ID found'
        );
      }

      return userId;
    } catch (clerkError) {
      log.error('Clerk authentication error:', clerkError);
      throw new Error(
        `Unauthorized: Authentication failed - ${
          clerkError instanceof Error
            ? clerkError.message
            : 'Unknown clerk error'
        }`
      );
    }
  } catch (error) {
    log.error('Error in getUserId:', {
      error,
      request,
    });
    throw error;
  }
}
