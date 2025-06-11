import { loadStripe } from '@stripe/stripe-js';

// Use the provided live publishable key as fallback if env var is missing
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51Q41FbHPC9CAw0cIrYB4Xs7GRPTuZl0PCMwsE5iVBCsEVBWOnBLPZaYqvc1l2uTMZjhdIRWuT6v50PMZrjofcf0m00fUqZ7dx5';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};