import * as Sentry from '@sentry/nextjs';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { sendEmailToCompany } from 'src/use-cases';

import type { Assignment } from 'src/services/allocation.service';

/**
 * API Route вызывается QStash в запланированное время
 * Задача: Отправить письмо конкретной компании
 */
async function handler(req: NextRequest) {
  // Declare variables outside try-catch for use in both blocks
  let accountEmailId: string | undefined;
  let companyId: string | undefined;
  let flowId: string | undefined;
  let scheduledTime: string | undefined;

  try {
    const body = await req.json();
    const { scheduledAt, scheduledAtReadable } = body;

    // Assign values
    accountEmailId = body.accountEmailId;
    companyId = body.companyId;
    flowId = body.flowId;
    scheduledTime = scheduledAtReadable || scheduledAt || 'unknown';

    if (!accountEmailId || !companyId || !flowId) {
      console.error('❌ Missing parameters:', body);
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 },
      );
    }

    const now = new Date();

    console.log(
      `[${now.toISOString()}] 📧 Sending email: company ${companyId}, flow ${flowId}`,
    );
    console.log(`  📅 Scheduled for: ${scheduledTime}`);

    const assignment: Assignment = {
      accountEmailId,
      companyId,
      flowId,
    };

    // Send email
    await sendEmailToCompany(assignment);

    console.log(`[${new Date().toISOString()}] ✅ Email sent successfully`);

    return NextResponse.json({
      success: true,
      companyId,
      flowId,
      scheduledAt: scheduledTime,
    });
  } catch (error) {
    console.error('💥 Error sending email:', error);

    // Log to Sentry with full context
    // This is the ONLY place where error goes to Sentry
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        feature: 'email-sending',
        endpoint: 'send-email',
        companyId,
        flowId,
      },
      extra: {
        assignment: {
          accountEmailId,
          companyId,
          flowId,
        },
        scheduledTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        companyId,
        flowId,
      },
      { status: 500 },
    );
  }
}

// Verify QStash signature for security
export const POST = verifySignatureAppRouter(handler);
