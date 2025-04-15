import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifyDispatchersOfNewTrip } from '@/lib/notifications';

export async function POST(request) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, return unauthorized
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get trip ID from request body
    const { tripId } = await request.json();
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', session.user.id)
      .single();
    
    if (tripError || !trip) {
      console.error('Error fetching trip:', tripError);
      return NextResponse.json(
        { error: 'Trip not found or access denied' },
        { status: 404 }
      );
    }
    
    // Send notification to dispatchers
    const result = await notifyDispatchersOfNewTrip(trip, session.user);
    
    if (!result.success) {
      console.error('Failed to notify dispatchers:', result.error);
      return NextResponse.json(
        { error: 'Failed to notify dispatchers', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dispatchers notified successfully'
    });
  } catch (error) {
    console.error('Error in notify-dispatchers endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}