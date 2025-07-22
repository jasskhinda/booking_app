'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function EmailLoginForm() {
  const [email, setEmail] = useState('');
  const [loginState, setLoginState] = useState('email'); // 'email', 'sending', 'otp', 'verified'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();
  const otpRefs = useRef([]);
  
  // Check for error query parameter on page load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    const freshLogin = searchParams.get('fresh') === 'true';
    const wasLoggedOut = searchParams.get('logout') === 'true';
    
    if (freshLogin || wasLoggedOut) {
      supabase.auth.signOut().catch(err => 
        console.error('Error clearing session on login page load:', err)
      );
    }
    
    if (errorParam === 'access_denied') {
      setError('Access denied. You do not have permission to access this application.');
    } else if (errorParam && errorParam !== 'access_denied') {
      try {
        const decodedError = decodeURIComponent(errorParam);
        setError(decodedError);
      } catch (e) {
        setError(errorParam);
      }
    }
  }, [supabase.auth]);

  // Timer countdown effect
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
        if (otpTimer === 1) {
          setCanResendOtp(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Send magic link to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoginState('sending');
    setError('');
    setOtpError('');

    try {
      // Try magic link first, if it fails, fall back to regular password login
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Only for existing users
        }
      });

      if (error) {
        console.error('OTP send error:', error);
        setError(error.message || 'Failed to send verification code. Please try again.');
        setLoginState('email');
        return;
      }

      console.log('OTP sent to:', email);
      setLoginState('otp');
      setOtpTimer(100); // 100 seconds to match Supabase config
      setCanResendOtp(false);

    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to send verification code. Please try again later.');
      setLoginState('email');
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpCode = null) => {
    const verificationCode = otpCode || otp.join('');
    
    if (verificationCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: verificationCode,
        type: 'email'
      });

      if (error) throw error;

      console.log('Login successful');
      router.push('/dashboard');

    } catch (error) {
      console.error('OTP verification error:', error);
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        setOtpError('Invalid or expired code. Please try again.');
      } else {
        setOtpError(error.message || 'Verification failed');
      }
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    
    setOtpError('');
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) throw error;

      setOtpTimer(100); // 100 seconds to match Supabase config
      setCanResendOtp(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpError('Failed to resend code. Please try again.');
    }
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

  const handleBackToEmail = () => {
    setLoginState('email');
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(0);
    setOtpError('');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {loginState === 'email' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
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
              We&apos;ll send you a verification code to sign in
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginState === 'sending' ? 'Sending code...' : 'Send verification code'}
          </button>

        </form>
      )}


      {loginState === 'otp' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-black">Check your email</h3>
            <p className="text-sm text-gray-600">
              We sent a verification code to {email}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Enter 6-digit code
                </label>
                <div className="flex space-x-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => otpRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-10 text-center text-lg font-bold border-2 border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              {otpError && (
                <div className="text-sm text-red-600 text-center">
                  {otpError}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="text-blue-700">
                  {otpTimer > 0 ? (
                    <>Code expires in {formatTimer(otpTimer)}</>
                  ) : (
                    <span className="text-red-600">Code expired</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Resend code
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleBackToEmail}
            className="w-full py-2 px-4 border border-[#5fbfc0] rounded-md shadow-sm text-sm font-medium text-[#5fbfc0] bg-white hover:bg-[#5fbfc0]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
          >
            ← Back to email
          </button>
        </div>
      )}

      {loginState === 'email' && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DDE5E7] dark:border-[#333333]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-[black] text-[#5fbfc0]">Or continue with</span>
            </div>
          </div>

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
        </>
      )}
    </div>
  );
}