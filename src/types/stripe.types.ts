import Stripe from 'stripe';

export type CreateCheckoutSessionParams = {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Stripe.MetadataParam;
  customerId: string | null;
};
