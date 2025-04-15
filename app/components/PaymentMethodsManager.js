'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from './DashboardLayout';
import { getStripe } from '@/lib/stripe';

export default function PaymentMethodsManager({ user, profile }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(profile.default_payment_method_id);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch payment methods when component mounts
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }
      
      setPaymentMethods(data.paymentMethods || []);
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
    setIsAddingMethod(true);
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
      
      // Load the Stripe.js instance
      const stripe = await getStripe();
      
      // Open the card setup form
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: {
            // Note: In a real app, you'd use a Stripe Elements UI here
            // For simplicity in this example, we'll collect directly with the browser payment sheet
            // This will use the browser's built-in payment sheet UI
          },
          // Add customer billing details for better approval rates
          billing_details: {
            name: profile.full_name || user.user_metadata?.full_name || user.email,
            email: user.email,
          },
        },
      });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      if (setupIntent.status === 'succeeded') {
        // Refresh the payment methods list
        await fetchPaymentMethods();
        setMessage({
          text: 'Payment method added successfully!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      setMessage({
        text: error.message || 'Failed to add payment method',
        type: 'error'
      });
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
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

  const updateDefaultPaymentMethod = async (paymentMethodId) => {
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

  return (
    <DashboardLayout user={user} activeTab="settings">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Payment Methods</h2>
          <Link 
            href="/dashboard/settings" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Settings
          </Link>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Add and manage your payment methods for booking rides. Your payment information is securely stored with Stripe.
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading payment methods...</p>
          </div>
        ) : (
          <div>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium">No payment methods</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You haven&apos;t added any payment methods yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Your Cards</h3>
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className={`flex justify-between items-center p-4 border rounded-lg ${
                      method.id === defaultPaymentMethod 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getCardBrandLogo(method.card.brand)}</div>
                      <div>
                        <p className="font-medium">{formatCardNumber(method.card.last4)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Expires {formatExpiry(method.card.exp_month, method.card.exp_year)}
                          {method.id === defaultPaymentMethod && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">Default</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {method.id !== defaultPaymentMethod && (
                        <button
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isAddingMethod ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
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
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-2">About Payment Processing</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              We use Stripe to securely process all payments. Your card information is never stored on our servers.
            </p>
            <p>
              When you add a payment method, your card details are sent directly to Stripe&apos;s secure servers, and we only store a reference to that payment method.
            </p>
            <p>
              For more information about how we handle your payment information, please see our <Link href="#" className="text-blue-600 hover:underline dark:text-blue-400">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}