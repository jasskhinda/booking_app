'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/client-supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';
import { getStripe } from '@/lib/stripe';
import logger from '@/lib/logger';

// Card setup form component
export function CardSetupForm({ clientSecret, onSuccess, onError, onCancel, profile, user }) {
  const [processing, setProcessing] = useState(false);
  const stripe = useRef(null);
  const elements = useRef(null);
  const cardElement = useRef(null);
  const [cardReady, setCardReady] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState('');
  
  // Initialize Stripe when component loads
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        console.log('Initializing Stripe with client secret:', clientSecret);
        stripe.current = await getStripe();
        console.log('Stripe loaded:', !!stripe.current);
        if (!stripe.current) {
          throw new Error('Failed to load Stripe. Please refresh and try again.');
        }
        
        elements.current = stripe.current.elements({
          clientSecret: clientSecret,
        });
        console.log('Elements created:', !!elements.current);
        
        cardElement.current = elements.current.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#ffffff',
              backgroundColor: 'transparent',
              fontFamily: 'Arial, sans-serif',
              '::placeholder': {
                color: '#bbb',
              },
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a'
            }
          },
        });
        console.log('Card element created:', !!cardElement.current);
        
        // Mount the card element to the DOM
        const cardElementContainer = document.getElementById('card-element-container');
        console.log('Card element container found:', !!cardElementContainer);
        if (cardElementContainer) {
          cardElement.current.mount(cardElementContainer);
          cardElement.current.on('ready', () => {
            console.log('Card element ready');
            setCardReady(true);
          });
          cardElement.current.on('change', (event) => {
            console.log('Card element changed:', event);
            if (event.error) {
              onError(new Error(event.error.message));
            }
          });
        } else {
          throw new Error('Card element container not found');
        }
        
        setStripeReady(true);
        console.log('Stripe initialization complete');
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        onError(new Error('Failed to initialize payment form. Please try again later.'));
      }
    };
    
    initializeStripe();
    
    // Cleanup card element on unmount
    return () => {
      if (cardElement.current) {
        cardElement.current.unmount();
      }
    };
  }, [clientSecret, onError]);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('CardSetupForm handleSubmit called');
    console.log('Stripe ready:', !!stripe.current);
    console.log('Elements ready:', !!elements.current);
    console.log('Card element ready:', !!cardElement.current);
    console.log('Client secret:', clientSecret);
    
    setStripeError('');
    if (!stripe.current || !elements.current || !cardElement.current) {
      setStripeError('Payment form is not ready. Please wait a moment and try again.');
      onError(new Error('Stripe is still loading. Please try again in a moment.'));
      return;
    }
    setProcessing(true);
    try {
      console.log('Attempting to confirm card setup...');
      const { error, setupIntent } = await stripe.current.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement.current,
          billing_details: {
            name: profile?.full_name || user?.user_metadata?.full_name || user?.email || '',
            email: user?.email || '',
          },
        },
      });
      console.log('Setup result:', { error, setupIntent });
      if (error) {
        console.error('Stripe error:', error);
        setStripeError(error.message);
        onError(new Error(error.message));
        return;
      }
      console.log('Setup successful, calling onSuccess');
      onSuccess(setupIntent);
    } catch (error) {
      setStripeError(error.message || 'Unexpected error.');
      console.error('Error in CardSetupForm handleSubmit:', error);
      onError(error);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-[#DDE5E7] dark:border-[#333333] rounded-lg bg-white dark:bg-[black]">
      <div className="mb-4">
        <label className="block text-sm font-medium text-[black] dark:text-[white] mb-2">
          Card Information
        </label>
        <div className="p-3 border border-[#DDE5E7] dark:border-[#333333] rounded-md bg-[#1A1A1A] border-[#333333]">
          <div id="card-element-container" className="min-h-[40px]"></div>
        </div>
        {!stripeReady && (
          <p className="mt-2 text-xs text-[black]/70 dark:text-[white]/70">
            Loading payment form...
          </p>
        )}
        {stripeError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{stripeError}</p>
        )}
        <p className="mt-2 text-xs text-black/70 dark:text-white/70">
          Your card information is securely processed by Stripe.
        </p>
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={processing || !stripeReady || !cardReady}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50"
        >
          {processing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : !stripeReady || !cardReady ? "Loading..." : "Add Card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm text-sm font-medium text-black dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Direct setup form without Elements wrapper since we're managing Stripe elements manually
function StripeCardForm({ clientSecret, ...props }) {
  return <CardSetupForm clientSecret={clientSecret} {...props} />;
}

export default function PaymentMethodsManager({ user, profile }) {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(profile?.default_payment_method_id || '');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [hasError, setHasError] = useState(false);

  // Enhanced error logging for production debugging
  useEffect(() => {
    const logComponentMount = () => {
      logger.info('PaymentMethodsManager mounted with props:', {
        userId: user?.id,
        userEmail: user?.email,
        profileId: profile?.id,
        defaultPaymentMethod: profile?.default_payment_method_id,
        timestamp: new Date().toISOString()
      });
    };

    logComponentMount();
  }, [user, profile]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event) => {
      console.error('PaymentMethodsManager runtime error:', event.error);
      setHasError(true);
      setMessage({
        text: 'An unexpected error occurred. Please refresh the page and try again.',
        type: 'error'
      });
    };

    const handleUnhandledRejection = (event) => {
      console.error('PaymentMethodsManager unhandled promise rejection:', event.reason);
      setHasError(true);
      setMessage({
        text: 'A network error occurred. Please check your connection and try again.',
        type: 'error'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Validate props
  useEffect(() => {
    if (!user) {
      console.error('PaymentMethodsManager: user prop is required');
      setHasError(true);
      setMessage({
        text: 'User information is missing. Please log in again.',
        type: 'error'
      });
    }
  }, [user]);

  // Update default payment method in database
  const updateDefaultPaymentMethod = useCallback(async (paymentMethodId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({ 
        default_payment_method_id: paymentMethodId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) {
      throw new Error('Failed to update default payment method');
    }
  }, [user.id]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }
      
      const methods = data.paymentMethods || [];
      setPaymentMethods(methods);
      
      // Automatically set default payment method if needed
      if (methods.length === 1 && !defaultPaymentMethod) {
        // If there's only one payment method and no default is set, make it the default
        const singleMethod = methods[0];
        setDefaultPaymentMethod(singleMethod.id);
        await updateDefaultPaymentMethod(singleMethod.id);
      } else if (methods.length > 0 && !methods.find(method => method.id === defaultPaymentMethod)) {
        // If current default doesn't exist in the list, set the first one as default
        const firstMethod = methods[0];
        setDefaultPaymentMethod(firstMethod.id);
        await updateDefaultPaymentMethod(firstMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setMessage({
        text: error.message || 'Failed to load payment methods',
        type: 'error'
      });
      // Don't set hasError for API failures, just show the message
    } finally {
      setIsLoading(false);
    }
  }, [defaultPaymentMethod, updateDefaultPaymentMethod]);

  // Fetch payment methods when component mounts
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleAddPaymentMethod = async () => {
    setMessage({ text: '', type: '' });
    
    try {
      // Get a setup intent client secret
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const { clientSecret, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }
      
      if (!clientSecret) {
        throw new Error('Failed to get client secret');
      }
      
      setClientSecret(clientSecret);
      setIsAddingMethod(true);
    } catch (error) {
      console.error('Error getting setup intent:', error);
      setMessage({
        text: error.message || 'Failed to initialize payment method setup',
        type: 'error'
      });
    }
  };

  // Check if user has pending trips that would prevent payment method removal
  const checkPendingTrips = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: pendingTrips, error } = await supabase
        .from('trips')
        .select('id, status, pickup_time')
        .eq('user_id', user.id)
        .in('status', ['pending', 'upcoming'])
        .gt('pickup_time', new Date().toISOString());

      if (error) {
        console.error('Error checking pending trips:', error);
        return { hasPendingTrips: false, tripCount: 0 };
      }

      return { 
        hasPendingTrips: pendingTrips && pendingTrips.length > 0, 
        tripCount: pendingTrips ? pendingTrips.length : 0 
      };
    } catch (error) {
      console.error('Error in checkPendingTrips:', error);
      return { hasPendingTrips: false, tripCount: 0 };
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId) => {
    // Check if this is the last payment method
    if (paymentMethods.length === 1) {
      // Check for pending trips
      const { hasPendingTrips, tripCount } = await checkPendingTrips();
      
      if (hasPendingTrips) {
        setMessage({
          text: `Cannot remove your last payment method. You have ${tripCount} pending trip${tripCount > 1 ? 's' : ''} that require a payment method. Please add another payment method before removing this one.`,
          type: 'error'
        });
        return;
      }
      
      // If no pending trips, still warn about removing last payment method
      if (!window.confirm(
        'This is your only payment method. Removing it will prevent you from booking new rides until you add another payment method. Are you sure you want to continue?'
      )) {
        return;
      }
    } else {
      // Standard confirmation for non-last payment method
      if (!window.confirm('Are you sure you want to remove this payment method?')) {
        return;
      }
    }
    
    try {
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove payment method');
      }
      
      // Refresh the payment methods list
      await fetchPaymentMethods();
      
      // If this was the default payment method, clear it
      if (defaultPaymentMethod === paymentMethodId) {
        setDefaultPaymentMethod(null);
        await updateDefaultPaymentMethod(null);
      }
      
      setMessage({
        text: 'Payment method removed successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      setMessage({
        text: error.message || 'Failed to remove payment method',
        type: 'error'
      });
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId) => {
    try {
      setDefaultPaymentMethod(paymentMethodId);
      await updateDefaultPaymentMethod(paymentMethodId);
      
      setMessage({
        text: 'Default payment method updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      setMessage({
        text: error.message || 'Failed to set default payment method',
        type: 'error'
      });
    }
  };

  // Format card expiration date
  const formatExpiry = (month, year) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  // Format card number to show last 4 digits only
  const formatCardNumber = (last4) => {
    return `•••• •••• •••• ${last4}`;
  };

  // Get card brand logo (simplified version)
  const getCardBrandLogo = (brand) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳'; // In a real app, you'd use proper SVG logos
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const handleSetupSuccess = async (setupIntent) => {
    setClientSecret(null);
    setIsAddingMethod(false);
    await fetchPaymentMethods();
    setMessage({
      text: 'Payment method added successfully!',
      type: 'success'
    });
  };
  
  const handleSetupError = (error) => {
    console.error('Error in card setup:', error);
    setMessage({
      text: error.message || 'Failed to add payment method',
      type: 'error'
    });
    setIsAddingMethod(false);
    setClientSecret(null);
  };
  
  const handleSetupCancel = () => {
    setIsAddingMethod(false);
    setClientSecret(null);
  };
  
  // Error fallback UI
  if (hasError) {
    return (
      <DashboardLayout user={user} activeTab="settings">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-black">Payment Methods</h2>
            <Link 
              href="/dashboard/settings" 
              className="text-[#5fbfc0] hover:text-[#4aa5a6]"
            >
              Back to Settings
            </Link>
          </div>
          
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">Something went wrong</h3>
            <p className="text-black/70 dark:text-white/70 mb-4">
              We encountered an error loading your payment methods.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
              >
                Refresh Page
              </button>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center px-4 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm text-sm font-medium text-black dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
              >
                Back to Settings
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout user={user} activeTab="settings">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-8 mb-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Payment Methods</h2>
          <Link 
            href="/dashboard/settings" 
            className="text-[#5fbfc0] hover:text-[#4aa5a6]"
          >
            Back to Settings
          </Link>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-[#5fbfc0]/20 text-[black] dark:bg-[#5fbfc0]/30 dark:text-[white]' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-black dark:text-white font-medium">
            Add and manage your payment methods for booking rides. Your payment information is securely stored with Stripe.
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-[#5fbfc0] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-black/70 dark:text-white/70">Loading payment methods...</p>
          </div>
        ) : (
          <div>
            {isAddingMethod && clientSecret ? (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black dark:text-white mb-4">Add New Payment Method</h3>
                <StripeCardForm 
                  clientSecret={clientSecret} 
                  onSuccess={handleSetupSuccess} 
                  onError={handleSetupError} 
                  onCancel={handleSetupCancel}
                  profile={profile}
                  user={user}
                />
              </div>
            ) : (
              <>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-[#DDE5E7] dark:border-[#333333] rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-black dark:text-white">No payment methods</h3>
                    <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                      You haven&apos;t added any payment methods yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-black dark:text-white mb-2">Your Cards</h3>
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id} 
                        className={`flex justify-between items-center p-4 rounded-lg bg-white border-2 ${
                          method.id === defaultPaymentMethod 
                            ? 'border-[#5fbfc0]' 
                            : 'border-[#DDE5E7]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getCardBrandLogo(method.card.brand)}</div>
                          <div>
                            <p className="font-medium text-black">{formatCardNumber(method.card.last4)}</p>
                            <p className="text-sm text-black">
                              Expires {formatExpiry(method.card.exp_month, method.card.exp_year)}
                              {method.id === defaultPaymentMethod && (
                                <span className="ml-2 text-[#5fbfc0] font-medium">Default</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {paymentMethods.length === 1 ? (
                            // If there's only one payment method, show "Default Payment Method"
                            <span className="text-sm text-[#5fbfc0] font-medium">
                              Default Payment Method
                            </span>
                          ) : method.id !== defaultPaymentMethod ? (
                            // If there are multiple methods and this isn't the default, show "Set as Default"
                            <button
                              onClick={() => handleSetDefaultPaymentMethod(method.id)}
                              className="text-sm text-[#5fbfc0] hover:text-[#4aa5a6] font-medium"
                            >
                              Set as Default
                            </button>
                          ) : (
                            // If this is the default method in a multi-method scenario, show nothing or "Default"
                            <span className="text-sm text-[#5fbfc0] font-medium">
                              Default Payment Method
                            </span>
                          )}
                          <button
                            onClick={() => handleRemovePaymentMethod(method.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-200 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <button
                    onClick={handleAddPaymentMethod}
                    disabled={isAddingMethod}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50"
                  >
                    {isAddingMethod ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Payment Method
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-[#DDE5E7] dark:border-[#333333]">
          <h3 className="text-xl font-bold text-black dark:text-white mb-4">About Payment Processing</h3>
          <div className="text-base text-black dark:text-white space-y-2 font-medium">
            <p>
              We use Stripe to securely process all payments. Your card information is never stored on our servers.
            </p>
            <p>
              When you add a payment method, your card details are sent directly to Stripe&apos;s secure servers, and we only store a reference to that payment method.
            </p>
            <p>
              For more information about how we handle your payment information, please see our <Link href="#" className="text-[#5fbfc0] hover:text-[#4aa5a6] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}