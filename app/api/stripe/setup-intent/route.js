import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Helper function to get Supabase client and session
 * Supports both cookie-based auth (web) and Bearer token auth (mobile)
 */
async function getSupabaseSession(request) {
  // Check for Authorization header (mobile apps)
  const authHeader = request?.headers?.get('Authorization') || request?.headers?.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Create a Supabase client with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get the user with the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { supabase, session: null, error };
    }

    return {
      supabase,
      session: { user },
      error: null
    };
  }

  // Fall back to cookie-based auth (web browsers)
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error } = await supabase.auth.getSession();

  return { supabase, session, error };
}

export async function POST(request) {
  try {
    // Get the user session (supports both mobile and web)
    const { supabase, session, error: authError } = await getSupabaseSession(request);

    if (authError || !session) {
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
    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
