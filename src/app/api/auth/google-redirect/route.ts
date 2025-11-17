import * as Sentry from '@sentry/nextjs';
import { type NextRequest } from 'next/server';
import { redirect } from 'next-globe-gen';

import { Routes } from 'src/configs';
import { accountEmailsRepository } from 'src/db/repositories';
import { gmailOAuthService, supabaseService } from 'src/services';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // Google OAuth returns state parameter which we used to pass return URL
  const state = searchParams.get('state');
  const next = state ?? Routes.home();

  if (code) {
    try {
      // Get currently authorized user
      const supabase = await supabaseService.createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error('User not authenticated');
        const url = new URL(Routes.login(), process.env.NEXT_PUBLIC_APP_URL);
        url.searchParams.set('error', 'unauthorized');
        return redirect(url.toString());
      }

      // Exchange code for tokens via googleapis directly
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-redirect`;
      const { refreshToken, email } =
        await gmailOAuthService.exchangeCodeForTokens(code, redirectUri);

      if (!refreshToken || !email) {
        console.error('Failed to get refresh token or email from Google');
        const url = new URL(next, process.env.NEXT_PUBLIC_APP_URL);
        url.searchParams.set('error', 'auth_error');
        return redirect(url.toString());
      }

      // Create or update email address for sending
      const existingEmail = await accountEmailsRepository.getByEmail(email);

      if (existingEmail) {
        // Update existing email
        await accountEmailsRepository.update(existingEmail.id, {
          googleRefreshToken: refreshToken,
          isActive: true,
        });
      } else {
        // Create new email address linked to current user
        await accountEmailsRepository.create({
          accountId: user.id,
          email: email,
          providerType: 'gmail',
          googleRefreshToken: refreshToken,
          isActive: true,
        });
      }
    } catch (error) {
      // Error handling
      console.error('Error in Google OAuth callback:', error);

      // Check if user denied permission to send emails
      const isPermissionDenied =
        error instanceof Error &&
        error.message.includes('Gmail send permission not granted');

      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          feature: 'google-oauth',
          route: '/api/auth/google-redirect',
          method: 'GET',
          permissionDenied: isPermissionDenied,
        },
        extra: {
          hasCode: !!code,
          state,
        },
      });

      // If user didn't grant permission, show specific error
      const errorParam = isPermissionDenied
        ? 'permission_denied'
        : 'auth_error';
      const url = new URL(next, process.env.NEXT_PUBLIC_APP_URL);
      url.searchParams.set('error', errorParam);
      return redirect(url.toString());
    }

    // Successful completion - redirect user back
    const successUrl = new URL(next, process.env.NEXT_PUBLIC_APP_URL);
    return redirect(successUrl.toString());
  }

  // Redirect user to home page if code is not found
  const homeUrl = new URL(Routes.home(), process.env.NEXT_PUBLIC_APP_URL);
  return redirect(homeUrl.toString());
}
