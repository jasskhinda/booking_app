// Test payment methods API directly
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  console.log('Testing payment methods API...');
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);
  
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      console.log('✅ Stripe initialized successfully');
      
      // Test account access
      const account = await stripe.accounts.retrieve();
      console.log('✅ Stripe account access working');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Stripe configured correctly',
        account: account.id 
      });
    } catch (error) {
      console.log('❌ Stripe error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
  }
}
