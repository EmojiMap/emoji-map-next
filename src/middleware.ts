import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { env } from './env';

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
  return;

  if (isPublic(req)) {
    return;
  }

  const { orgId, orgRole } = await auth();

  if (isAdmin(req)) {
    if (orgId !== env.CLERK_ORG_ID || orgRole !== 'org:admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (isMerchantDashboard(req)) {
    if (orgId !== env.CLERK_ORG_ID || orgRole !== 'org:admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
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
