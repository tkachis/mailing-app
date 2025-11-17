import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

import { CreateCheckoutSessionParams } from 'src/types/stripe.types';

class StripeService {
  private readonly stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async createCheckoutSession({
    lineItems,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata,
    customerId,
  }: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session | null> {
    try {
      // Check if the customer exists
      let customer: Stripe.Customer | Stripe.DeletedCustomer | null = null;

      if (customerId) {
        customer = await this.getCustomer(customerId);
      }

      const customerExists = customerId && !customer?.deleted;

      // If customerId is provided, we don't need to set the customer_email
      // because the customer is already associated with the email
      const email = customerExists ? undefined : customerEmail;
      const stripeCustomerId = customerExists ? customerId : undefined;

      return this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: lineItems,
        customer_email: email,
        customer: stripeCustomerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to create checkout session: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'createCheckoutSession',
        },
        extra: {
          customerEmail,
          customerId,
        },
      });

      return null;
    }
  }

  async findPriceByLookupKey(lookupKey: string): Promise<Stripe.Price | null> {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: [lookupKey],
        expand: ['data.product'],
      });
      return prices.data[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to find price by lookup key: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'findPriceByLookupKey',
        },
        extra: {
          lookupKey,
        },
      });

      return null;
    }
  }

  async getCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session | null> {
    try {
      return this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to get checkout session: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'getCheckoutSession',
        },
        extra: {
          sessionId,
        },
      });

      return null;
    }
  }

  async getActiveSubscriptionForCustomer(
    customerId: string,
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      return subscriptions.data[0] || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to get active subscription: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'getActiveSubscriptionForCustomer',
        },
        extra: {
          customerId,
        },
      });

      return null;
    }
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Promise<Stripe.Event | null> {
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET!;
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Webhook signature verification failed: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'constructWebhookEvent',
        },
      });

      return null;
    }
  }

  async getSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to get subscription: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'getSubscription',
        },
        extra: {
          subscriptionId,
        },
      });

      return null;
    }
  }

  async getCustomer(
    customerId: string,
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer | null> {
    try {
      return this.stripe.customers.retrieve(customerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to get customer: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'getCustomer',
        },
        extra: {
          customerId,
        },
      });

      return null;
    }
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session | null> {
    try {
      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return portalSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to create portal session: ${errorMessage}`);

      // Log to Sentry
      Sentry.captureException(err, {
        tags: {
          feature: 'stripe',
          service: 'StripeService',
          method: 'createPortalSession',
        },
        extra: {
          customerId,
          returnUrl,
        },
      });

      return null;
    }
  }
}

const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);

export default stripeService;
