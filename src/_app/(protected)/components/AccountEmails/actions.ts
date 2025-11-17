'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { createTranslator, Locale } from 'next-globe-gen';

import { accountEmailsRepository } from 'src/db/repositories';
import { gmailOAuthService, supabaseService } from 'src/services';

import type { AccountEmail } from 'src/db/schema';

type ConnectGmailReturn = {
  success: boolean;
  error: { message: string } | null;
  authUrl: string | null;
};

export async function connectGmail(
  locale: Locale,
  returnPath: string = '/',
): Promise<ConnectGmailReturn> {
  const t = createTranslator(locale);

  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(t('errors.authentication_required'));
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-redirect`;

    // Generate authorization URL via googleapis directly
    // state parameter will contain the URL to return to after successful authorization
    const authUrl = gmailOAuthService.generateAuthUrl(redirectUri, returnPath);

    return {
      success: true,
      error: null,
      authUrl,
    };
  } catch (error) {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'account-emails',
        action: 'connectGmail',
      },
      extra: {
        returnPath,
      },
    });

    return {
      success: false,
      error: { message: t('errors.general') },
      authUrl: null,
    };
  }
}

export async function getAccountEmails(): Promise<AccountEmail[]> {
  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const emails = await accountEmailsRepository.getByAccountId(user.id);
    return emails;
  } catch (error) {
    console.error('Error fetching account emails:', error);

    Sentry.captureException(error, {
      tags: {
        feature: 'account-emails',
        action: 'getAccountEmails',
      },
    });

    return [];
  }
}

export async function removeAccountEmail(
  locale: Locale,
  emailId: string,
): Promise<{ success: boolean; error?: { message: string } | null }> {
  const t = createTranslator(locale);

  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(t('errors.authentication_required'));
    }

    const email = await accountEmailsRepository.getById(emailId);
    if (!email || email.accountId !== user.id) {
      throw new Error(t('errors.authentication_required'));
    }

    if (email.googleRefreshToken) {
      try {
        await gmailOAuthService.revokeToken(email.googleRefreshToken);
      } catch (error) {
        console.error(
          'Failed to revoke token, continuing with deletion:',
          error,
        );
      }
    }

    await accountEmailsRepository.delete(emailId);

    revalidatePath('/profile');
    revalidatePath('/flows');

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: 'account-emails',
        action: 'removeAccountEmail',
      },
      extra: {
        emailId,
      },
    });

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : t('errors.general'),
      },
    };
  }
}

export async function toggleAccountEmailActive(
  locale: Locale,
  emailId: string,
): Promise<{ success: boolean; error?: { message: string } | null }> {
  const t = createTranslator(locale);

  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(t('errors.authentication_required'));
    }

    const email = await accountEmailsRepository.getById(emailId);
    if (!email || email.accountId !== user.id) {
      throw new Error(t('errors.authentication_required'));
    }

    await accountEmailsRepository.update(emailId, {
      isActive: !email.isActive,
    });

    revalidatePath('/profile');
    revalidatePath('/flows');

    return { success: true };
  } catch (error) {
    console.error('Error toggling account email active:', error);

    Sentry.captureException(error, {
      tags: {
        feature: 'account-emails',
        action: 'toggleAccountEmailActive',
      },
      extra: {
        emailId,
      },
    });

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : t('errors.general'),
      },
    };
  }
}
