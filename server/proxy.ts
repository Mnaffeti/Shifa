import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS for the Vite frontend.
 *
 * Credentialed requests (we send the session cookie) forbid a `*` origin, so
 * the response must name one exact origin. Vite's port isn't stable — it takes
 * 3000, or 3001 when 3000 is busy — so a static value in next.config.ts breaks
 * whenever the port shifts. Here we echo the caller's origin, but only if it
 * appears in the allow-list.
 *
 * ALLOWED_ORIGIN accepts a comma-separated list; localhost:3000-3002 are
 * always permitted in development so the app works on whichever port Vite
 * happens to pick.
 *
 * Note: `proxy.ts` is the Next.js 16 convention — `middleware.ts` is deprecated.
 */

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

function allowedOrigins(): string[] {
  const configured = (process.env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return process.env.NODE_ENV === 'production'
    ? configured
    : [...new Set([...configured, ...DEV_ORIGINS])];
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    // Caches must key on Origin, or one origin's response could be served
    // to another.
    Vary: 'Origin',
  };
}

export function proxy(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

  // Answer the preflight here; it never needs to reach a route handler.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
