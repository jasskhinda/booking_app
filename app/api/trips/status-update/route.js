import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the trip ID and updates from the request
    const { tripId, updates } = await request.json();
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Update the trip with the provided fields
    const allowedUpdates = [
      'status', 
      'payment_status', 
      'payment_intent_id', 
      'charged_at', 
      'payment_amount',
      'payment_error',
      'payment_attempted_at',
      'cancellation_reason',
      'driver_id',
      'driver_name',
      'notes'
    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    // Update the trip in the database
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update(filteredUpdates)
      .eq('id', tripId)
      .select()
      .single();

    if (updateError) {
      console.error('Trip update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update trip',
        details: updateError.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
      message: 'Trip updated successfully'
    });

  } catch (error) {
    console.error('Trip status update error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the current trip status
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        status,
        payment_status,
        payment_intent_id,
        charged_at,
        payment_amount,
        payment_error,
        payment_attempted_at,
        updated_at
      `)
      .eq('id', tripId)
      .eq('user_id', session.user.id) // Ensure user can only access their own trips
      .single();

    if (tripError) {
      console.error('Trip fetch error:', tripError);
      return NextResponse.json({
        error: 'Trip not found or access denied',
        details: tripError.message
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trip
    });

  } catch (error) {
    console.error('Trip status fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
