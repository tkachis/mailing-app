import { Routes } from 'src/configs';
import {
  accountEmailsRepository,
  companiesRepository,
  emailLogsRepository,
  flowsRepository,
} from 'src/db/repositories';
import {
  emailService,
  unsubscribeService,
  gmailOAuthService,
  templateService,
} from 'src/services';
import { Assignment } from 'src/services/allocation.service';
import { EmailErrorCode, isEmailServiceError } from 'src/types/email.types';

import handleExpiredGmailToken from './handle-expired-gmail-token';

export default async function sendEmailToCompany(assignment: Assignment) {
  const { accountEmailId, companyId, flowId } = assignment;

  // 1. Get all necessary data from the database
  const [sender, recipient, flow] = await Promise.all([
    accountEmailsRepository.getById(accountEmailId),
    companiesRepository.getByIdWithPkds(companyId),
    flowsRepository.getByIdWithPkd(flowId),
  ]);

  if (!sender || !recipient || !flow) {
    const error = new Error('Missing required data for email sending');
    console.error(
      `[${new Date().toISOString()}] Error: data not found for assignment:`,
      assignment,
    );
    throw error;
  }

  if (!recipient.email) {
    const error = new Error(`Company "${recipient.name}" has no email`);
    console.warn(
      `[${new Date().toISOString()}] SKIP: Company "${recipient.name}" has no email.`,
    );
    throw error;
  }

  try {
    // 2. Create log entry BEFORE sending
    const unsubscribeToken = await unsubscribeService.generate(
      accountEmailId,
      companyId,
    );

    await emailLogsRepository.create({
      flowId,
      recipientId: companyId,
      accountEmailId,
      unsubscribeToken,
    });

    console.log(
      `[${new Date().toISOString()}] SENDING: Email for ${
        recipient.name
      } from ${sender.email}`,
    );

    if (!sender.googleRefreshToken) {
      const error = new Error('Missing Google refresh token for sender');
      console.error(
        `[${new Date().toISOString()}] Error: refresh token not found for sender:`,
        sender,
      );
      throw error;
    }

    const accessToken = await gmailOAuthService.getAccessToken(
      sender.googleRefreshToken,
    );

    if (!accessToken) {
      const error = new Error('Failed to get Google access token');
      console.error(
        `[${new Date().toISOString()}] Error: access token not found for sender:`,
        sender,
      );
      throw error;
    }

    const auth = {
      email: sender.email,
      refreshToken: sender.googleRefreshToken,
      accessToken: accessToken,
    };

    // 3. Substitute company data into template
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const unsubscribeLink = `${appUrl}${Routes.unsubscribeApi(unsubscribeToken)}`;

    const personalizedHtml = templateService.replaceTemplateVariables(
      flow.emailTemplateHtml,
      {
        COMPANY_NAME: recipient.name,
        UNSUBSCRIBE_LINK: unsubscribeLink,
      },
    );

    // 4. Send email
    await emailService.send(auth, {
      to: recipient.email,
      subject: flow.name,
      html: personalizedHtml,
    });

    // TODO: Add logic here to update email_logs status to "sent"
    console.log(`[${new Date().toISOString()}] ✅ Email sent successfully`);
  } catch (error) {
    // Special handling for expired Google refresh token
    // This is business logic we handle here
    if (
      isEmailServiceError(error) &&
      error.code === EmailErrorCode.REFRESH_TOKEN_EXPIRED
    ) {
      console.log(
        `[${new Date().toISOString()}] ⚠️ Handling expired refresh token for account ${accountEmailId}`,
      );
      await handleExpiredGmailToken(accountEmailId);

      // Throw error further so API knows email wasn't sent
      throw new Error('Gmail refresh token expired');
    }

    // All other errors are thrown up
    // API Route will handle them and log to Sentry
    console.error(
      `[${new Date().toISOString()}] ERROR sending email:`,
      error instanceof Error ? error.message : 'Unknown error',
    );

    throw error;
  }
}
