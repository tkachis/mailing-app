import {
  createBrowserClient as supabaseCreateBrowserClient,
  createServerClient as supabaseCreateServerClient,
} from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import { Routes } from 'src/configs';

class SupabaseService {
  createBrowserClient() {
    return supabaseCreateBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  async createServerClient() {
    const cookieStore = await cookies();

    return supabaseCreateServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );
  }

  async updateSessionMiddleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const notAuthorized = !user;
    const pathname = request.nextUrl.pathname;

    // Check routes with locale prefix using regex
    const isAuthRoute = new RegExp(
      `^\\/(en|pl|ru)${Routes.auth().replace('/', '\\/')}`,
    ).test(pathname);
    const isErrorRoute = new RegExp(
      `^\\/(en|pl|ru)${Routes.error().replace('/', '\\/')}`,
    ).test(pathname);
    const isUnsubscribeRoute = new RegExp(
      `^\\/(en|pl|ru)${Routes.unsubscribe().replace('/', '\\/')}`,
    ).test(pathname);

    const shouldRedirectToLogin =
      notAuthorized && !isAuthRoute && !isErrorRoute && !isUnsubscribeRoute;

    if (shouldRedirectToLogin) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone();
      url.pathname = Routes.login();
      return NextResponse.redirect(url);
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
  }
}

const supabaseService = new SupabaseService();

export default supabaseService;
