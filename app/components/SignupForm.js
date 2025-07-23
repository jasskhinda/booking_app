'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignupForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Check for OTP verification from email link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const otpVerified = urlParams.get('otp_verified');
    const emailParam = urlParams.get('email');
    
    if (otpVerified === 'true' && emailParam) {
      // User verified via email link, mark as verified
      setFormData(prev => ({ ...prev, email: emailParam }));
      setEmailVerificationState('verified');
      console.log('Email verified via email link');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [supabase]);
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    phoneNumber: '',
    address: '',
    marketingConsent: false
  });

  // Email verification states
  const [emailVerificationState, setEmailVerificationState] = useState('unverified'); // 'unverified', 'sending', 'sent', 'verified'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  
  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  
  const otpRefs = useRef([]);

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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset email verification if email changes
    if (name === 'email' && emailVerificationState !== 'unverified') {
      setEmailVerificationState('unverified');
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(0);
      setOtpError('');
    }
  };

  // Send OTP to email
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setEmailVerificationState('sending');
    setError('');
    setOtpError('');

    try {
      // Store email verification request without creating user
      const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store verification attempt in sessionStorage (expires with browser session)
      const verificationData = {
        email: formData.email,
        timestamp: Date.now(),
        verified: false,
        id: verificationId
      };
      sessionStorage.setItem('email_verification_pending', JSON.stringify(verificationData));
      
      // Use Supabase's OTP system (same as working test-email page)
      // This will create a temporary user but our signup API will handle cleanup
      const { data, error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });
      
      if (otpError) {
        throw otpError;
      }

      console.log('OTP sent to:', formData.email);
      
      setEmailVerificationState('sent');
      setOtpTimer(100); // 100 seconds to match Supabase config
      setCanResendOtp(false);

    } catch (error) {
      console.error('OTP send error:', error);
      if (error.message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(error.message || 'Failed to send verification code');
      }
      setEmailVerificationState('unverified');
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP code using Supabase (same as test-email page)
  const verifyOtpCode = async (code) => {
    try {
      // Get verification data from session
      const verificationData = JSON.parse(sessionStorage.getItem('email_verification_pending') || '{}');
      
      if (!verificationData.email) {
        setOtpError('Verification session expired. Please request a new code.');
        return false;
      }
      
      // Use Supabase's OTP verification (same as working test-email page)
      const { data, error } = await supabase.auth.verifyOtp({
        email: verificationData.email,
        token: code,
        type: 'email'
      });
      
      if (error) {
        console.error('OTP verification error:', error);
        setOtpError(error.message || 'Invalid verification code');
        return false;
      }
      
      // OTP verified successfully - we can proceed with account creation
      console.log('OTP verified successfully - email is confirmed');
      
      // Mark as verified in session
      verificationData.verified = true;
      sessionStorage.setItem('email_verification_pending', JSON.stringify(verificationData));
      
      console.log('Email verified successfully with OTP');
      setEmailVerificationState('verified');
      setOtpError('');
      return true;
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError('Failed to verify code. Please try again.');
      return false;
    }
  };

  // Handle verification code
  const handleVerifyOtp = async (otpCode = null) => {
    const verificationCode = otpCode || otp.join('');
    
    if (verificationCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setOtpError('Verifying...');
    const verified = await verifyOtpCode(verificationCode);
    
    if (!verified) {
      // Clear the OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  // Resend OTP using Supabase (same as test-email page)
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    
    setOtpError('');
    setOtp(['', '', '', '', '', '']);
    
    try {
      // Force sign out any existing sessions first
      await supabase.auth.signOut();
      
      // Resend OTP using Supabase (same as working test-email page)
      await supabase.auth.signOut(); // Sign out first
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });
      
      if (error) {
        throw error;
      }
      
      console.log('OTP resent successfully via Supabase');

      console.log('OTP resent to:', formData.email);
      setOtpTimer(100); // Reset timer to 100 seconds to match Supabase config
      setCanResendOtp(false);
      setOtpError('New verification code sent! Please check your email.');
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpError('Failed to resend code. Please try again.');
    }
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle final account creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validation
    if (emailVerificationState !== 'verified') {
      setError('Please verify your email address first');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Verify email was actually verified
      const verificationData = JSON.parse(sessionStorage.getItem('email_verification_pending') || '{}');
      
      if (!verificationData.verified || verificationData.email !== formData.email) {
        setError('Email verification required. Please verify your email first.');
        setIsLoading(false);
        return;
      }
      
      // Create the account via API (only after email verification)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthdate: formData.birthdate,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          marketingConsent: formData.marketingConsent,
          emailVerified: true, // Flag that email was verified
        }),
      });
      
      // Clean up verification session
      sessionStorage.removeItem('email_verification_pending');

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      console.log('Account created successfully');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Account creation error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google signup
  const handleSignUpWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'client',
            marketing_consent: formData.marketingConsent,
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.message || 'Failed to sign up with Google');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-black">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-black">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
            />
          </div>
        </div>
        
        {/* Email with inline verification */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black">
            Email address {emailVerificationState === 'verified' && <span className="text-green-600">✓ Verified</span>}
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={emailVerificationState === 'verified'}
              className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white] ${
                emailVerificationState === 'verified' 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-[#DDE5E7] dark:border-[#333333]'
              }`}
            />
            {emailVerificationState === 'unverified' && (
              <button
                type="button"
                onClick={handleSendOTP}
                className="px-4 py-2 bg-[#5fbfc0] text-white text-sm rounded-md hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-[#5fbfc0] whitespace-nowrap"
              >
                Verify Email
              </button>
            )}
            {emailVerificationState === 'sending' && (
              <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-md">
                Sending...
              </div>
            )}
          </div>
        </div>

        {/* Email Verification Section */}
        {emailVerificationState === 'sent' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h4 className="text-sm font-medium text-blue-900">
                Verification email sent to {formData.email}
              </h4>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-blue-900">
                <p className="mb-2">Enter the 6-digit verification code sent to your email</p>
              </div>

              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpRefs.current[index] = el}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center border-2 border-gray-300 rounded-md focus:border-[#5fbfc0] focus:outline-none text-lg font-semibold"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {otpError && (
                <div className="text-sm text-center text-red-600">
                  {otpError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {canResendOtp ? 'Resend code' : `Resend in ${formatTimer(otpTimer)}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success message when verified */}
        {emailVerificationState === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-900">
                Email verified successfully! You can now complete your registration.
              </span>
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-black">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-black">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
          />
        </div>
        
        <div>
          <label htmlFor="birthdate" className="block text-sm font-medium text-black">
            Date of Birth
          </label>
          <input
            id="birthdate"
            name="birthdate"
            type="date"
            required
            value={formData.birthdate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
          />
        </div>
        
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-black">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="(123) 456-7890"
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
          />
        </div>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-black">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            autoComplete="street-address"
            required
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St, City, State ZIP"
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
          />
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="marketingConsent"
              name="marketingConsent"
              type="checkbox"
              checked={formData.marketingConsent}
              onChange={handleChange}
              className="h-4 w-4 text-[#5fbfc0] border-[#DDE5E7] rounded focus:ring-[#5fbfc0]"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="marketingConsent" className="font-medium text-black">
              Marketing emails
            </label>
            <p className="text-black">
              I agree to receive marketing emails about special offers and promotions.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isLoading || emailVerificationState !== 'verified'}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 
           emailVerificationState !== 'verified' ? 'Please verify your email first' :
           'Create account'}
        </button>
        
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
          onClick={handleSignUpWithGoogle}
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
      </div>
    </form>
  );
}