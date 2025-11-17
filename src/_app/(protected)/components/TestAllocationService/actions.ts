'use server';

import * as Sentry from '@sentry/nextjs';

import { allocationService } from 'src/services';

export async function runAllocation() {
  try {
    const result = await allocationService.plan();
    console.log('Allocation result:', result);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Allocation error:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'allocation',
        action: 'runAllocation',
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
