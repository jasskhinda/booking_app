'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConfirmEmail() {
  const router = useRouter();
  const supabase = createClientComponentClient();

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
          router.push('/login?error=expired&message=' + encodeURIComponent('Email confirmation link has expired. Please sign up again.'));
        } else {
          router.push('/login?error=' + encodeURIComponent(error));
        }
        return;
      }

      // If we have tokens, the email is confirmed and user is logged in
      if (accessToken && type === 'signup') {
        console.log('Email confirmed successfully, redirecting to dashboard');
        // Give Supabase a moment to process the session
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        // No tokens or error, redirect to login
        router.push('/login');
      }
    };

    handleEmailConfirmation();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5fbfc0] mx-auto"></div>
        <p className="mt-4 text-gray-600">Confirming your email...</p>
      </div>
    </div>
  );
}