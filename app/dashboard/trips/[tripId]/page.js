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
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Function to fetch payment method details
  const fetchPaymentMethodDetails = async (paymentMethodId) => {
    try {
      const response = await fetch(`/api/stripe/payment-method/${paymentMethodId}`);
      const data = await response.json();
      
      if (response.ok && data.paymentMethod) {
        setPaymentMethod(data.paymentMethod);
      }
    } catch (error) {
      console.error('Error fetching payment method details:', error);
      // Don't show error to user for payment method fetch failures
    }
  };

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
        
        // Fetch payment method details if available
        if (tripData.payment_method_id) {
          await fetchPaymentMethodDetails(tripData.payment_method_id);
        }
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
      // Check if cancellation is before the day of the ride
      const pickupDate = new Date(trip.pickup_time);
      pickupDate.setHours(0, 0, 0, 0); // start of pickup day
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // start of today
      
      const cancelWithoutCharge = pickupDate > today;
      
      let refundStatus = 'Pending';
      let refundAmount = null;
      
      // Free cancellation if it's before the day of the ride
      if (cancelWithoutCharge) {
        refundStatus = 'Full Refund Pending';
        refundAmount = trip.price;
      } else {
        // Charge only base fare (one-way = $50, round-trip = $100) if canceled on the day of ride
        refundStatus = 'Partial Refund Pending';
        refundAmount = trip.is_round_trip ? trip.price - 100 : trip.price - 50;
        // If computed refund amount is negative or zero, no refund
        if (refundAmount <= 0) {
          refundStatus = 'No Refund';
          refundAmount = 0;
        }
      }
      
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'cancelled',
          cancellation_reason: cancelReason || 'Customer cancelled',
          refund_status: refundStatus,
          refund_amount: refundAmount
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
        refund_status: refundStatus,
        refund_amount: refundAmount
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
  
  // Handle retry payment for failed payments
  const handleRetryPayment = async (tripId) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Call the payment retry API
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
        setTrip(prevTrip => ({
          ...prevTrip,
          status: 'paid_in_progress',
          payment_status: 'paid',
          payment_amount: result.paymentIntent.amount / 100, // Convert from cents
          charged_at: new Date().toISOString(),
          payment_intent_id: result.paymentIntent.id
        }));
        
        setSuccessMessage('Payment processed successfully! Your trip is now confirmed.');
      } else {
        // Payment failed - show error
        setError(result.error || 'Payment failed. Please check your payment method and try again.');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'status-pending';
      case 'approved_pending_payment':
        return 'status-approved_pending_payment';
      case 'paid_in_progress':
        return 'status-paid_in_progress';
      case 'payment_failed':
        return 'status-payment_failed';
      case 'upcoming':
        return 'status-upcoming';
      case 'in_process':
        return 'status-in-process';
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

  if (loading) {
    return (
      <DashboardLayout user={null} activeTab="trips">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5fbfc0]"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout user={user} activeTab="trips">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-black">Trip Details</h2>
            <Link 
              href="/dashboard/trips" 
              className="text-[#5fbfc0] hover:text-[#60BFC0]"
            >
              Back to All Trips
            </Link>
          </div>
          
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-[#5fbfc0] text-white rounded-md hover:bg-[#60BFC0]"
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
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Trip Details</h2>
          <Link 
            href="/dashboard/trips" 
            className="text-[#5fbfc0] hover:text-[#60BFC0]"
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
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Trip Details</h2>
          <Link 
            href="/dashboard/trips" 
            className="text-[#5fbfc0] hover:text-[#60BFC0] flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Trips
          </Link>
        </div>
        
        {successMessage && (
          <div className="p-4 mb-6 rounded-md bg-[#5fbfc0]/20 text-[black] dark:bg-[#5fbfc0]/30 dark:text-[white]">
            {successMessage}
          </div>
        )}
        
        {/* Trip Status */}
        <div className="mb-6">
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
          
          {/* Payment Status Indicator */}
          {(trip.status === 'approved_pending_payment' || trip.status === 'paid_in_progress' || trip.status === 'payment_failed') && (
            <div className="mt-2">
              {trip.status === 'approved_pending_payment' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment
                </span>
              )}
              {trip.status === 'paid_in_progress' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  PAID
                </span>
              )}
              {trip.status === 'payment_failed' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Automatic payment failed
                </span>
              )}
            </div>
          )}
          
          <p className="mt-2 text-sm text-[black]/70 dark:text-[white]/70">
            Trip ID: {trip.id}
          </p>
        </div>
        
        {/* Trip Details Card */}
        <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
          <h3 className="text-lg font-medium mb-4 text-[black] dark:text-[white]">Trip Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">Pickup Time</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">{formatDate(trip.pickup_time)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">Booking Date</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">{formatDate(trip.created_at)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">From</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.pickup_address}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">To</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.destination_address}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">Wheelchair Required</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">
                {trip.wheelchair_type === 'wheelchair' ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">Round Trip</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">
                {trip.is_round_trip ? 'Yes' : 'No'}
              </p>
            </div>
            
            {trip.distance && (
              <div>
                <p className="text-sm font-medium text-[black] dark:text-[white]">Distance</p>
                <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.distance} miles</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">Price</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">${trip.price?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Payment Information Section */}
        {(trip.payment_method_id || trip.payment_status || trip.status === 'payment_failed') && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[black] dark:text-[white]">Payment Details</h3>
            
            <div className="space-y-4">
              {/* Payment Method */}
              {trip.payment_method_id && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">💳</div>
                    <div>
                      <p className="text-sm font-medium text-[black] dark:text-[white]">
                        •••• •••• •••• {paymentMethod?.card?.last4 || trip.payment_method_id.slice(-4)}
                      </p>
                      <p className="text-xs text-[black]/70 dark:text-[white]/70">
                        {paymentMethod?.card?.brand?.toUpperCase() || 'Card'} • Default payment method
                        {paymentMethod?.card && ` • Expires ${String(paymentMethod.card.exp_month).padStart(2, '0')}/${String(paymentMethod.card.exp_year).slice(-2)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[black] dark:text-[white]">${trip.price?.toFixed(2) || 'N/A'}</p>
                    {trip.payment_status === 'paid' && trip.charged_at && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Charged on {new Date(trip.charged_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Payment Status Messages */}
              {trip.status === 'approved_pending_payment' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Processing Payment</p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        Your payment is being processed automatically. This usually takes a few moments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {trip.status === 'paid_in_progress' && trip.payment_status === 'paid' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Payment Successful</p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Your payment of ${trip.payment_amount?.toFixed(2) || trip.price?.toFixed(2)} has been processed successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {trip.status === 'payment_failed' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Automatic payment failed</p>
                      <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                        {trip.payment_error || 'There was an issue processing your payment automatically. Please try again or update your payment method.'}
                      </p>
                      <button
                        onClick={() => handleRetryPayment(trip.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Pay Now to process with the booking
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Driver Information (if assigned) */}
        {(trip.driver_id || trip.driver) && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[black] dark:text-[white]">Driver Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-[black] dark:text-[white]">Driver Name</p>
                <p className="text-sm text-[black]/90 dark:text-[white]/90">
                  {trip.driver 
                    ? (trip.driver.profile?.full_name || `${trip.driver.profile?.first_name || ''} ${trip.driver.profile?.last_name || ''}`.trim() || trip.driver_name || trip.driver.email) 
                    : (trip.driver_name || 'Not assigned')
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-[black] dark:text-[white]">Vehicle</p>
                <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.vehicle || 'Not available'}</p>
              </div>
              
              {trip.driver?.profile?.phone_number && (
                <div>
                  <p className="text-sm font-medium text-[black] dark:text-[white]">Contact</p>
                  <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.driver.profile.phone_number}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Status-specific sections */}
        {trip.status === 'completed' && trip.rating && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[black] dark:text-[white]">Your Rating</h3>
            
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
              <span className="ml-2 text-sm text-[black] dark:text-[white]">{trip.rating} out of 5</span>
            </div>
            
            {trip.review && (
              <div>
                <p className="text-sm font-medium text-[black] dark:text-[white]">Your Review</p>
                <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.review}</p>
              </div>
            )}
          </div>
        )}
        
        {trip.status === 'cancelled' && (
          <div className="bg-white dark:bg-[#1C2C2F] rounded-lg p-5 shadow-sm border border-[#DDE5E7] dark:border-[#3F5E63] mb-6">
            <h3 className="text-lg font-medium mb-4 text-[black] dark:text-[white]">Cancellation Details</h3>
            
            <div>
              <p className="text-sm font-medium text-[black] dark:text-[white]">Reason</p>
              <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.cancellation_reason || 'Customer cancelled'}</p>
            </div>
            
            {trip.refund_status && (
              <div className="mt-3">
                <p className="text-sm font-medium text-[black] dark:text-[white]">Refund Status</p>
                <p className="text-sm text-[black]/90 dark:text-[white]/90">{trip.refund_status}</p>
                {trip.refund_amount > 0 && (
                  <p className="text-sm text-[black]/90 dark:text-[white]/90 mt-1">
                    Refund Amount: ${trip.refund_amount?.toFixed(2)}
                  </p>
                )}
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

          {trip.status === 'upcoming' && trip.payment_status !== 'paid' && trip.payment_method_id && (
            <button
              onClick={() => handleRetryPayment(trip.id)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Pay Now'}
            </button>
          )}

          {(trip.status === 'paid_in_progress' || trip.status === 'in_process') && (
            <>
              <button
                onClick={() => setCancellingTrip(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Cancel Trip
              </button>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-medium">
                PAID
              </span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md font-medium">
                TRIP IN PROGRESS
              </span>
            </>
          )}
          
          {trip.status === 'in_progress' && (
            <Link
              href={`/dashboard/track/${trip.id}`}
              className="px-4 py-2 bg-[#5fbfc0] hover:bg-[#60BFC0] text-white rounded-md inline-flex items-center"
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
                className="w-full p-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md dark:bg-[#1C2C2F] text-[black] dark:text-[white]"
                placeholder="Please provide a reason..."
                rows={3}
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCancellingTrip(false)}
                className="px-4 py-2 text-sm font-medium text-[black] dark:text-[white] bg-[#F8F9FA] dark:bg-[#1C2C2F] rounded-md hover:bg-[#DDE5E7] dark:hover:bg-[#3F5E63]/50 border border-[#DDE5E7] dark:border-[#3F5E63]"
                disabled={isSubmitting}
              >
                Keep Trip
              </button>
              <button
                onClick={handleCancelTrip}
                className="px-4 py-2 text-sm font-medium text-white bg-[#5fbfc0] rounded-md hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
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