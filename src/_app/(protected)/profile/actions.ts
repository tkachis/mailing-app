'use server';

import * as Sentry from '@sentry/nextjs';

import { supabaseService } from 'src/services';

export async function getUserInfo() {
  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'profile',
        action: 'getUserInfo',
      },
    });

    return null;
  }
}
