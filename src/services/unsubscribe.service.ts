import * as Sentry from '@sentry/nextjs';
import { SignJWT, jwtVerify } from 'jose';

import { type UnsubscribePayload } from 'src/types';

class UnsubscribeService {
  private readonly secret: Uint8Array;

  constructor() {
    const secretKey = process.env.UNSUBSCRIBE_SECRET;
    if (!secretKey) {
      throw new Error('Missing Unsubscribe secret (UNSUBSCRIBE_SECRET)');
    }
    this.secret = new TextEncoder().encode(secretKey);
  }

  async generate(accountEmailId: string, companyId: string): Promise<string> {
    const jwt = await new SignJWT({ accountEmailId, companyId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // Token expires in 30 days
      .sign(this.secret);
    return jwt;
  }

  async verify(token: string): Promise<UnsubscribePayload | null> {
    try {
      const { payload } = await jwtVerify<UnsubscribePayload>(
        token,
        this.secret,
      );
      if (payload.accountEmailId && payload.companyId) {
        return {
          accountEmailId: payload.accountEmailId,
          companyId: payload.companyId,
        };
      }
      return null;
    } catch (error) {
      // Log invalid tokens for security monitoring
      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          feature: 'unsubscribe',
          service: 'UnsubscribeService',
          method: 'verify',
          error_type: 'invalid_token',
        },
        extra: {
          tokenLength: token?.length,
        },
      });

      return null;
    }
  }
}

const unsubscribeService = new UnsubscribeService();

export default unsubscribeService;
