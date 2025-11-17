import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { accountsTable } from 'src/db/schema';
import { db, stripeService } from 'src/services';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') ?? '';
  const event = await stripeService.constructWebhookEvent(body, signature);

  if (!event) {
    return new Response('Webhook signature verification failed.', {
      status: 400,
    });
  }

  if (event.type === 'checkout.session.completed') {
    const { metadata, customer: customerId } = event.data.object;
    const accountId = metadata?.accountId;

    if (!accountId || !customerId) {
      console.error('Webhook Error: Missing critical data in session.');
      return new Response('Webhook Error: Missing metadata in session.', {
        status: 400,
      });
    }

    const customerIdString =
      typeof customerId === 'string' ? customerId : customerId.id;

    await db
      .update(accountsTable)
      .set({ stripeCustomerId: customerIdString, updatedAt: new Date() })
      .where(eq(accountsTable.id, accountId));
  }

  return NextResponse.json({ received: true });
}
