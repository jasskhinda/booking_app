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

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const otpRefs = useRef([]);

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
  
  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when complete
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };



  // Verify OTP and complete signup
  const handleVerifyOtp = async (otpCode = null) => {
    const verificationCode = otpCode || otp.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Success!
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        if (data.redirect) {
          router.push(data.redirect);
        } else {
          router.push('/dashboard');
        }
      }, 1500);
      
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Invalid verification code');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      // Use the same OTP sending method as test-email page
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error && !error.message.includes('User already registered')) {
        throw error;
      }

      setTimer(60);
      setCanResend(false);
      setSuccess('New verification code sent! Please check your email.');
      setOtp(['', '', '', '', '', '']);
      
    } catch (err) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
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
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-[#5fbfc0] font-semibold text-lg">
              {email}
            </p>
          </div>

          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpRefs.current[index] = el}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-[#5fbfc0] focus:outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerifyOtp()}
              disabled={isLoading || otp.some(digit => digit === '')}
              className="w-full bg-[#5fbfc0] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend / Change Email */}
            <div className="space-y-3">
              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={!canResend || isResending}
                  className="text-[#5fbfc0] hover:text-[#4aa5a6] font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isResending ? 'Sending...' : canResend ? 'Resend code' : `Resend in ${timer}s`}
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