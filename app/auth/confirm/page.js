'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ConfirmEmail() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get the hash fragment from the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      console.log('Email confirmation params:', { error, type, hasToken: !!accessToken });

      // Handle errors
      if (error) {
        console.error('Email confirmation error:', error, errorDescription);
        
        if (error === 'access_denied' && errorDescription?.includes('expired')) {
          // Show error directly on this page instead of redirecting
          setError('Email confirmation link has expired. Please sign up again.');
          setLoading(false);
        } else {
          // Show generic error
          setError('Email confirmation failed. Please try signing up again.');
          setLoading(false);
        }
        return;
      }

      // If we have tokens, the email is confirmed and user is logged in
      if (accessToken && type === 'signup') {
        console.log('Email confirmed successfully, redirecting to dashboard');
        
        // Wait for Supabase to fully process the session
        try {
          // Force multiple session refreshes to ensure email_confirmed_at is updated
          console.log('Starting session validation...');
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`Session attempt ${attempt}/3`);
            
            await supabase.auth.refreshSession();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log(`Attempt ${attempt} session:`, { 
              hasSession: !!session, 
              emailConfirmed: session?.user?.email_confirmed_at,
              emailVerifiedMetadata: session?.user?.user_metadata?.email_verified,
              userId: session?.user?.id,
              userEmail: session?.user?.email
            });
            
            // Check both email_confirmed_at and user_metadata.email_verified
            const isEmailVerified = session?.user?.email_confirmed_at || session?.user?.user_metadata?.email_verified;
            
            if (session && isEmailVerified) {
              console.log('Email verified successfully! Redirecting to dashboard...');
              // Add a flag to help middleware recognize this is a confirmed user
              sessionStorage.setItem('email_just_confirmed', 'true');
              window.location.href = '/dashboard';
              return;
            }
          }
          
          // If we get here, email confirmation might have failed
          console.log('Email confirmation may have failed after 3 attempts');
          setError('Email confirmation is taking longer than expected. Please try logging in.');
          setLoading(false);
        } catch (error) {
          console.error('Session check error:', error);
          // Fallback - redirect anyway
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        // No tokens or error, redirect to login
        router.push('/login');
      }
    };

    handleEmailConfirmation();
  }, [router, supabase]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Confirmation Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              href="/signup" 
              className="block w-full py-2 px-4 bg-[#5fbfc0] text-white rounded-md hover:bg-[#4aa5a6] transition-colors"
            >
              Sign Up Again
            </Link>
            <Link 
              href="/login" 
              className="block w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5fbfc0] mx-auto"></div>
        <p className="mt-4 text-gray-600">Confirming your email...</p>
      </div>
    </div>
  );
}