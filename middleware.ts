import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isAdvisorRoute = createRouteMatcher(['/advisor(.*)']);

// When Clerk keys are not set (local dev without keys), skip auth entirely
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default clerkKey
  ? clerkMiddleware((auth, req) => {
      if (isAdvisorRoute(req)) {
        auth().protect();
      }
    })
  : (_req: NextRequest) => NextResponse.next();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
