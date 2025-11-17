'use server';

import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';

import { flowsTable } from 'src/db/schema';
import { db, supabaseService } from 'src/services';

export async function getUserStatistics() {
  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get user flows with emailLogs
    const flows = await db.query.flowsTable.findMany({
      where: eq(flowsTable.accountId, user.id),
      with: {
        emailLogs: true,
      },
    });

    const totalFlows = flows.length;
    const activeFlows = flows.filter((flow) => flow.isActive).length;

    // Get total number of emails sent from all flows
    const totalEmailsSent = flows.reduce(
      (sum, flow) => sum + (flow.emailLogs?.length || 0),
      0,
    );

    return {
      totalFlows,
      activeFlows,
      totalEmailsSent,
    };
  } catch (error) {
    console.error('Error fetching user statistics:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'dashboard',
        action: 'getUserStatistics',
      },
    });

    return null;
  }
}
