#!/usr/bin/env node

// Simple test script to debug payment methods API
const https = require('https');

console.log('Testing Payment Methods API...');
console.log('Environment variables:');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY length:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0);

// Test if Stripe key is valid
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
    
    // Test account access
    stripe.accounts.retrieve().then(() => {
      console.log('✅ Stripe account access working');
    }).catch((err) => {
      console.log('❌ Stripe account access failed:', err.message);
    });
    
  } catch (error) {
    console.log('❌ Stripe initialization failed:', error.message);
  }
} else {
  console.log('❌ STRIPE_SECRET_KEY not found');
}
