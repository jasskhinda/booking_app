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
    
    // Set a timeout to prevent the API from hanging if notification takes too long
    // This makes the endpoint more resilient when handling many concurrent requests
    let notificationTimeout;
    
    const timeoutPromise = new Promise((_, reject) => {
      notificationTimeout = setTimeout(() => {
        reject(new Error('Notification timeout - operation will continue in background'));
      }, 5000); // 5 second timeout which is plenty for the initial response
    });
    
    try {
      // Race between notification and timeout
      const result = await Promise.race([
        notifyDispatchersOfNewTrip(trip, session.user),
        timeoutPromise
      ]);
      
      // If we get here, notification succeeded before timeout
      clearTimeout(notificationTimeout);
      
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
    } catch (timeoutError) {
      // If we hit the timeout, continue the notification in background and return success
      console.log('Notification taking longer than expected, continuing in background');
      
      // Continue the notification process in background without awaiting it
      notifyDispatchersOfNewTrip(trip, session.user)
        .then(result => {
          if (result.success) {
            console.log('Background notification completed successfully');
          } else {
            console.error('Background notification failed:', result.error);
          }
        })
        .catch(err => {
          console.error('Error in background notification:', err);
        });
      
      // Return success to the client, as this is non-blocking
      return NextResponse.json({
        success: true,
        message: 'Trip created. Dispatcher notification in progress.'
      });
    }
  } catch (error) {
    console.error('Error in notify-dispatchers endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}