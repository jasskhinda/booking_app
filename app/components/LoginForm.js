'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
    } else if (errorParam === 'server_error') {
      setError('Server error. Please try again later.');
    }
  }, [supabase.auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', { email });
      
      // Sign in with Supabase - email confirmation is now disabled in settings
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // For refresh token errors, still proceed with login
        if (error.message && error.message.includes('Refresh Token Not Found')) {
          console.log('Ignoring refresh token error during login');
        } else {
          throw error;
        }
      }
      
      // Successfully logged in
      console.log('Login successful, session:', data.session ? 'exists' : 'none');
      
      // Explicitly refresh the page instead of using router.push
      // This ensures cookies are properly sent in the next request
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Don't show refresh token errors to the user, as they're likely harmless
      if (error.message && error.message.includes('Refresh Token Not Found')) {
        console.log('Ignoring refresh token error and proceeding with redirect');
        // Still try to redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }
      
      setError(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'client', // Ensure role is set even on login
          },
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to sign in with Google');
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
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
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
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] bg-white dark:bg-[#24393C] text-[#2E4F54] dark:text-[#E0F4F5]"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5]">
              Password
            </label>
            <button 
              type="button"
              onClick={() => router.push('/reset-password')}
              className="text-sm font-medium text-[#7CCFD0] hover:text-[#60BFC0]">
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm focus:outline-none focus:ring-[#7CCFD0] focus:border-[#7CCFD0] bg-white dark:bg-[#24393C] text-[#2E4F54] dark:text-[#E0F4F5]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7CCFD0] hover:bg-[#60BFC0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#DDE5E7] dark:border-[#3F5E63]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#1C2C2F] text-[#7CCFD0]">Or continue with</span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleSignInWithGoogle}
          className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-[#DDE5E7] dark:border-[#3F5E63] rounded-md shadow-sm text-sm font-medium text-[#2E4F54] dark:text-[#E0F4F5] hover:bg-[#F8F9FA] dark:hover:bg-[#24393C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCFD0]"
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