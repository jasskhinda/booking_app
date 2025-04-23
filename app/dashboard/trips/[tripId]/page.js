'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function TripDetailsPage() {
  const params = useParams();
  const tripId = params.tripId;
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [cancellingTrip, setCancellingTrip] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Fetch trip data
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .eq('user_id', session.user.id)
          .single();
          
        // If trip has a driver_id, fetch driver information separately
        if (tripData && tripData.driver_id) {
          const { data: driverData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, full_name, avatar_url, phone_number')
            .eq('id', tripData.driver_id)
            .single();
            
          if (driverData) {
            // Get driver email from auth
            const { data: userData } = await supabase
              .from('users')
              .select('email')
              .eq('id', tripData.driver_id)
              .single();
              
            // Add driver information to trip data
            tripData.driver = {
              id: tripData.driver_id,
              email: userData?.email,
              profile: driverData
            };
          }
        }
        
        if (tripError) {
          if (tripError.code === 'PGRST116') {
            setError('Trip not found or you do not have permission to view it.');
          } else {
            setError(tripError.message || 'Failed to load trip data');
          }
          return;
        }
        
        setTrip(tripData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [tripId, router, supabase]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // Handle cancellation
  const handleCancelTrip = async () => {
    if (!trip || trip.status === 'completed' || trip.status === 'cancelled') return;
    
    setIsSubmitting(true);
    try {
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
        throw new Error('Failed to cancel trip. Please try again.');
      }
      
      // Update local trip state
      setTrip({
        ...trip,
        status: 'cancelled',
        cancellation_reason: cancelReason || 'Customer cancelled',
        refund_status: 'Pending'
      });
      
      setCancellingTrip(false);
      setCancelReason('');
      setSuccessMessage('Trip cancelled successfully');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'status-pending';
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

  if (loading) {
    return (
      <DashboardLayout user={null} activeTab="trips">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7CCFD0]"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout user={user} activeTab="trips">
        <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5]">Trip Details</h2>
            <Link 
              href="/dashboard/trips" 
              className="text-[#7CCFD0] hover:text-[#60BFC0]"
            >
              Back to All Trips
            </Link>
          </div>
          
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-[#7CCFD0] text-white rounded-md hover:bg-[#60BFC0]"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!trip) {
    return (
      <DashboardLayout user={user} activeTab="trips">
        <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5]">Trip Details</h2>
            <Link 
              href="/dashboard/trips" 
              className="text-[#7CCFD0] hover:text-[#60BFC0]"
            >
              Back to All Trips
            </Link>
          </div>
          
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md">
            <p>Trip not found.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activeTab="trips">
      <div className="bg-[#F8F9FA] dark:bg-[#24393C] rounded-lg shadow-md border border-[#DDE5E7] dark:border-[#3F5E63] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#2E4F54] dark:text-[#E0F4F5]">Trip Details</h2>
          <Link 
            href="/dashboard/trips" 
            className="text-[#7CCFD0] hover:text-[#60BFC0] flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Trips
          </Link>
        </div>
        
        {successMessage && (
          <div className="p-4 mb-6 rounded-md bg-[#7CCFD0]/20 text-[#2E4F54] dark:bg-[#7CCFD0]/30 dark:text-[#E0F4F5]">
            {successMessage}
          </div>
        )}
        
        {/* Trip Status */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(trip.status)}`}>
            {trip.status === 'pending' ? 'Pending Approval' :
             trip.status === 'upcoming' ? 'Upcoming' : 
             trip.status === 'completed' ? 'Completed' : 
             trip.status === 'in_progress' ? 'In Progress' : 'Cancelled'}
          </span>
          <p className="mt-2 text-sm text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
            Trip ID: {trip.id}
          </p>
        </div>
        
        {/* Trip Details Card */}
        <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
          <h3 className="text-lg font-medium mb-4 text-[#2E4F54] dark:text-[#E0F4F5]">Trip Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Pickup Time</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{formatDate(trip.pickup_time)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Booking Date</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{formatDate(trip.created_at)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">From</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.pickup_address}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">To</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.destination_address}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Wheelchair Required</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">
                {trip.wheelchair_type === 'wheelchair' ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Round Trip</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">
                {trip.is_round_trip ? 'Yes' : 'No'}
              </p>
            </div>
            
            {trip.distance && (
              <div>
                <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Distance</p>
                <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.distance} miles</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Price</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">${trip.price?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Driver Information (if assigned) */}
        {(trip.driver_id || trip.driver) && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[#2E4F54] dark:text-[#E0F4F5]">Driver Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Driver Name</p>
                <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">
                  {trip.driver 
                    ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                    : (trip.driver_name || 'Not assigned')
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Vehicle</p>
                <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.vehicle || 'Not available'}</p>
              </div>
              
              {trip.driver?.profile?.phone_number && (
                <div>
                  <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Contact</p>
                  <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.driver.profile.phone_number}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Status-specific sections */}
        {trip.status === 'completed' && trip.rating && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[#2E4F54] dark:text-[#E0F4F5]">Your Rating</h3>
            
            <div className="flex items-center mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i}
                    className={`h-5 w-5 ${i < (trip.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-[#2E4F54] dark:text-[#E0F4F5]">{trip.rating} out of 5</span>
            </div>
            
            {trip.review && (
              <div>
                <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Your Review</p>
                <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.review}</p>
              </div>
            )}
          </div>
        )}
        
        {trip.status === 'cancelled' && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[#2E4F54] dark:text-[#E0F4F5]">Cancellation Details</h3>
            
            <div>
              <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Reason</p>
              <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.cancellation_reason || 'Customer cancelled'}</p>
            </div>
            
            {trip.refund_status && (
              <div className="mt-3">
                <p className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">Refund Status</p>
                <p className="text-sm text-[#2E4F54]/90 dark:text-[#E0F4F5]/90">{trip.refund_status}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {(trip.status === 'pending' || trip.status === 'upcoming') && (
            <button
              onClick={() => setCancellingTrip(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Cancel Trip
            </button>
          )}
          
          {trip.status === 'in_progress' && (
            <Link
              href={`/dashboard/track/${trip.id}`}
              className="px-4 py-2 bg-[#7CCFD0] hover:bg-[#60BFC0] text-white rounded-md inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Track Driver
            </Link>
          )}
          
          {trip.status === 'completed' && !trip.rating && (
            <Link
              href={`/dashboard/trips?rate=${trip.id}`}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
            >
              Rate Trip
            </Link>
          )}
          
          {trip.status === 'completed' && (
            <button
              onClick={() => router.push(`/dashboard/book?rebook=${trip.id}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Book Similar Trip
            </button>
          )}
        </div>
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
                onClick={() => setCancellingTrip(false)}
                className="px-4 py-2 text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] bg-[#F8F9FA] dark:bg-[#1C2C2F] rounded-md hover:bg-[#DDE5E7] dark:hover:bg-[#3F5E63]/50 border border-[#DDE5E7] dark:border-[#3F5E63]"
                disabled={isSubmitting}
              >
                Keep Trip
              </button>
              <button
                onClick={handleCancelTrip}
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