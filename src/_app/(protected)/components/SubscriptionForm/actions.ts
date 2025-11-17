'use server';

import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';
import { redirect } from 'next-globe-gen';
import Stripe from 'stripe';

import { Routes } from 'src/configs';
import { accountsTable } from 'src/db/schema';
import { db, stripeService, supabaseService } from 'src/services';

export async function getSubscription(): Promise<Stripe.Subscription | null> {
  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const account = await db.query.accountsTable.findFirst({
      where: eq(accountsTable.id, user.id),
    });

    if (!account?.stripeCustomerId) {
      return null;
    }

    return stripeService.getActiveSubscriptionForCustomer(
      account.stripeCustomerId,
    );
  } catch (error) {
    console.error('Failed to get subscription:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'subscription',
        action: 'getSubscription',
      },
    });

    return null;
  }
}

export async function createCheckoutSession(
  lookupKey: string,
): Promise<string | null | undefined> {
  try {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect(Routes.login());
    }

    const account = await db.query.accountsTable.findFirst({
      where: eq(accountsTable.id, user.id),
    });

    if (!account) {
      throw new Error('Account not found for the current user.');
    }

    const customerId = account.stripeCustomerId;
    const price = await stripeService.findPriceByLookupKey(lookupKey);

    if (!price) {
      throw new Error(`Price not found for lookup key: ${lookupKey}`);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL!;
    const successUrl = `${origin}${Routes.paymentSuccess(Routes.home(), '{CHECKOUT_SESSION_ID}')}`;
    const cancelUrl = `${origin}${Routes.paymentCancel(Routes.home())}`;

    const checkoutSession = await stripeService.createCheckoutSession({
      lineItems: [{ price: price.id, quantity: 1 }],
      customerEmail: user.email!,
      customerId,
      successUrl,
      cancelUrl,
      metadata: { accountId: account.id },
    });

    return checkoutSession?.url;
  } catch (error) {
    console.error('Failed to create checkout session:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'subscription',
        action: 'createCheckoutSession',
      },
      extra: {
        lookupKey,
      },
    });

    return null;
  }
}

export async function getStripeCustomerId(
  sessionId?: string | null,
): Promise<string | null | undefined> {
  if (!sessionId) {
    const supabase = await supabaseService.createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const account = await db.query.accountsTable.findFirst({
      where: eq(accountsTable.id, user.id),
    });

    return account?.stripeCustomerId;
  }

  const checkoutSession = await stripeService.getCheckoutSession(sessionId);

  if (typeof checkoutSession?.customer !== 'string') {
    throw new Error('Customer ID not found in checkout session.');
  }

  return checkoutSession?.customer;
}

export async function createStripePortalSession(
  customerId: string,
): Promise<string | null | undefined> {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL!;
    const returnUrl = `${origin}${Routes.home()}`;

    const portalSession = await stripeService.createPortalSession(
      customerId,
      returnUrl,
    );

    return portalSession?.url;
  } catch (error) {
    console.error('Failed to create portal session:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        feature: 'subscription',
        action: 'createStripePortalSession',
      },
      extra: {
        customerId,
      },
    });

    return null;
  }
}
