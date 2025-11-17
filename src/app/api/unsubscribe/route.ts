import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { Routes } from 'src/configs';
import { suppressionListRepository } from 'src/db/repositories';
import { unsubscribeService } from 'src/services';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  try {
    if (!token) {
      const url = new URL(
        Routes.unsubscribe('missing'),
        process.env.NEXT_PUBLIC_APP_URL,
      );
      return NextResponse.redirect(url);
    }

    // Verify and decrypt token
    const payload = await unsubscribeService.verify(token);

    if (!payload) {
      const url = new URL(
        Routes.unsubscribe('invalid'),
        process.env.NEXT_PUBLIC_APP_URL,
      );
      return NextResponse.redirect(url);
    }

    // Add pair to suppression list
    await suppressionListRepository.add({
      accountEmailId: payload.accountEmailId,
      companyId: payload.companyId,
    });

    console.log(
      `[${new Date().toISOString()}] Unsubscribe processed successfully: accountEmailId=${payload.accountEmailId}, companyId=${payload.companyId}`,
    );

    const successUrl = new URL(
      Routes.unsubscribe('success'),
      process.env.NEXT_PUBLIC_APP_URL,
    );
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error processing unsubscribe:`,
      error,
    );

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'unsubscribe',
        route: '/api/unsubscribe',
        method: 'GET',
      },
      extra: {
        hasToken: !!token,
      },
    });

    const errorUrl = new URL(
      Routes.unsubscribe('error'),
      process.env.NEXT_PUBLIC_APP_URL,
    );
    return NextResponse.redirect(errorUrl);
  }
}
