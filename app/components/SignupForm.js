'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignupForm() {
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    marketingConsent: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
      // Sign up with Supabase - email confirmation is now enabled
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            birthdate: formData.birthdate,
            marketing_consent: formData.marketingConsent,
            role: 'client',
          },
        },
      });
      
      if (error) throw error;
      
      console.log('Signup successful', data);
      
      // If email confirmation is enabled, user will need to confirm email
      if (data?.user && !data?.session) {
        // Email confirmation required
        setUserEmail(formData.email);
        setEmailSent(true);
      } else if (data?.session) {
        // Email confirmation disabled, direct login
        router.push('/dashboard');
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Don't show refresh token errors to the user, as they're likely harmless
      // and the user is probably still authenticated
      if (error.message && error.message.includes('Refresh Token Not Found')) {
        console.log('Ignoring refresh token error and proceeding with redirect');
        // Still try to redirect to dashboard
        router.push('/dashboard');
        return;
      }
      
      // Handle common errors with user-friendly messages
      if (error.message && error.message.includes('already registered')) {
        setError('An account with this email already exists');
      } else {
        setError(error.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'client', // Assign client role for Google sign-in
            marketing_consent: formData.marketingConsent,
          },
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.message || 'Failed to sign up with Google');
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
      
      setError(''); // Clear any previous errors
      // Show success message briefly
      setError('✓ Confirmation email sent!');
      setTimeout(() => setError(''), 3000);
      
    } catch (error) {
      console.error('Resend email error:', error);
      setError(error.message || 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };

  // If email was sent, show confirmation screen
  if (emailSent) {
    return (
      <div className="mt-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#5fbfc0]/20">
            <svg className="h-6 w-6 text-[#5fbfc0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-black">Check your email</h3>
          <p className="mt-2 text-base text-black">
            We&apos;ve sent a confirmation link to:
          </p>
          <p className="mt-1 text-lg font-semibold text-[#5fbfc0]">
            {userEmail}
          </p>
        </div>

        <div className="bg-[#5fbfc0]/10 border border-[#5fbfc0]/20 rounded-lg p-4">
          <h4 className="text-base font-semibold text-black mb-2">Next steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-black">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the &ldquo;Confirm your email&rdquo; link</li>
            <li>You&apos;ll be automatically signed in</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <strong>💡 Pro tip:</strong> The confirmation link will expire in 24 hours for security.
          </div>
        </div>

        {error && (
          <div className={`p-3 text-sm rounded border ${
            error.includes('✓') 
              ? 'text-green-600 bg-green-100 border-green-200' 
              : 'text-red-600 bg-red-100 border-red-200'
          }`}>
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-[#5fbfc0] rounded-md shadow-sm text-sm font-medium text-[#5fbfc0] bg-white hover:bg-[#5fbfc0]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0] disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Resend confirmation email'}
          </button>
          
          <p className="text-center text-sm text-black">
            Didn&apos;t receive the email?{' '}
            <button
              onClick={() => {
                setEmailSent(false);
                setError('');
                setFormData(prev => ({ ...prev, email: '' }));
              }}
              className="text-[#5fbfc0] hover:underline"
            >
              try a different email address
            </button>
          </p>
          
          <div className="mt-4 text-xs text-gray-600 text-center">
            <p>Common issues:</p>
            <ul className="text-left mt-1 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Some email providers have delays (up to 10 minutes)</li>
              <li>• Corporate emails may block external links</li>
            </ul>
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