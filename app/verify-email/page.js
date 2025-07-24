'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const supabase = createClientComponentClient();

  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => {
        setTimer(timer - 1);
        if (timer === 1) {
          setCanResend(true);
        }
      }, 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);



  // Resend verification email
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        setError(error.message || 'Failed to resend verification email');
      } else {
        setTimer(60);
        setCanResend(false);
        setError(''); // Clear any previous errors
        // Show success message
        setTimeout(() => {
          setError('Verification email sent! Please check your inbox.');
        }, 100);
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <Link href="/">
            <img 
              src="/cctlogo.png" 
              alt="Compassionate Care Transportation" 
              className="h-12 mx-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Please verify your email
            </h1>
            <p className="text-gray-600 mb-4">
              We&apos;ve sent a verification link to
            </p>
            <p className="text-[#5fbfc0] font-semibold text-lg">
              {email}
            </p>
          </div>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Please check your email and click the verification link to activate your account.
              </p>
              <p className="text-sm text-gray-500">
                The link will expire in 24 hours.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Resend / Change Email */}
            <div className="space-y-3">
              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={!canResend || isResending}
                  className="text-[#5fbfc0] hover:text-[#4aa5a6] font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isResending ? 'Sending...' : canResend ? 'Resend verification email' : `Resend in ${timer}s`}
                </button>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/signup" 
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Change Email
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}