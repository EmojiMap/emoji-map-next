import { NextResponse } from 'next/server';
import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server';

// Create a route matcher for public routes
const isPublic = createRouteMatcher([
  '/',
  '/api/webhooks/clerk(.*)',
  '/api/places(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const isAdmin = createRouteMatcher(['/admin(.*)']);
const isMerchantDashboard = createRouteMatcher(['/merchant/dashboard(.*)']);

// Simple middleware configuration that allows public access to specified routes
export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) {
    return;
  }

  if (isAdmin(req) || isMerchantDashboard(req)) {
    const client = await clerkClient();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const user = await client.users.getUser(userId);
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!user?.publicMetadata?.admin) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
