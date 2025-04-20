'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import RatingForm from './RatingForm';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TripsView({ user, trips: initialTrips = [], successMessage = null }) {
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
      case 'upcoming':
        return 'status-upcoming';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'in_progress':
        return 'status-in-progress';
      default:
        return 'bg-gray-100 text-[#2E4F54] dark:bg-gray-800 dark:text-[#E0F4F5]';
    }
  };

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5]">Your Trips</h2>
          <Link 
            href="/dashboard/book" 
            className="bg-[#7CCFD0] text-white px-4 py-2 rounded-md text-sm hover:bg-[#60BFC0]"
          >
            Book New Trip
          </Link>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="p-4 mb-6 rounded-md bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]">
            {successMessage}
          </div>
        )}

        {/* Filter tabs */}
        <div className="border-b border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setFilter('all')}
              className={`pb-3 px-1 ${filter === 'all' 
                ? 'border-b-2 border-[#7CCFD0] text-[#7CCFD0] font-medium' 
                : 'border-b-2 border-transparent text-[#2E4F54] hover:text-[#7CCFD0] dark:text-[#E0F4F5]/70 dark:hover:text-[#7CCFD0]'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`pb-3 px-1 ${filter === 'pending' 
                ? 'border-b-2 border-[#7CCFD0] text-[#7CCFD0] font-medium' 
                : 'border-b-2 border-transparent text-[#2E4F54] hover:text-[#7CCFD0] dark:text-[#E0F4F5]/70 dark:hover:text-[#7CCFD0]'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`pb-3 px-1 ${filter === 'upcoming' 
                ? 'border-b-2 border-[#7CCFD0] text-[#7CCFD0] font-medium' 
                : 'border-b-2 border-transparent text-[#2E4F54] hover:text-[#7CCFD0] dark:text-[#E0F4F5]/70 dark:hover:text-[#7CCFD0]'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`pb-3 px-1 ${filter === 'completed' 
                ? 'border-b-2 border-[#7CCFD0] text-[#7CCFD0] font-medium' 
                : 'border-b-2 border-transparent text-[#2E4F54] hover:text-[#7CCFD0] dark:text-[#E0F4F5]/70 dark:hover:text-[#7CCFD0]'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`pb-3 px-1 ${filter === 'cancelled' 
                ? 'border-b-2 border-[#7CCFD0] text-[#7CCFD0] font-medium' 
                : 'border-b-2 border-transparent text-[#2E4F54] hover:text-[#7CCFD0] dark:text-[#E0F4F5]/70 dark:hover:text-[#7CCFD0]'}`}
            >
              Cancelled
            </button>
          </nav>
        </div>

        {displayTrips.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-[#7CCFD0] dark:text-[#7CCFD0]" 
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
            <h3 className="mt-2 text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">No trips found</h3>
            <p className="mt-1 text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
              {trips.length === 0 
                ? "You haven't booked any trips yet." 
                : `No ${filter !== 'all' ? filter : ''} trips found.`}
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/book"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0]"
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
                  className="bg-white dark:bg-[#1C2C2F] rounded-lg p-4 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63]"
                >
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="mb-2 sm:mb-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(trip.status)}`}>
                        {trip.status === 'pending' ? 'Pending Approval' :
                         trip.status === 'upcoming' ? 'Upcoming' : 
                         trip.status === 'completed' ? 'Completed' : 
                         trip.status === 'in_progress' ? 'In Progress' : 'Cancelled'}
                      </span>
                      <p className="mt-2 text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
                        {formatDate(trip.pickup_time)}
                      </p>
                    </div>
                    {trip.status === 'completed' && (
                      <div className="flex items-center">
                        <span className="text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mr-2">Rating:</span>
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
                      <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">From</p>
                      <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.pickup_address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">To</p>
                      <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.destination_address}</p>
                    </div>
                  </div>
                  
                  {trip.status === 'pending' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Wheelchair</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.wheelchair_type === 'wheelchair' ? 'Yes' : 'No'}
                          </p>
                          {trip.distance && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Distance: {trip.distance} miles
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Round Trip</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.is_round_trip ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/trips/${trip.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => startCancellation(trip.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                        Your request is pending approval from a dispatcher
                      </div>
                    </div>
                  )}
                  
                  {trip.status === 'upcoming' && (
                    <div className="mt-4 flex justify-between">
                      <div>
                        <p className="text-sm font-medium">Driver</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {trip.driver 
                            ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                            : (trip.driver_name || 'Not assigned yet')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/trips/${trip.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => startCancellation(trip.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {trip.status === 'completed' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-sm font-medium">Price</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">${trip.price?.toFixed(2) || 'N/A'}</p>
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
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
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
                      <p className="text-sm font-medium">Cancellation reason</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{trip.cancellation_reason || 'Not specified'}</p>
                      {trip.refund_status && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Refund status</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{trip.refund_status}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {trip.status === 'in_progress' && (
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Driver</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {trip.driver 
                            ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                            : (trip.driver_name || 'Not assigned')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/trips/${trip.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#24393C] rounded-lg p-6 w-full max-w-md mx-4 border border-[#DDE5E7] dark:border-[#3F5E63]">
            <h3 className="text-lg font-medium mb-4 text-[#2E4F54] dark:text-[#E0F4F5]">Cancel Trip</h3>
            <p className="text-[#2E4F54]/80 dark:text-[#E0F4F5]/80 mb-4">
              Are you sure you want to cancel this trip? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[#2E4F54] dark:text-[#E0F4F5]"
                placeholder="Please provide a reason..."
                rows={3}
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelCancellation}
                className="px-4 py-2 text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] bg-[#F8F9FA] dark:bg-[#1C2C2F] rounded-md hover:bg-[#DDE5E7] dark:hover:bg-[#3F5E63]/50 border border-[#DDE5E7] dark:border-[#3F5E63]"
                disabled={isSubmitting}
              >
                Keep Trip
              </button>
              <button
                onClick={() => submitCancellation(cancellingTrip)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#7CCFD0] rounded-md hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0]"
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