import { loadStripe } from '@stripe/stripe-js';

// NOTE: Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local for LIVE deployments. Never hardcode keys here.

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};