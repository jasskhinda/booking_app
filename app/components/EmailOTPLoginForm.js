'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import EmailOTPVerification from './EmailOTPVerification';

export default function EmailOTPLoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Check for error query parameter on page load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    const freshLogin = searchParams.get('fresh') === 'true';
    const wasLoggedOut = searchParams.get('logout') === 'true';
    
    // If this is a fresh login after signout or a logout, clear any existing session
    if (freshLogin || wasLoggedOut) {
      // Clear session to prevent redirect loops
      supabase.auth.signOut().catch(err => 
        console.error('Error clearing session on login page load:', err)
      );
    }
    
    if (errorParam === 'access_denied') {
      setError('Access denied. You do not have permission to access this application.');
    } else if (errorParam && errorParam !== 'access_denied') {
      // Decode the error message if it was encoded
      try {
        const decodedError = decodeURIComponent(errorParam);
        setError(decodedError);
      } catch (e) {
        setError(errorParam);
      }
    }
  }, [supabase.auth]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send OTP to email for login
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) throw error;

      console.log('OTP sent successfully to', email);
      
      // Show OTP verification screen
      setPendingEmail(email);
      setShowOTPVerification(true);
    } catch (error) {
      console.error('Email login error:', error);
      setError(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (user) => {
    console.log('Email OTP verified successfully for user:', user.email);
    router.push('/dashboard');
  };

  const handleBackToLogin = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
    setError('');
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    }
  };

  // Show email OTP verification screen
  if (showOTPVerification) {
    return (
      <EmailOTPVerification
        email={pendingEmail}
        onVerified={handleOTPVerified}
        onBack={handleBackToLogin}
        isSignup={false}
      />
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
            placeholder="Enter your email address"
          />
          <p className="mt-1 text-xs text-gray-500">
            We'll send you a verification code to sign in
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending code...' : 'Send verification code'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#DDE5E7] dark:border-[#333333]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-[black] text-[#5fbfc0]">Or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </button>

      {/* Info Box */}
      <div className="bg-[#5fbfc0]/10 border border-[#5fbfc0]/20 rounded-lg p-4">
        <h4 className="text-base font-semibold text-black mb-2">📧 Email OTP Authentication</h4>
        <ul className="text-sm text-black space-y-1">
          <li>• Enter your email address to receive a verification code</li>
          <li>• Check your inbox (and spam folder) for the 6-digit code</li>
          <li>• No password required - just your email and the code</li>
          <li>• More secure than traditional password login</li>
        </ul>
      </div>
    </div>
  );
}