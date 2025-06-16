'use client';

import { useState } from 'react';

export default function PaymentTestPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testSetupIntent = async () => {
    setLoading(true);
    setMessage('Testing setup intent...');
    
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setMessage(`Setup Intent Test: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(`Setup Intent Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPaymentMethods = async () => {
    setLoading(true);
    setMessage('Testing payment methods...');
    
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      setMessage(`Payment Methods Test: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(`Payment Methods Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironment = () => {
    const vars = {
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    };
    
    setMessage(`Environment Variables:\n${JSON.stringify(vars, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment API Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={checkEnvironment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Check Environment Variables
          </button>
          
          <button
            onClick={testSetupIntent}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Setup Intent API
          </button>
          
          <button
            onClick={testPaymentMethods}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Payment Methods API
          </button>
        </div>
        
        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
