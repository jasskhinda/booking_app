'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/test-auth`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error.message);
    }
  };

  const testPaymentMethods = async () => {
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      console.log('Payment methods response:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error testing payment methods:', error);
      alert('Error: ' + error.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-black mb-6">Authentication Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p><strong>Signed in as:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={testPaymentMethods}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Test Payment Methods API
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Sign Out
              </button>
              
              <a
                href="/dashboard/payment-methods"
                className="block w-full bg-[#5fbfc0] hover:bg-[#4aa5a6] text-white font-bold py-2 px-4 rounded text-center"
              >
                Go to Payment Methods Page
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>Not signed in</p>
            </div>
            
            <button
              onClick={handleSignIn}
              className="w-full bg-[#5fbfc0] hover:bg-[#4aa5a6] text-white font-bold py-2 px-4 rounded"
            >
              Sign In with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
