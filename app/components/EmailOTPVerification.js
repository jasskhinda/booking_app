'use client';

import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmailOTPVerification({ email, onVerified, onBack, isSignup = false }) {
  const supabase = createClientComponentClient();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode = null) => {
    const verificationCode = otpCode || otp.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: verificationCode,
        type: isSignup ? 'signup' : 'email'
      });

      if (error) throw error;

      if (data?.user) {
        onVerified(data.user);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        setError('Invalid or expired code. Please try again.');
      } else {
        setError(error.message || 'Verification failed');
      }
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      let error;
      
      if (isSignup) {
        // For signup, resend signup confirmation
        const result = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        error = result.error;
      } else {
        // For login, send new OTP
        const result = await supabase.auth.signInWithOtp({
          email: email,
        });
        error = result.error;
      }

      if (error) throw error;

      setCooldown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend code error:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#5fbfc0]/20">
          <svg className="h-6 w-6 text-[#5fbfc0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-2xl font-bold text-black">Verify your email</h3>
        <p className="mt-2 text-base text-black">
          We've sent a 6-digit code to:
        </p>
        <p className="mt-1 text-lg font-semibold text-[#5fbfc0]">
          {email}
        </p>
      </div>

      <div className="space-y-6">
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-black mb-3">
            Enter verification code
          </label>
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleVerify()}
            disabled={isLoading || otp.some(digit => digit === '')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="text-center">
            <button
              onClick={handleResendCode}
              disabled={isResending || cooldown > 0}
              className="text-sm text-[#5fbfc0] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          <button
            onClick={onBack}
            className="w-full flex justify-center py-2 px-4 border border-[#5fbfc0] rounded-md shadow-sm text-sm font-medium text-[#5fbfc0] bg-white hover:bg-[#5fbfc0]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
          >
            {isSignup ? 'Back to Sign Up' : 'Back to Sign In'}
          </button>
        </div>
      </div>

      <div className="bg-[#5fbfc0]/10 border border-[#5fbfc0]/20 rounded-lg p-4">
        <h4 className="text-base font-semibold text-black mb-2">Didn't receive the code?</h4>
        <ul className="text-sm text-black space-y-1">
          <li>• Check your spam/junk folder</li>
          <li>• Make sure your email address is correct</li>
          <li>• Codes can take up to 2 minutes to arrive</li>
          <li>• Some email providers may block automated emails</li>
        </ul>
      </div>
    </div>
  );
}