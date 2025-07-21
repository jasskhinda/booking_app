'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestEmail() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const testMagicLink = async () => {
    if (!email) {
      setResult('Please enter an email');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      console.log('Testing magic link for:', email);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      console.log('Result:', { data, error });

      if (error) {
        setResult(`❌ Error: ${error.message}`);
      } else {
        setResult(`✅ Magic link sent successfully! Check your email: ${email}`);
      }
    } catch (err) {
      console.error('Exception:', err);
      setResult(`❌ Exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignUp = async () => {
    if (!email) {
      setResult('Please enter an email');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      console.log('Testing signup email for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'TestPassword123!',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      console.log('Signup Result:', { data, error });

      if (error) {
        setResult(`❌ Signup Error: ${error.message}`);
      } else if (data?.user && !data?.session) {
        setResult(`📧 Signup email sent to: ${email}`);
      } else {
        setResult(`✅ Signup successful (no email confirmation required)`);
      }
    } catch (err) {
      console.error('Signup Exception:', err);
      setResult(`❌ Exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">📧 Email Testing Tool</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="test@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={testMagicLink}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Test Magic Link'}
              </button>

              <button
                onClick={testSignUp}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Test Signup Email'}
              </button>
            </div>

            {result && (
              <div className={`p-3 rounded text-sm ${
                result.includes('✅') || result.includes('📧')
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {result}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🔧 Troubleshooting Steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>SMTP2GO Domain Verification:</strong> Verify both compassionatecaretransportation.com AND book.compassionatecaretransportation.com</li>
            <li><strong>Supabase SMTP Settings:</strong> Check Settings → Auth → Email Templates</li>
            <li><strong>From Email Address:</strong> Should be noreply@compassionatecaretransportation.com</li>
            <li><strong>DNS Records:</strong> Ensure SPF, DKIM, DMARC are set for both domains</li>
            <li><strong>Test Different Email:</strong> Try with Gmail, Yahoo, etc. to rule out provider blocking</li>
          </ol>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/login" 
            className="text-blue-600 hover:underline"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}