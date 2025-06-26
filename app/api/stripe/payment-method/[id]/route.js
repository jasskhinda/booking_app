import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentMethodId = params.id;
    
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    try {
      // Fetch payment method details from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Return only the necessary card information
      const cardInfo = {
        id: paymentMethod.id,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        },
        type: paymentMethod.type
      };

      return NextResponse.json({
        success: true,
        paymentMethod: cardInfo
      });

    } catch (stripeError) {
      console.error('Stripe error fetching payment method:', stripeError);
      return NextResponse.json({
        error: 'Failed to fetch payment method details',
        details: stripeError.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment method fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
