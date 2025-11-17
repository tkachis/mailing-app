import { z } from 'zod';

export type SendEmailData = {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Attachment[];
  headers?: Record<string, string>;
};

export type Attachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
};

export type GmailOAuthAuth = {
  email: string;
  refreshToken: string | null;
  accessToken: string | null;
};

export type BasicSmtpAuth = {
  kind: 'basic';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

export type MailTransportAuth = GmailOAuthAuth | BasicSmtpAuth;

// Google OAuth API Error Response Structure
export type GoogleOAuthError = {
  response?: {
    status?: number;
    data?: {
      error?: string;
      error_description?: string;
      error_subtype?: string;
    };
  };
  message?: string;
};

// Email Service Error Codes
export enum EmailErrorCode {
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  SEND_FAILED = 'SEND_FAILED',
  TRANSPORT_ERROR = 'TRANSPORT_ERROR',
}

// Zod Schema for EmailServiceError
export const EmailServiceErrorSchema = z.object({
  code: z.enum(Object.values(EmailErrorCode)),
  message: z.string(),
  originalError: z.any().optional(),
});

// Email Service Error Type
export type EmailServiceError = z.infer<typeof EmailServiceErrorSchema>;

// Type guard for checking EmailServiceError (using Zod)
export function isEmailServiceError(
  error: unknown,
): error is EmailServiceError {
  return EmailServiceErrorSchema.safeParse(error).success;
}
