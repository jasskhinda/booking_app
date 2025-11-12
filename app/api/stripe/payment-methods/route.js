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

// GET handler to retrieve payment methods
export async function GET(request) {
  try {
    // Get the user session (supports both mobile and web)
    const { supabase, session, error: authError } = await getSupabaseSession(request);

    if (authError || !session) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'You must be logged in to view payment methods' },
        { status: 401 }
      );
    }

    // Get the Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // If no customer ID, return empty list
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // Retrieve the customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    });

    return NextResponse.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment methods' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a payment method
export async function DELETE(request) {
  try {
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Get the user session (supports both mobile and web)
    const { supabase, session, error: authError } = await getSupabaseSession(request);

    if (authError || !session) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a payment method' },
        { status: 401 }
      );
    }

    // Verify the payment method belongs to this user
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'User has no associated payment methods' },
        { status: 400 }
      );
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'This payment method does not belong to the current user' },
        { status: 403 }
      );
    }

    // Detach the payment method from the customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
