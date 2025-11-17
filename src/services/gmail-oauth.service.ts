import * as Sentry from '@sentry/nextjs';
import { google } from 'googleapis';

import {
  EmailErrorCode,
  type EmailServiceError,
  type GoogleOAuthError,
} from 'src/types/email.types';

const OAuth2 = google.auth.OAuth2;

class GmailOAuthService {
  constructor() {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google OAuth env vars: GOOGLE_CLIENT_ID/SECRET');
    }
  }

  /**
   * Generates URL for Gmail authorization via Google OAuth 2.0
   * @param redirectUri - URL to redirect to after authorization
   * @param state - Optional state parameter for passing data (e.g., return URL)
   * @returns Authorization URL
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    const oauth2Client = this.createOAuth2Client({ redirectUri });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
      state: state,
    });

    return authUrl;
  }

  /**
   * Exchanges authorization code for tokens
   * @param code - Authorization code from Google
   * @param redirectUri - Redirect URL (must match the one specified when generating authUrl)
   * @returns Object with tokens and user information
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{
    refreshToken: string | null | undefined;
    accessToken: string | null | undefined;
    email: string | null | undefined;
  }> {
    const oauth2Client = this.createOAuth2Client({ redirectUri });

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify that user granted the necessary gmail.send permission
    const grantedScopes = tokens.scope?.split(' ') || [];
    const hasGmailSendPermission = grantedScopes.includes(
      'https://www.googleapis.com/auth/gmail.send',
    );

    if (!hasGmailSendPermission) {
      throw new Error(
        'Gmail send permission not granted. User must approve sending emails on their behalf.',
      );
    }

    // Get user information
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();

    return {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      email: userInfo.data.email,
    };
  }

  /**
   * Revokes OAuth token from Google
   * @param refreshToken - Refresh token to revoke
   * @returns Promise<void>
   */
  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const oauth2Client = this.createOAuth2Client({ refreshToken });
      await oauth2Client.revokeToken(refreshToken);
      console.log('Google token revoked successfully');
    } catch (error) {
      console.error('Error revoking Google token:', error);

      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          feature: 'gmail-oauth',
          service: 'GmailOAuthService',
          method: 'revokeToken',
        },
      });

      throw error;
    }
  }

  /**
   * Gets access token from refresh token
   * @param refreshToken - Refresh token to get access token
   * @returns Access token
   */
  async getAccessToken(
    refreshToken: string,
  ): Promise<string | undefined | null> {
    try {
      const oauth2Client = this.createOAuth2Client({ refreshToken });
      const accessToken = await oauth2Client.getAccessToken();

      console.log('Access token obtained successfully');

      return accessToken.token;
    } catch (error: unknown) {
      console.error('Error getting access token:', error);

      // Log to Sentry before throwing error
      Sentry.captureException(error, {
        tags: {
          feature: 'gmail-oauth',
          service: 'GmailOAuthService',
          method: 'getAccessToken',
        },
      });

      this.handleOAuthError(error);
    }
  }

  /**
   * Checks if error is related to expired refresh token
   * and converts it to EmailServiceError.
   *
   * According to Google OAuth 2.0 documentation:
   * https://developers.google.com/identity/protocols/oauth2
   * invalid_grant error can mean:
   * 1. Revoked refresh token
   * 2. Expired refresh token (not used for 6 months)
   * 3. Session management policy (error_subtype: "invalid_rapt")
   */
  private handleOAuthError(error: unknown): never {
    const err = error as GoogleOAuthError;

    const isInvalidGrant =
      err?.response?.data?.error === 'invalid_grant' ||
      err?.message?.includes('invalid_grant');
    const isTokenExpired = err?.message?.includes(
      'Token has been expired or revoked',
    );
    const isUnauthorized =
      err?.response?.status === 400 || err?.response?.status === 401;

    if (isInvalidGrant || isTokenExpired || isUnauthorized) {
      const errorSubtype = err?.response?.data?.error_subtype;
      const errorDescription = err?.response?.data?.error_description;

      let message = 'Google refresh token expired or revoked.';

      // Distinguish error types according to documentation
      if (errorSubtype === 'invalid_rapt') {
        message =
          'Session expired due to Google Cloud session management policy. User needs to re-authenticate.';
      } else if (errorDescription) {
        message = errorDescription;
      }

      const emailError: EmailServiceError = {
        code: EmailErrorCode.REFRESH_TOKEN_EXPIRED,
        message: `${message} Please reconnect your Gmail account.`,
        originalError: error,
      };

      throw emailError;
    }

    // For other errors, throw original error
    throw error;
  }

  /**
   * Creates and configures OAuth2 client for working with Google API
   * @param options - Optional parameters
   * @param options.refreshToken - Refresh token to set credentials
   * @param options.redirectUri - Redirect URI
   */
  private createOAuth2Client(options?: {
    refreshToken?: string;
    redirectUri?: string;
  }) {
    const oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      options?.redirectUri,
    );

    if (options?.refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: options.refreshToken,
      });
    }

    return oauth2Client;
  }
}

const gmailOAuthService = new GmailOAuthService();

export default gmailOAuthService;
