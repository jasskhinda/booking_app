import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  console.log('🔄 Payment charging API called');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the trip ID from the request
    const { tripId } = await request.json();
    console.log('💳 Processing payment for trip:', tripId);
    
    if (!tripId) {
      console.error('❌ No trip ID provided');
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Get the trip details including payment method
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        profiles!inner(stripe_customer_id, email, first_name, last_name)
      `)
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      console.error('❌ Trip fetch error:', tripError);
      return NextResponse.json({ 
        error: 'Trip not found' 
      }, { status: 404 });
    }

    console.log('✅ Trip found:', trip.id, 'Status:', trip.status, 'Payment method:', !!trip.payment_method_id);

    // Verify trip is approved and has payment method
    if (!['upcoming', 'approved_pending_payment'].includes(trip.status)) {
      console.error('❌ Invalid trip status for payment:', trip.status);
      return NextResponse.json({ 
        error: `Trip must be approved to charge payment. Current status: ${trip.status}` 
      }, { status: 400 });
    }

    if (!trip.payment_method_id) {
      console.error('❌ No payment method ID found for trip');
      return NextResponse.json({ 
        error: 'No payment method found for this trip' 
      }, { status: 400 });
    }

    if (!trip.profiles?.stripe_customer_id) {
      console.error('❌ No Stripe customer ID found for user');
      return NextResponse.json({ 
        error: 'No Stripe customer ID found for user' 
      }, { status: 400 });
    }

    console.log('✅ Payment validation passed - proceeding with charge');

    // Calculate amount in cents
    const amountInCents = Math.round((trip.price || 50) * 100);

    try {
      console.log('🔄 Creating Stripe payment intent...');
      // Create the payment intent with the stored payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'cad',
        customer: trip.profiles.stripe_customer_id,
        payment_method: trip.payment_method_id,
        confirm: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/trips/${tripId}`,
        metadata: {
          trip_id: tripId,
          user_id: trip.user_id,
          pickup_address: trip.pickup_address,
          destination_address: trip.destination_address,
          pickup_time: trip.pickup_time
        },
        description: `Compassionate Care Transportation - ${trip.pickup_address} to ${trip.destination_address}`,
      });

      console.log('✅ Payment intent created successfully:', paymentIntent.id);

      // Update trip status to 'paid_in_progress' and set payment details
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          status: 'paid_in_progress', // Change status to show trip is paid and in progress
          payment_status: 'paid',
          payment_intent_id: paymentIntent.id,
          charged_at: new Date().toISOString(),
          payment_amount: trip.price
        })
        .eq('id', tripId);

      if (updateError) {
        console.error('❌ Failed to update trip payment status:', updateError);
        // Don't fail the request since payment succeeded
      } else {
        console.log('✅ Trip status updated to paid_in_progress');
      }

      console.log('🎉 Payment processed successfully for trip:', tripId);

      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        },
        trip: {
          id: tripId,
          status: 'paid_in_progress', // Return new status
          payment_status: 'paid',
          amount: trip.price
        }
      });

    } catch (stripeError) {
      console.error('❌ Stripe payment error:', stripeError);
      
      // Update trip with payment failure and change status
      await supabase
        .from('trips')
        .update({
          status: 'payment_failed', // Change status to indicate payment failure
          payment_status: 'failed',
          payment_error: stripeError.message,
          payment_attempted_at: new Date().toISOString()
        })
        .eq('id', tripId);

      console.log('💡 Trip status updated to payment_failed due to Stripe error');

      return NextResponse.json({
        error: 'Payment failed',
        details: stripeError.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Charge payment API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
