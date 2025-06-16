// Test script to check payment API endpoints
// Run this with: node test-payment-apis.js

const testPaymentAPIs = async () => {
  const baseUrl = 'http://localhost:3001';
  
  console.log('Testing Payment APIs...\n');
  
  // Test 1: Check if setup-intent endpoint is accessible
  try {
    console.log('1. Testing setup-intent endpoint...');
    const response = await fetch(`${baseUrl}/api/stripe/setup-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('Setup Intent Response:', response.status, data);
    
    if (response.status === 401) {
      console.log('✓ Setup intent endpoint is working (requires authentication)');
    } else if (response.status === 200 && data.clientSecret) {
      console.log('✓ Setup intent endpoint is working and returning client secret');
    } else {
      console.log('⚠️  Setup intent endpoint issue:', data);
    }
  } catch (error) {
    console.log('❌ Setup intent endpoint failed:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Check if payment-methods endpoint is accessible
  try {
    console.log('2. Testing payment-methods endpoint...');
    const response = await fetch(`${baseUrl}/api/stripe/payment-methods`);
    const data = await response.json();
    console.log('Payment Methods Response:', response.status, data);
    
    if (response.status === 401) {
      console.log('✓ Payment methods endpoint is working (requires authentication)');
    } else if (response.status === 200) {
      console.log('✓ Payment methods endpoint is working');
    } else {
      console.log('⚠️  Payment methods endpoint issue:', data);
    }
  } catch (error) {
    console.log('❌ Payment methods endpoint failed:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Check environment variables
  console.log('3. Checking environment variables...');
  const hasStripeSecret = process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing';
  const hasStripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Missing';
  const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing';
  const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing';
  
  console.log(`STRIPE_SECRET_KEY: ${hasStripeSecret}`);
  console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${hasStripePublic}`);
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseKey}`);
  
  if (hasStripeSecret === 'Missing' || hasStripePublic === 'Missing') {
    console.log('\n❌ Missing Stripe environment variables!');
    console.log('You need to set up Stripe keys in your .env.local file');
  }
};

testPaymentAPIs();
