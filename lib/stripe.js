import { loadStripe } from '@stripe/stripe-js';

// Use the provided test publishable key as fallback if env var is missing
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Q41FbHPC9CAw0cIgYQpF487dRuXGZcviBJA0qNlxFWUIofLlt6hOTfVVjPIMLVORdd12XUw7BAu4Gl1B9gfpupb00OAy2mJ4k';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};