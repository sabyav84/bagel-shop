import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  if (!stripePromise) {
    if (publishableKey && !publishableKey.includes('placeholder')) {
      stripePromise = loadStripe(publishableKey);
    } else {
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

export const isStripeConfigured = (): boolean => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  return Boolean(
    publishableKey &&
    publishableKey.startsWith('pk_test_') &&
    !publishableKey.includes('placeholder')
  );
};
