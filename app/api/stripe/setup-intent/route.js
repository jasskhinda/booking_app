import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51OlJ2zLkdIwU2RZE1z0zrUWvEJ3XbXxFGm7n8s');

export async function POST() {
  try {
    // Get the user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to create a setup intent' },
        { status: 401 }
      );
    }
    
    // Get or create customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
    
    let customerId = profile?.stripe_customer_id;
    
    // If the customer doesn't exist in Stripe yet, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.user_metadata?.full_name || 'User',
        metadata: {
          user_id: session.user.id
        }
      });
      
      customerId = customer.id;
      
      // Save the customer ID to the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id);
      
      if (updateError) {
        console.error('Error updating profile with Stripe customer ID:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user profile with Stripe customer ID' },
          { status: 500 }
        );
      }
    }
    
    // Create a setup intent to securely collect payment method details
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    
    // Return the client secret to the client
    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}