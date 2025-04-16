'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoginForm from '@/app/components/LoginForm';

function LoginContent() {
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // If user was logged out, ensure we clear the session
    const wasLoggedOut = searchParams.get('logout') === 'true';
    
    if (wasLoggedOut) {
      // Force signOut one more time to ensure cookies are cleared
      supabase.auth.signOut()
        .then(() => {
          // Add the logout parameter to the URL without triggering a navigation
          const url = new URL(window.location);
          url.searchParams.set('logout', 'true');
          window.history.replaceState({}, '', url);
        })
        .catch(err => console.error('Error clearing session after logout:', err));
    }
  }, [searchParams, supabase.auth]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              create an account
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}