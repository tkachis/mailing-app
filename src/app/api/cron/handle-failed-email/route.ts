import * as Sentry from '@sentry/nextjs';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Failure Callback для QStash
 * Вызывается когда все retry исчерпаны и письмо не удалось отправить
 *
 * Документация: https://upstash.com/docs/qstash/features/callbacks
 */
async function handler(req: NextRequest) {
  try {
    const failureData = await req.json();

    console.error(
      '🔴 CRITICAL ERROR: Email failed to send after all retries',
    );
    console.error('Error details:', JSON.stringify(failureData, null, 2));

    const {
      status,
      body,
      retried,
      maxRetries,
      dlqId,
      sourceMessageId,
      url,
      sourceBody,
      createdAt,
    } = failureData;

    // Decode base64 original message body
    let originalMessage = {};
    if (sourceBody) {
      try {
        const decoded = Buffer.from(sourceBody, 'base64').toString('utf-8');
        originalMessage = JSON.parse(decoded);
      } catch (e) {
        console.error('Failed to decode sourceBody:', e);
      }
    }

    // Decode base64 error response body
    let errorResponse = '';
    if (body) {
      try {
        errorResponse = Buffer.from(body, 'base64').toString('utf-8');
      } catch (e) {
        console.error('Failed to decode body:', e);
      }
    }

    console.error('📋 Email information:', originalMessage);
    console.error(`📊 Attempts: ${retried}/${maxRetries}`);
    console.error(`📍 DLQ ID: ${dlqId}`);
    console.error(`🆔 Message ID: ${sourceMessageId}`);
    console.error(`🔗 URL: ${url}`);
    console.error(`❌ Status: ${status}`);
    console.error(`📄 Server response: ${errorResponse}`);

    // Log to Sentry for monitoring
    Sentry.captureException(
      new Error('Email delivery failed after all retries'),
      {
        level: 'error',
        tags: {
          feature: 'email-sending',
          endpoint: 'failure-callback',
          status,
          retried,
          maxRetries,
        },
        extra: {
          dlqId,
          sourceMessageId,
          url,
          originalMessage,
          errorResponse,
          createdAt,
          fullFailureData: failureData,
        },
      },
    );

    // TODO: Additional logic can be added:
    // - Send notification to admin
    // - Record in DB for later analysis
    // - Retry via different channel

    return NextResponse.json({
      success: true,
      message: 'Failure logged',
      dlqId,
      sourceMessageId,
    });
  } catch (error) {
    console.error('💥 Error handling failure callback:', error);

    Sentry.captureException(error, {
      tags: {
        feature: 'email-sending',
        endpoint: 'failure-callback-error',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Verify QStash signature
export const POST = verifySignatureAppRouter(handler);
