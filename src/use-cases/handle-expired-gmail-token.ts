import * as Sentry from '@sentry/nextjs';

import { accountEmailsRepository } from 'src/db/repositories';

/**
 * Handles expired Google refresh token.
 * Removes invalid token from database and logs the event.
 *
 * @param accountEmailId - ID of email account with expired token
 */
export default async function handleExpiredGmailToken(
  accountEmailId: string,
): Promise<void> {
  const senderEmail = await accountEmailsRepository.getById(accountEmailId);

  if (!senderEmail) {
    console.error(
      `[${new Date().toISOString()}] ❌ Email account with ID ${accountEmailId} not found`,
    );
    return;
  }

  console.error(
    `[${new Date().toISOString()}] ⚠️  TOKEN EXPIRED: Google refresh token for email ${senderEmail.email} (ID: ${accountEmailId}) has expired or been revoked.`,
  );

  // Remove invalid token and deactivate email account
  try {
    await accountEmailsRepository.update(accountEmailId, {
      googleRefreshToken: null,
      isActive: false, // Deactivate until reconnection
    });
    console.log(
      `[${new Date().toISOString()}] ✅ Email account ${accountEmailId} deactivated (token removed)`,
    );
  } catch (dbError) {
    console.error(
      `[${new Date().toISOString()}] ❌ Error during deactivation:`,
      dbError,
    );

    // Log database error to Sentry
    Sentry.captureException(dbError, {
      tags: {
        feature: 'email',
        use_case: 'handleExpiredGmailToken',
      },
      extra: {
        accountEmailId,
      },
    });
  }

  console.error(
    '👉 Action: User must click "Reconnect Gmail" in UI to reconnect.',
  );

  // TODO: Additional logic can be added:
  // 1. Send email notification to user about need to reconnect
  // 2. Temporarily pause flows using this email
  // 3. Record event in audit log
}
