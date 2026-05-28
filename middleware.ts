import { NextRequest, NextResponse } from 'next/server';

// All routes are open — Clerk auth is wired in app/advisor/layout.tsx
// when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
