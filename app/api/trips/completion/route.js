import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the action details from the request
    const { tripId, action, rating, review, completionNotes } = await request.json();
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the trip to verify ownership and current status
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Handle different actions
    const updates = {
      updated_at: new Date().toISOString()
    };

    let responseMessage = '';

    switch (action) {
      case 'complete':
        // Mark trip as completed (typically done by dispatcher/driver)
        if (trip.status !== 'in_progress' && trip.status !== 'upcoming') {
          return NextResponse.json({ 
            error: 'Trip must be in progress or upcoming to mark as completed' 
          }, { status: 400 });
        }
        
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
        
        if (completionNotes) {
          updates.completion_notes = completionNotes;
        }
        
        responseMessage = 'Trip marked as completed successfully';
        break;

      case 'rate':
        // Add rating and review (done by client after completion)
        if (trip.status !== 'completed') {
          return NextResponse.json({ 
            error: 'Trip must be completed to add rating' 
          }, { status: 400 });
        }

        if (trip.user_id !== session.user.id) {
          return NextResponse.json({ 
            error: 'Only the trip owner can rate the service' 
          }, { status: 403 });
        }

        if (rating && (rating < 1 || rating > 5)) {
          return NextResponse.json({ 
            error: 'Rating must be between 1 and 5' 
          }, { status: 400 });
        }

        if (rating) updates.rating = rating;
        if (review) updates.review = review;
        updates.rated_at = new Date().toISOString();
        
        responseMessage = 'Rating and feedback submitted successfully';
        break;

      case 'feedback':
        // Add general feedback (can be done by client or driver)
        if (!trip.feedback) {
          updates.feedback = review || completionNotes;
        } else {
          // Append to existing feedback
          updates.feedback = `${trip.feedback}\n\n[${new Date().toISOString()}] ${review || completionNotes}`;
        }
        
        responseMessage = 'Feedback added successfully';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the trip in the database
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update(updates)
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

    // If trip was completed, we might want to trigger notifications or other workflows
    if (action === 'complete') {
      // Here you could add:
      // - Send completion notification to client
      // - Trigger billing/invoice generation
      // - Update driver statistics
      // - Send feedback request email
      console.log(`🎉 Trip ${tripId} completed successfully`);
    }

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
      message: responseMessage
    });

  } catch (error) {
    console.error('Trip completion error:', error);
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

    // Get the trip with completion details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        profiles!inner(first_name, last_name, role)
      `)
      .eq('id', tripId)
      .single();

    if (tripError) {
      console.error('Trip fetch error:', tripError);
      return NextResponse.json({
        error: 'Trip not found or access denied',
        details: tripError.message
      }, { status: 404 });
    }

    // Check if user has access (trip owner, driver, or dispatcher)
    const hasAccess = 
      trip.user_id === session.user.id || 
      trip.driver_id === session.user.id || 
      trip.profiles.role === 'dispatcher';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      trip: {
        ...trip,
        canComplete: trip.status === 'in_progress' || trip.status === 'upcoming',
        canRate: trip.status === 'completed' && trip.user_id === session.user.id && !trip.rating,
        canAddFeedback: trip.status === 'completed'
      }
    });

  } catch (error) {
    console.error('Trip completion fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
