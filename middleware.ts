import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const password = process.env.ADVISOR_ACCESS_PASSWORD;

  if (!password) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Plansparency Advisor"' },
    });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Basic ')) {
    const encoded = authHeader.slice(6);
    let decoded: string;
    try {
      decoded = atob(encoded);
    } catch {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Plansparency Advisor"' },
      });
    }
    const colonIndex = decoded.indexOf(':');
    const submitted = colonIndex >= 0 ? decoded.slice(colonIndex + 1) : decoded;
    if (submitted === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Plansparency Advisor"' },
  });
}

export const config = {
  matcher: ['/advisor/:path*', '/api/save-plan'],
};
