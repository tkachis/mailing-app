import { type NextRequest } from 'next/server';
import { middleware as nextGlobeGenMiddleware } from 'next-globe-gen/middleware';

import supabaseService from 'src/services/supabase.service';

export async function middleware(request: NextRequest) {
  const i18nResponse = nextGlobeGenMiddleware(request);

  if (i18nResponse && i18nResponse.status === 307) {
    return i18nResponse;
  }

  return await supabaseService.updateSessionMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known (well-known files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known).*)',
  ],
};
