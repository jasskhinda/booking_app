'use client';

import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/client-supabase';
import { getStripe } from '@/lib/stripe';

// Simplified card setup form for embedding in booking form
function EmbeddedCardSetupForm({ clientSecret, onSuccess, onError, onCancel, profile, user }) {
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
              color: '#2E4F54',
              '::placeholder': {
                color: '#7a8c91',
              },
            },
          },
        });
        console.log('Card element created:', !!cardElement.current);
        
        // Mount the card element to the DOM
        const cardElementContainer = document.getElementById('embedded-card-element-container');
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
  
  const handleSubmit = async () => {
    console.log('EmbeddedCardSetupForm handleSubmit called');
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
      console.error('Error in EmbeddedCardSetupForm handleSubmit:', error);
      onError(error);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-2">
          Card Information
        </label>
        <div className="p-3 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md bg-[#F8F9FA] dark:bg-[#24393C]">
          <div id="embedded-card-element-container" className="min-h-[40px]"></div>
        </div>
        {!stripeReady && (
          <p className="mt-2 text-xs text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
            Loading payment form...
          </p>
        )}
        {stripeError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{stripeError}</p>
        )}
        <p className="mt-2 text-xs text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
          Your card information is securely processed by Stripe.
        </p>
      </div>
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={processing || !stripeReady || !cardReady}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] disabled:opacity-50"
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
          className="inline-flex items-center px-4 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] bg-white dark:bg-[#1C2C2F] hover:bg-gray-50 dark:hover:bg-[#24393C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PaymentMethodsSection({ user, profile, onPaymentMethodChange }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(profile?.default_payment_method_id || '');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch payment methods when component mounts
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Notify parent component when payment method changes
  useEffect(() => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(selectedPaymentMethod);
    }
  }, [selectedPaymentMethod, onPaymentMethodChange]);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }
      
      const methods = data.paymentMethods || [];
      setPaymentMethods(methods);
      
      // Auto-set default payment method if there's only one
      if (methods.length === 1) {
        const singleMethod = methods[0];
        if (profile?.default_payment_method_id !== singleMethod.id) {
          // Update the default payment method in the database
          await updateDefaultPaymentMethod(singleMethod.id);
        }
        setSelectedPaymentMethod(singleMethod.id);
      } else if (methods.length > 0) {
        // If there's a default payment method and no selection yet, use it
        if (!selectedPaymentMethod) {
          const defaultMethod = methods.find(method => method.id === profile?.default_payment_method_id);
          if (defaultMethod) {
            setSelectedPaymentMethod(defaultMethod.id);
          } else {
            // If no default, select the first one
            setSelectedPaymentMethod(methods[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setMessage({
        text: error.message || 'Failed to load payment methods',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      // Check for pending trips
      const { hasPendingTrips } = await checkPendingTrips();
      if (hasPendingTrips) {
        setMessage({
          text: 'Cannot remove payment method with pending trips. Please resolve trips before removing the payment method.',
          type: 'error'
        });
        return;
      }
      
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
      
      // If this was the selected payment method, clear it
      if (selectedPaymentMethod === paymentMethodId) {
        setSelectedPaymentMethod('');
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

  // Update default payment method in database
  const updateDefaultPaymentMethod = async (paymentMethodId) => {
    try {
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
    } catch (error) {
      console.error('Error updating default payment method:', error);
      // Don't throw error here as it's a background operation
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
        return '💳';
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
    
    // Automatically select the newly added payment method
    if (setupIntent.payment_method) {
      setSelectedPaymentMethod(setupIntent.payment_method);
    }
    
    setMessage({
      text: 'Payment method added successfully!',
      type: 'success'
    });
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
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
  
  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
          Payment Method
        </label>
      </div>
      
      {message.text && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' 
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8 border-2 border-dashed border-[#DDE5E7] dark:border-[#3F5E63] rounded-lg">
          <svg className="animate-spin h-6 w-6 text-[#7CCFD0] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">Loading payment methods...</span>
        </div>
      ) : (
        <div>
          {isAddingMethod && clientSecret ? (
            <div className="border border-[#DDE5E7] dark:border-[#3F5E63] rounded-lg p-4 bg-[#F8F9FA] dark:bg-[#24393C]">
              <h4 className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-3">Add New Payment Method</h4>
              <EmbeddedCardSetupForm 
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
                <div className="text-center py-8 border-2 border-dashed border-[#DDE5E7] dark:border-[#3F5E63] rounded-lg">
                  <svg className="mx-auto h-8 w-8 text-[#7CCFD0]/50 dark:text-[#7CCFD0]/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h4 className="text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] mb-1">No payment methods</h4>
                  <p className="text-xs text-[#2E4F54]/70 dark:text-[#E0F4F5]/70 mb-3">
                    Add a payment method to complete your booking
                  </p>
                  <button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0]"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Card
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        method.id === selectedPaymentMethod 
                          ? 'border-[#7CCFD0] bg-[#7CCFD0]/10 dark:bg-[#7CCFD0]/20' 
                          : 'border-[#DDE5E7] dark:border-[#3F5E63] hover:border-[#7CCFD0]/50'
                      }`}
                      onClick={() => handlePaymentMethodSelect(method.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={method.id === selectedPaymentMethod}
                          onChange={() => handlePaymentMethodSelect(method.id)}
                          className="h-4 w-4 text-[#7CCFD0] focus:ring-[#7CCFD0] border-[#DDE5E7] dark:border-[#3F5E63]"
                        />
                        <div className="text-xl">{getCardBrandLogo(method.card.brand)}</div>
                        <div>
                          <p className="font-medium text-[#2E4F54] dark:text-[#E0F4F5] text-sm">{formatCardNumber(method.card.last4)}</p>
                          <p className="text-xs text-[#2E4F54]/70 dark:text-[#E0F4F5]/70">
                            Expires {formatExpiry(method.card.exp_month, method.card.exp_year)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePaymentMethod(method.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    disabled={isAddingMethod}
                    className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-[#DDE5E7] dark:border-[#3F5E63] rounded-md text-sm font-medium text-[#7CCFD0] hover:text-[#60BFC0] hover:border-[#7CCFD0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] disabled:opacity-50"
                  >
                    {isAddingMethod ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                        Add Another Card
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
