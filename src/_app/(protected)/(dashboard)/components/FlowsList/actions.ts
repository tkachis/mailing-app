'use server';

import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';

import { flowsRepository } from 'src/db/repositories';
import { flowsTable } from 'src/db/schema';
import { db, supabaseService } from 'src/services';

export async function toggleFlowActivation(flowId: string, isActive: boolean) {
  try {
    const [updatedFlow] = await db
      .update(flowsTable)
      .set({ isActive })
      .where(eq(flowsTable.id, flowId))
      .returning();

    return { success: true, data: updatedFlow };
  } catch (error) {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'flows-list',
        action: 'toggleFlowActivation',
      },
      extra: {
        flowId,
        isActiveValue: isActive,
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getUserFlows() {
  let userId: string | null = null;
  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { flows: [], error: null };
    }

    userId = user.id;

    const flows = await flowsRepository.getByAccountId(user.id);

    return { flows, error: null };
  } catch (err) {
    console.error('Failed to get user flows:', err);

    // Log to Sentry
    Sentry.captureException(err, {
      tags: {
        feature: 'flows-list',
        action: 'getUserFlows',
      },
      extra: {
        userId,
      },
    });

    return {
      flows: [],
      error: 'Failed to load flows. Please try refreshing the page.',
    };
  }
}

export type GetUserFlowsResponse = Awaited<ReturnType<typeof getUserFlows>>;
export type UserFlow = GetUserFlowsResponse['flows'][number];
