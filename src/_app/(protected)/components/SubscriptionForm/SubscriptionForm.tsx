// TODO: Refactor component. Connect with real prices from Stripe

'use client';

import { RiCheckLine, RiSparklingLine } from '@remixicon/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next-globe-gen';
import { useEffect, useState, useTransition } from 'react';

import { Button, toast } from 'src/components';
import { useErrorToast } from 'src/hooks';

import {
  createCheckoutSession,
  createStripePortalSession,
  getStripeCustomerId,
  getSubscription,
} from './actions';

enum LookupKeys {
  StandardMonthly = 'standard_monthly',
  StandardYearly = 'standard_yearly',
}

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$89',
    period: 'per month',
    lookupKey: LookupKeys.StandardMonthly,
    features: ['Unlimited email flows', 'Gmail integration', 'Email analytics'],
    badge: null,
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$960',
    period: 'per year',
    lookupKey: LookupKeys.StandardYearly,
    features: ['Everything in Monthly'],
    badge: 'Best Value',
    highlight: true,
    savings: 'Save $108/year',
  },
];

export function SubscriptionForm() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // Handle payment statuses via hook
  useErrorToast('paymentStatus', {
    cancel: { message: 'Payment cancelled', type: 'error' },
    success: { message: 'Payment successful', type: 'success' },
  });

  useEffect(() => {
    const checkSubscription = async () => {
      setIsLoading(true);
      const sub = sessionId || (await getSubscription());
      setHasSubscription(!!sub);
      setIsLoading(false);
    };

    checkSubscription();
  }, [sessionId]);

  const handleCreatePortalSession = () => {
    startTransition(async () => {
      const customerId = await getStripeCustomerId(sessionId);

      if (!customerId) {
        toast.error('Could not get customer ID');
        return;
      }

      const url = await createStripePortalSession(customerId);

      if (url) {
        return router.push(url);
      }

      toast.error('Could not create portal session');
    });
  };

  const handleCreateCheckoutSession = (lookupKey: string) => {
    startTransition(async () => {
      const url = await createCheckoutSession(lookupKey);
      if (url) {
        router.push(url);
      } else {
        toast.error('Could not create checkout session');
      }
    });
  };

  if (isLoading) {
    return (
      <div className='animate-pulse'>
        <div className='mb-4 h-6 w-32 rounded bg-gray-200'></div>
        <div className='space-y-3'>
          <div className='h-4 w-full rounded bg-gray-200'></div>
          <div className='h-32 w-full rounded bg-gray-200'></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasSubscription ? (
        <div>
          <p className='mb-4 text-sm text-gray-600'>
            You have an active subscription. Manage your billing and payment
            methods.
          </p>
          <Button.Root
            onClick={handleCreatePortalSession}
            disabled={isPending}
            variant='primary'
            mode='filled'
            size='medium'
          >
            <RiCheckLine className='mr-2 h-5 w-5' />
            {isPending ? 'Redirecting...' : 'Manage Subscription'}
          </Button.Root>
        </div>
      ) : (
        <div>
          <p className='mb-6 text-sm text-gray-600'>
            Choose a plan that works best for you. Cancel anytime.
          </p>

          <div className='grid gap-4 md:grid-cols-2'>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col rounded-xl border-2 p-6 transition-all ${
                  plan.highlight
                    ? 'border-purple-500 bg-linear-to-br from-purple-50 to-white shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.badge && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                    <span className='flex items-center gap-1 rounded-full bg-linear-to-r from-purple-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white shadow-md'>
                      <RiSparklingLine className='h-3 w-3' />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className='flex-1'>
                  <div className='mb-4'>
                    <h3 className='text-xl font-bold text-gray-900'>
                      {plan.name}
                    </h3>
                    <div className='mt-2 flex items-baseline gap-1'>
                      <span className='text-3xl font-bold text-gray-900'>
                        {plan.price}
                      </span>
                      <span className='text-sm text-gray-600'>
                        {plan.period}
                      </span>
                    </div>
                    {plan.savings && (
                      <p className='mt-1 text-sm font-medium text-green-600'>
                        {plan.savings}
                      </p>
                    )}
                  </div>

                  <ul className='mb-6 space-y-3'>
                    {plan.features.map((feature, index) => (
                      <li key={index} className='flex items-start gap-2'>
                        <RiCheckLine
                          className={`mt-0.5 h-5 w-5 shrink-0 ${
                            plan.highlight
                              ? 'text-purple-600'
                              : 'text-green-600'
                          }`}
                        />
                        <span className='text-sm text-gray-700'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button.Root
                  onClick={() => handleCreateCheckoutSession(plan.lookupKey)}
                  disabled={isPending}
                  variant={plan.highlight ? 'primary' : 'neutral'}
                  mode='filled'
                  size='medium'
                  className='w-full'
                >
                  {isPending ? 'Processing...' : `Choose ${plan.name}`}
                </Button.Root>
              </div>
            ))}
          </div>

          <div className='mt-6 rounded-lg bg-blue-50 p-4'>
            <p className='text-sm text-blue-800'>
              💳 <strong>Secure payment:</strong> All transactions are securely
              processed through Stripe. Cancel your subscription anytime with no
              hidden fees.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
