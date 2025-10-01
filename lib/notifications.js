/**
 * Email notifications for new trip bookings
 * Configured with SendPulse SMTP - sends to app@compassionatecaretransportation.com
 * Deployed: October 2025
 */
const { sendEmailToMany } = require('./email');

/**
 * Format a date in a nice readable format
 * @param {string|Date} dateStr - Date to format
 * @returns {string} - Formatted date
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

/**
 * Send a notification to all dispatchers about a new trip booking
 * @param {Object} trip - Trip data
 * @param {Object} user - User data who booked the trip
 * @returns {Promise<Object>} - Notification result
 */
async function notifyDispatchersOfNewTrip(trip, user) {
  try {
    // Send notification to the main app email instead of individual dispatchers
    const notificationEmail = 'app@compassionatecaretransportation.com';
    const dispatcherEmails = [notificationEmail];

    console.log('Sending trip notification to:', notificationEmail);

    // Determine client information
    // For facility bookings, trip has managed_client_id
    // For direct bookings, trip has user_id
    let clientName = 'Unknown Client';
    let clientEmail = 'Not available';
    let bookingType = 'Direct Booking';

    if (trip.managed_client_id) {
      // Facility booking - use enriched client_info if available
      if (trip.client_info) {
        clientName = `${trip.client_info.first_name} ${trip.client_info.last_name}`;
        // For facility bookings, show client email in parentheses
        const clientEmailInfo = trip.client_info.email ? ` (Client: ${trip.client_info.email})` : '';

        // Use facility email as the main email
        if (trip.facility_info && trip.facility_info.contact_email) {
          clientEmail = `${trip.facility_info.contact_email}${clientEmailInfo}`;
        } else {
          clientEmail = trip.client_info.email || 'No email on file';
        }
      } else {
        // Fallback to old method
        clientName = trip.client_name || trip.passenger_name || `Managed Client ${trip.managed_client_id.slice(0, 8)}`;
        clientEmail = trip.client_email || 'No email on file';
      }

      bookingType = 'Facility Booking';
    } else {
      // Direct booking - use session user info
      clientName = user.user_metadata?.full_name || user.email || 'Direct Client';
      clientEmail = user.email || 'Not available';
      bookingType = 'Direct Booking';
    }

    // Prepare email content
    const subject = `New Trip Request: ${trip.id}`;

    // Create a text version of the email
    const text = `
      NEW TRIP REQUEST

      Trip ID: ${trip.id}
      Status: ${trip.status}
      Booking Type: ${bookingType}

      Client: ${clientName}
      Email: ${clientEmail}
      
      Pickup: ${trip.pickup_address}
      Destination: ${trip.destination_address}
      
      Pickup Time: ${formatDate(trip.pickup_time)}
      
      Wheelchair Required: ${trip.wheelchair_type === 'wheelchair' ? 'Yes' : 'No'}
      Round Trip: ${trip.is_round_trip ? 'Yes' : 'No'}
      
      Distance: ${trip.distance ? `${trip.distance} miles` : 'Not calculated'}
      Estimated Price: ${trip.price ? `$${trip.price}` : 'Not calculated'}
      
      Special Requirements: ${trip.special_requirements || 'None'}
      
      Please log in to the dispatcher portal to approve or decline this trip request.
    `.trim().replace(/\n {6}/g, '\n');
    
    // Create an HTML version of the email with better formatting
    const dispatcherPortalUrl = 'https://dispatch.compassionatecaretransportation.com';
    const tripDetailsUrl = `${dispatcherPortalUrl}/trips/${trip.id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Trip Request</h1>

        <p style="font-size: 16px; margin-bottom: 25px;">A new trip has been requested and is awaiting your approval.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #1f2937;">Trip Details</h2>

          <p><strong>Trip ID:</strong> ${trip.id}</p>
          <p><strong>Status:</strong> <span style="color: #7c3aed; font-weight: bold;">${trip.status}</span></p>
          <p><strong>Booking Type:</strong> <span style="color: ${bookingType === 'Facility Booking' ? '#2563eb' : '#059669'}; font-weight: bold;">${bookingType}</span></p>

          <div style="margin: 20px 0; border-top: 1px solid #d1d5db;"></div>

          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Email:</strong> ${clientEmail}</p>

          <div style="margin: 20px 0; border-top: 1px solid #d1d5db;"></div>

          <p><strong>Pickup:</strong> ${trip.pickup_address}</p>
          <p><strong>Destination:</strong> ${trip.destination_address}</p>
          <p><strong>Pickup Time:</strong> ${formatDate(trip.pickup_time)}</p>

          <div style="margin: 20px 0; border-top: 1px solid #d1d5db;"></div>

          <p><strong>Wheelchair Required:</strong> ${trip.wheelchair_type === 'wheelchair' ? 'Yes' : 'No'}</p>
          <p><strong>Round Trip:</strong> ${trip.is_round_trip ? 'Yes' : 'No'}</p>
          <p><strong>Distance:</strong> ${trip.distance ? `${trip.distance} miles` : 'Not calculated'}</p>
          <p><strong>Estimated Price:</strong> ${trip.price ? `$${trip.price}` : 'Not calculated'}</p>

          ${trip.special_requirements ? `
            <div style="margin: 20px 0; border-top: 1px solid #d1d5db;"></div>
            <p><strong>Special Requirements:</strong> ${trip.special_requirements}</p>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${tripDetailsUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            VIEW TRIP DETAILS
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; text-align: center;">Please log in to the dispatcher portal to approve or decline this trip request.</p>
      </div>
    `;
    
    // Send email to all dispatchers
    const result = await sendEmailToMany({
      to: dispatcherEmails,
      subject,
      text,
      html
    });
    
    if (!result.success) {
      console.error('Failed to send emails to all dispatchers:', result.error);
    } else {
      console.log('Notification sent to dispatchers:', result.info);
    }
    
    return result;
  } catch (error) {
    console.error('Error in notifyDispatchersOfNewTrip:', error);
    return { success: false, error: error.message };
  }
}

// Export for CommonJS compatibility
module.exports = {
  notifyDispatchersOfNewTrip
};