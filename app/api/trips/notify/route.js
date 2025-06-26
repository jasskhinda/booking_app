import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * API endpoint for notifying clients about trip status changes
 * Called by the dispatcher app when trip status changes
 */
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify the request comes from a trusted source
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.INTER_APP_SECRET || 'dev-secret-12345';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      tripId, 
      newStatus, 
      previousStatus,
      paymentStatus,
      driverInfo,
      dispatcherNotes,
      cancellationReason,
      notificationType = 'status_change'
    } = await request.json();
    
    if (!tripId || !newStatus) {
      return NextResponse.json({ 
        error: 'Trip ID and new status are required' 
      }, { status: 400 });
    }

    // Get the trip to verify it exists and get user info
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        profiles!inner(id, email, first_name, last_name, stripe_customer_id)
      `)
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Update the trip status and related fields
    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Add specific fields based on status change
    switch (newStatus) {
      case 'upcoming':
        updates.approved_at = new Date().toISOString();
        if (driverInfo) {
          updates.driver_id = driverInfo.driver_id;
          updates.driver_name = driverInfo.driver_name;
        }
        break;
        
      case 'cancelled':
        updates.cancelled_at = new Date().toISOString();
        if (cancellationReason) {
          updates.cancellation_reason = cancellationReason;
        }
        break;
        
      case 'completed':
        updates.completed_at = new Date().toISOString();
        break;
    }

    // Add payment status if provided
    if (paymentStatus) {
      updates.payment_status = paymentStatus;
    }

    // Add dispatcher notes if provided
    if (dispatcherNotes) {
      updates.dispatcher_notes = dispatcherNotes;
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

    // Generate user-friendly notification message
    const notificationMessage = generateNotificationMessage(
      previousStatus, 
      newStatus, 
      paymentStatus, 
      cancellationReason
    );

    // Send email notification to the client (optional)
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      await sendStatusChangeEmail(trip.profiles, updatedTrip, notificationMessage);
    }

    // Log the status change for debugging
    console.log(`📡 Trip ${tripId} status updated: ${previousStatus} → ${newStatus}`);
    if (paymentStatus) {
      console.log(`💳 Payment status: ${paymentStatus}`);
    }

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
      notification: {
        message: notificationMessage,
        type: getNotificationType(newStatus, paymentStatus),
        timestamp: new Date().toISOString()
      },
      message: 'Trip status updated and client notified successfully'
    });

  } catch (error) {
    console.error('Trip notification error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve notification history for a trip
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get trip with timeline information
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', session.user.id) // Ensure user can only access their own trips
      .single();

    if (tripError) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Build timeline from trip data
    const timeline = buildTripTimeline(trip);

    return NextResponse.json({
      success: true,
      trip,
      timeline
    });

  } catch (error) {
    console.error('Notification history error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to generate user-friendly messages
function generateNotificationMessage(previousStatus, newStatus, paymentStatus, cancellationReason) {
  switch (newStatus) {
    case 'upcoming':
      if (paymentStatus === 'paid') {
        return '🎉 Great news! Your trip has been approved and payment has been processed successfully. A driver will be assigned shortly.';
      } else if (paymentStatus === 'failed') {
        return '✅ Your trip has been approved, but there was an issue processing payment. Please update your payment method.';
      } else {
        return '✅ Your trip has been approved! A driver will be assigned and you\'ll receive further updates.';
      }
      
    case 'cancelled':
      const reason = cancellationReason ? ` Reason: ${cancellationReason}` : '';
      return `❌ Your trip has been cancelled by the dispatcher.${reason} If you have any questions, please contact us.`;
      
    case 'completed':
      return '🎉 Your trip has been completed! Thank you for choosing our service. You can now rate your experience.';
      
    case 'in_progress':
      return '🚗 Your trip is now in progress. You can track your driver in real-time.';
      
    default:
      return `Your trip status has been updated to: ${newStatus}`;
  }
}

// Helper function to determine notification type for UI styling
function getNotificationType(status, paymentStatus) {
  if (status === 'upcoming' && paymentStatus === 'paid') return 'success';
  if (status === 'upcoming' && paymentStatus === 'failed') return 'warning';
  if (status === 'cancelled') return 'error';
  if (status === 'completed') return 'success';
  return 'info';
}

// Helper function to build trip timeline
function buildTripTimeline(trip) {
  const timeline = [];
  
  if (trip.created_at) {
    timeline.push({
      status: 'pending',
      timestamp: trip.created_at,
      message: 'Trip request submitted',
      type: 'info'
    });
  }
  
  if (trip.approved_at) {
    timeline.push({
      status: 'upcoming',
      timestamp: trip.approved_at,
      message: 'Trip approved by dispatcher',
      type: 'success'
    });
  }
  
  if (trip.charged_at) {
    timeline.push({
      status: 'payment_charged',
      timestamp: trip.charged_at,
      message: `Payment of $${trip.payment_amount?.toFixed(2) || trip.price?.toFixed(2)} processed`,
      type: 'success'
    });
  }
  
  if (trip.cancelled_at) {
    timeline.push({
      status: 'cancelled',
      timestamp: trip.cancelled_at,
      message: trip.cancellation_reason || 'Trip cancelled',
      type: 'error'
    });
  }
  
  if (trip.completed_at) {
    timeline.push({
      status: 'completed',
      timestamp: trip.completed_at,
      message: 'Trip completed successfully',
      type: 'success'
    });
  }
  
  if (trip.rated_at) {
    timeline.push({
      status: 'rated',
      timestamp: trip.rated_at,
      message: `Service rated: ${trip.rating}/5 stars`,
      type: 'info'
    });
  }
  
  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Helper function to send email notifications (placeholder)
async function sendStatusChangeEmail(userProfile, trip, message) {
  // This would integrate with your email service (Brevo, SendGrid, etc.)
  console.log(`📧 Email notification would be sent to ${userProfile.email}: ${message}`);
  
  // Example email integration:
  // await emailService.send({
  //   to: userProfile.email,
  //   subject: 'Trip Status Update',
  //   template: 'trip-status-change',
  //   data: { trip, message, userProfile }
  // });
}
