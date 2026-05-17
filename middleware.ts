// Clerk auth is imported but not active yet — advisor dashboard is a future feature.
// /advisor routes return 404 until Clerk env vars are configured and the dashboard is ready.
import { NextRequest, NextResponse } from 'next/server';

const isAdvisorRoute = /^\/advisor(\/|$)/;

export default function middleware(req: NextRequest) {
  if (isAdvisorRoute.test(req.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
