// This middleware gates access to the Plansparency site.
//
// Two rules:
// 1. "Always private" — /advisor/* and /api/save-plan always require the
//    advisor Basic Auth password, no matter what SITE_PUBLIC is set to.
// 2. "Site open" switch — every other path is locked behind the same
//    password UNLESS process.env.SITE_PUBLIC === 'true'. Missing or any
//    other value keeps the site closed (fail-closed). This exists because
//    compliance (OBA) approval hasn't been granted yet (Sept 2026); once it
//    has, set SITE_PUBLIC=true in Vercel env vars and redeploy — no code
//    change needed to reopen the site.
//
// /api/keepalive is excluded via the matcher below so the daily Vercel cron
// can reach it without a password.

import { NextRequest, NextResponse } from 'next/server';

function unauthorized(): NextResponse {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Plansparency Advisor"' },
  });
}

export function middleware(req: NextRequest) {
  const password = process.env.ADVISOR_ACCESS_PASSWORD;

  if (!password) {
    return unauthorized();
  }

  const { pathname } = req.nextUrl;
  const alwaysPrivate =
    pathname.startsWith('/advisor') || pathname === '/api/save-plan';

  if (!alwaysPrivate && process.env.SITE_PUBLIC === 'true') {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    const encoded = authHeader.slice(6);
    let decoded: string;
    try {
      decoded = atob(encoded);
    } catch {
      return unauthorized();
    }
    const colonIndex = decoded.indexOf(':');
    const submitted = colonIndex >= 0 ? decoded.slice(colonIndex + 1) : decoded;
    if (submitted === password) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

export const config = {
  matcher: ['/((?!api/keepalive|_next/static|_next/image|favicon.ico).*)'],
};
