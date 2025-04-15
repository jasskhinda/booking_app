import { loadStripe } from '@stripe/stripe-js';

// This is a public sample test API key.
// Don't submit any personally identifiable information in requests made with this key.
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OlJ2zLkdIwU2RZEDpHkofggU00sgxPIPH09PCtkJhyjfr8BXDlnLn';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};