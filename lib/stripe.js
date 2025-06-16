import { loadStripe } from '@stripe/stripe-js';

// NOTE: Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local for LIVE deployments. Never hardcode keys here.

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise;

export const getStripe = () => {
  console.log('getStripe called, public key available:', !!stripePublicKey);
  console.log('Stripe public key (first 10 chars):', stripePublicKey?.substring(0, 10));
  
  if (!stripePromise) {
    if (!stripePublicKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      return null;
    }
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};