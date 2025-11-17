import * as Sentry from '@sentry/nextjs';
import nodemailer from 'nodemailer';

import {
  EmailErrorCode,
  isEmailServiceError,
  type EmailServiceError,
  type GmailOAuthAuth,
  type SendEmailData,
} from 'src/types/email.types';

class EmailService {
  constructor() {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google OAuth env vars: GOOGLE_CLIENT_ID/SECRET');
    }
  }

  async verifyEmail(_email: string): Promise<boolean> {
    // TODO: Implement email verification
    console.log('Email verification not yet implemented for:', _email);
    return true;
  }

  private async createTransport(auth: GmailOAuthAuth) {
    const { email, refreshToken, accessToken } = auth;

    if (!refreshToken) {
      throw new Error('Refresh token is required to create sending transport');
    }

    // const accessToken = await gmailOAuthService.getAccessToken(refreshToken);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: refreshToken!,
        accessToken: accessToken ?? '',
      },
    });

    return transporter;
  }

  /**
   * Sends an email using configured SMTP transport.
   * @param auth - Object with authentication data.
   * @param data - Object with email sending data.
   * @returns {Promise<string>} ID of sent message.
   * @throws {EmailServiceError} If refresh token expired or other error occurred.
   */
  async send(auth: GmailOAuthAuth, data: SendEmailData): Promise<string> {
    try {
      const transporter = await this.createTransport(auth);

      const info = await transporter.sendMail({
        from: auth.email,
        to: data.to,
        subject: data.subject,
        html: data.html,
        attachments: data.attachments,
      });

      console.log('Message sent: %s', info.messageId);
      return info.messageId;
    } catch (error) {
      // Throw EmailServiceError further for handling at higher level
      if (
        isEmailServiceError(error) &&
        error.code === EmailErrorCode.REFRESH_TOKEN_EXPIRED
      ) {
        console.error('Gmail token expired for user:', auth.email);

        // Log to Sentry - this is an important event
        Sentry.captureException(error, {
          level: 'warning',
          tags: {
            feature: 'email',
            service: 'EmailService',
            method: 'send',
            error_type: 'token_expired',
          },
          extra: {
            userEmail: auth.email,
          },
        });

        throw error;
      }

      // For other errors, log and throw EmailServiceError
      console.error('Error sending email:', error);

      const emailError: EmailServiceError = {
        code: EmailErrorCode.SEND_FAILED,
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error,
      };

      // Log critical sending error to Sentry
      Sentry.captureException(emailError, {
        tags: {
          feature: 'email',
          service: 'EmailService',
          method: 'send',
          error_type: 'send_failed',
        },
        extra: {
          userEmail: auth.email,
          recipient: data.to,
          subject: data.subject,
        },
      });

      throw emailError;
    }
  }
}

const emailService = new EmailService();

export default emailService;
