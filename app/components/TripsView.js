'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import RatingForm from './RatingForm';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TripsView({ user, trips: initialTrips = [], successMessage = null, statusMessages = [], connectionStatus = 'disconnected' }) {
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [cancellingTrip, setCancellingTrip] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingTrip, setRatingTrip] = useState(null);
  const [rebookingTrip, setRebookingTrip] = useState(null);
  const [trips, setTrips] = useState(initialTrips);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Filter trips based on status
  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  // Use filtered trips for display
  const displayTrips = filteredTrips;
  
  // Function to start trip cancellation
  const startCancellation = (tripId) => {
    setCancellingTrip(tripId);
  };
  
  // Function to cancel cancellation
  const cancelCancellation = () => {
    setCancellingTrip(null);
    setCancelReason('');
  };
  
  // Function to submit trip cancellation
  const submitCancellation = async (tripId) => {
    setIsSubmitting(true);
    try {
      // Update trip status to cancelled in Supabase
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'cancelled',
          cancellation_reason: cancelReason || 'Customer cancelled',
          refund_status: 'Pending'
        })
        .eq('id', tripId)
        .select();
        
      if (error) {
        console.error('Error cancelling trip:', error);
        console.error('Error details:', JSON.stringify(error));
        alert('Failed to cancel trip. Please try again.');
      } else {
        // Create new updated trips array with the cancelled trip
        const updatedTrips = trips.map(trip => 
          trip.id === tripId ? { ...trip, status: 'cancelled', cancellation_reason: cancelReason || 'Customer cancelled', refund_status: 'Pending' } : trip
        );
        
        // Set the trips state with the new array
        setTrips(updatedTrips);
        setFilter('cancelled'); // Switch to cancelled tab to show the result
        
        setCancellingTrip(null);
        setCancelReason('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      console.error('Error details:', JSON.stringify(err));
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle rating submission
  const handleRatingSubmitted = (updatedTrip) => {
    // Create new trips array with the updated trip
    const updatedTrips = trips.map(trip => 
      trip.id === updatedTrip.id ? updatedTrip : trip
    );
    
    // Update the trips state with the new array
    setTrips(updatedTrips);
    
    // Close the rating form
    setRatingTrip(null);
  };
  
  // Function to handle rebooking a trip
  const handleRebookTrip = async (trip) => {
    setRebookingTrip(trip.id);
    setIsSubmitting(true);
    
    try {
      // Create a new trip based on the completed one
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          pickup_address: trip.pickup_address,
          destination_address: trip.destination_address,
          pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          status: 'pending', // Start as pending for dispatcher approval
          price: trip.price,
          special_requirements: trip.special_requirements,
          wheelchair_type: trip.wheelchair_type,
          is_round_trip: trip.is_round_trip,
          distance: trip.distance
        })
        .select();
        
      if (error) {
        console.error('Error inserting new trip:', error);
        console.error('Error details:', JSON.stringify(error));
        throw error;
      }
      
      // Redirect to the new trip's details page
      if (data && data[0]) {
        router.push(`/dashboard/trips/${data[0].id}`);
      }
    } catch (err) {
      console.error('Error rebooking trip:', err);
      console.error('Error details:', JSON.stringify(err));
      alert('Failed to rebook trip. Please try again.');
      setRebookingTrip(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle Pay Now action
  const handlePayNow = async (tripId) => {
    setIsSubmitting(true);
    try {
      // Call the payment API to process payment for the trip
      const response = await fetch('/api/stripe/charge-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripId }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Payment succeeded - update the trip status locally
        const updatedTrips = trips.map(trip => 
          trip.id === tripId ? {
            ...trip,
            status: 'paid_in_progress',
            payment_status: 'paid',
            payment_amount: result.paymentIntent.amount / 100, // Convert from cents
            charged_at: new Date().toISOString(),
            payment_intent_id: result.paymentIntent.id
          } : trip
        );
        
        setTrips(updatedTrips);
        alert('Payment processed successfully! Your trip is now confirmed.');
      } else {
        // Payment failed - show error
        alert(result.error || 'Payment failed. Please check your payment method and try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'status-pending'; // custom class defined in globals.css
      case 'approved_pending_payment':
        return 'status-approved_pending_payment';
      case 'paid_in_progress':
        return 'status-paid_in_progress';
      case 'payment_failed':
        return 'status-payment_failed';
      case 'upcoming':
        return 'status-upcoming';
      case 'in_process':
        return 'status-in-process'; // New status for paid trips
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'in_progress':
        return 'status-in-progress';
      default:
        return 'bg-gray-100 text-[black] dark:bg-gray-800 dark:text-[white]';
    }
  };

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
        {/* Success message */}
        {successMessage && (
          <div className="p-4 mb-6 rounded-md bg-[#5fbfc0]/20 text-[black] dark:bg-[#5fbfc0]/30 dark:text-[white]">
            {successMessage}
          </div>
        )}

        {/* Real-time connection status and header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">Your Trips</h2>
          <div className="flex items-center space-x-4">
            {/* Real-time status indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 
                connectionStatus === 'CHANNEL_ERROR' ? 'bg-red-500' : 
                'bg-yellow-500'
              }`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {connectionStatus === 'SUBSCRIBED' ? 'Live updates' : 
                 connectionStatus === 'CHANNEL_ERROR' ? 'Connection error' : 
                 'Connecting...'}
              </span>
            </div>
            <Link 
              href="/dashboard/book" 
              className="bg-[#5fbfc0] text-white px-4 py-2 rounded-md text-sm hover:bg-[#4aa5a6]"
            >
              Book New Trip
            </Link>
          </div>
        </div>

        {/* Status messages */}
        {statusMessages.length > 0 && (
          <div className="mb-4 space-y-2">
            {statusMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-md text-sm ${
                  msg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                  msg.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                  msg.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{msg.message}</span>
                  <span className="text-xs opacity-75">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="border-b border-white/20 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setFilter('all')}
              className={`pb-3 px-1 font-bold ${filter === 'all' 
                ? 'border-b-2 border-black text-black' 
                : 'border-b-2 border-transparent text-black hover:text-[#5fbfc0]'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`pb-3 px-1 font-bold ${filter === 'pending' 
                ? 'border-b-2 border-black text-black' 
                : 'border-b-2 border-transparent text-black hover:text-[#5fbfc0]'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`pb-3 px-1 font-bold ${filter === 'upcoming' 
                ? 'border-b-2 border-black text-black' 
                : 'border-b-2 border-transparent text-black hover:text-[#5fbfc0]'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('in_process')}
              className={`pb-3 px-1 font-bold ${filter === 'in_process' 
                ? 'border-b-2 border-black text-black' 
                : 'border-b-2 border-transparent text-black hover:text-[#5fbfc0]'}`}
            >
              In Process
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`pb-3 px-1 font-bold ${filter === 'completed' 
                ? 'border-b-2 border-black text-black' 
                : 'border-b-2 border-transparent text-black hover:text-[#5fbfc0]'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`pb-3 px-1 font-bold ${filter === 'cancelled' 
                ? 'border-b-2 border-black text-black' 
                : 'border-b-2 border-transparent text-black hover:text-[#5fbfc0]'}`}
            >
              Cancelled
            </button>
          </nav>
        </div>

        {displayTrips.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-[#5fbfc0] dark:text-[#5fbfc0]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-black">No trips found</h3>
            <p className="mt-1 text-sm text-black/70">
              {trips.length === 0 
                ? "You haven&apos;t booked any trips yet." 
                : `No ${filter !== 'all' ? filter : ''} trips found.`}
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/book"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
              >
                Book your first trip
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="space-y-6">
              {displayTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="mb-2 sm:mb-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(trip.status)}`}>
                        {trip.status === 'pending' ? 'Waiting for Approval' :
                         trip.status === 'approved_pending_payment' ? 'Trip Approved | Processing Payment' :
                         trip.status === 'paid_in_progress' ? 'Trip In Process | PAID' :
                         trip.status === 'payment_failed' ? 'Payment Failed - Action Required' :
                         trip.status === 'upcoming' ? 'Trip Approved | Processing Payment' : 
                         trip.status === 'in_process' ? 'Trip In Process | PAID' :
                         trip.status === 'completed' ? 'Completed' : 
                         trip.status === 'in_progress' ? 'Trip In Progress' : 'Cancelled'}
                      </span>
                      <p className="mt-2 text-sm text-gray-700">
                        {formatDate(trip.pickup_time)}
                      </p>
                    </div>
                    {trip.status === 'completed' && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 mr-2">Rating:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className={`h-4 w-4 ${i < (trip.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">From</p>
                      <p className="text-sm text-gray-700">{trip.pickup_address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">To</p>
                      <p className="text-sm text-gray-700">{trip.destination_address}</p>
                    </div>
                  </div>
                  
                  {trip.status === 'pending' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-black">Wheelchair</p>
                          <p className="text-sm text-gray-600">
                            {trip.wheelchair_type === 'wheelchair' ? 'Yes' : 'No'}
                          </p>
                          {trip.distance && (
                            <p className="text-xs text-gray-500 mt-1">
                              Distance: {trip.distance} miles
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">Round Trip</p>
                          <p className="text-sm text-gray-600">
                            {trip.is_round_trip ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/trips/${trip.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#5fbfc0] hover:bg-[#4aa5a6]"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => startCancellation(trip.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Waiting for dispatcher approval
                          </p>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          Your trip request is being reviewed. You&apos;ll be notified once approved, and payment will be processed automatically.
                        </p>
                        {trip.payment_method_id && (
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Payment method ready: ••••{trip.payment_method_id.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {trip.status === 'upcoming' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-black">Driver</p>
                          <p className="text-sm text-gray-600">
                            {trip.driver 
                              ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                              : (trip.driver_name || 'Not assigned yet')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/trips/${trip.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#5fbfc0] hover:bg-[#4aa5a6]"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => startCancellation(trip.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      
                      {/* Payment Details Section */}
                      {trip.payment_method_id && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Details</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                •••• •••• •••• {trip.payment_method_id.slice(-4)}
                              </span>
                            </div>
                            {trip.payment_status === 'paid' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                PAID
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePayNow(trip.id)}
                                disabled={isSubmitting}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                              >
                                {isSubmitting ? 'Processing...' : 'Pay Now'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Status Display */}
                      {trip.payment_status && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status:</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              trip.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              trip.payment_status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              trip.payment_status === 'refunded' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {trip.payment_status === 'paid' ? 'Paid' :
                               trip.payment_status === 'failed' ? 'Payment Failed' :
                               trip.payment_status === 'refunded' ? 'Refunded' :
                               'Payment Pending'}
                            </span>
                          </div>
                          {trip.payment_amount && trip.payment_status === 'paid' && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Amount: ${trip.payment_amount.toFixed(2)} • Charged on {new Date(trip.charged_at).toLocaleDateString()}
                            </p>
                          )}
                          {trip.payment_status === 'failed' && trip.payment_error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Error: {trip.payment_error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {trip.status === 'completed' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-sm font-medium text-black">Price</p>
                          <p className="text-sm text-gray-600">${trip.price?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div className="flex space-x-2">
                          {!trip.rating && (
                            <button
                              onClick={() => setRatingTrip(trip)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                            >
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Rate
                            </button>
                          )}
                          <button
                            onClick={() => handleRebookTrip(trip)}
                            disabled={isSubmitting && rebookingTrip === trip.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                          >
                            {isSubmitting && rebookingTrip === trip.id ? (
                              <>
                                <svg className="animate-spin w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Rebooking...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Rebook
                              </>
                            )}
                          </button>
                          <Link
                            href={`/dashboard/trips/${trip.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#5fbfc0] hover:bg-[#4aa5a6]"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                      
                      {/* Show rating form if this trip is being rated */}
                      {ratingTrip && ratingTrip.id === trip.id && (
                        <div className="mt-3">
                          <RatingForm trip={trip} onRatingSubmitted={handleRatingSubmitted} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {trip.status === 'cancelled' && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-black">Cancellation reason</p>
                      <p className="text-sm text-gray-600">{trip.cancellation_reason || 'Not specified'}</p>
                      {trip.refund_status && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-black">Refund status</p>
                          <p className="text-sm text-gray-600">{trip.refund_status}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {trip.status === 'in_progress' && (
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-black">Driver</p>
                        <p className="text-sm text-gray-600">
                          {trip.driver 
                            ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                            : (trip.driver_name || 'Not assigned')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/trips/${trip.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#5fbfc0] hover:bg-[#4aa5a6]"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/dashboard/track/${trip.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Track Driver
                        </Link>
                      </div>
                    </div>
                  )}

                  {(trip.status === 'paid_in_progress' || trip.status === 'in_process') && (
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-black">Driver</p>
                        <p className="text-sm text-gray-600">
                          {trip.driver 
                            ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                            : (trip.driver_name || 'Not assigned')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startCancellation(trip.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                        >
                          Cancel Trip
                        </button>
                        <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100">
                          PAID
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100">
                          TRIP IN PROGRESS
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md mx-4 border border-[#DDE5E7] dark:border-[#333333]">
            <h3 className="text-lg font-medium mb-4 text-[black] dark:text-[white]">Cancel Trip</h3>
            <p className="text-[black]/80 dark:text-[white]/80 mb-4">
              Are you sure you want to cancel this trip? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-[black] dark:text-[white] mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md dark:bg-[black] text-[black] dark:text-[white]"
                placeholder="Please provide a reason..."
                rows={3}
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelCancellation}
                className="px-4 py-2 text-sm font-medium text-[black] dark:text-[white] bg-[#F8F9FA] dark:bg-[black] rounded-md hover:bg-[#DDE5E7] dark:hover:bg-[#333333]/50 border border-[#DDE5E7] dark:border-[#333333]"
                disabled={isSubmitting}
              >
                Keep Trip
              </button>
              <button
                onClick={() => submitCancellation(cancellingTrip)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#5fbfc0] rounded-md hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}