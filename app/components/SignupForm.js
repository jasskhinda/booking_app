'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function SignupForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
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
  
  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  // Handle account creation - Step 1 of 2-step process
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Create the account via API
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
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      console.log('Account created successfully');
      
      // Show success message instead of redirecting
      if (data.showConfirmation) {
        setError('');
        // Show success state
        setFormData({
          ...formData,
          accountCreated: true
        });
      } else {
        // Fallback to dashboard
        router.push('/dashboard');
      }
      
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

  // Show success message if account was created
  if (formData.accountCreated) {
    return (
      <div className="mt-8 space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Account Created Successfully!</h3>
          <p className="text-green-700 mb-4">
            We&apos;ve sent a verification email to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-green-600 mb-6">
            Please check your email and click the verification link to activate your account.
          </p>
          <div className="space-y-3">
            <Link 
              href="/login" 
              className="block w-full py-2 px-4 bg-[#5fbfc0] text-white rounded-md hover:bg-[#4aa5a6] transition-colors"
            >
              Go to Login
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="block w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Create Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        
        {/* Email */}
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
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#333333] rounded-md shadow-sm focus:outline-none focus:ring-[#5fbfc0] focus:border-[#5fbfc0] bg-white dark:bg-[#1A1A1A] text-[black] dark:text-[white]"
          />
        </div>
        
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
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
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