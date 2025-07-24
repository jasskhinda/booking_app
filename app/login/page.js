'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from "next/link";
import EmailLoginForm from '@/app/components/EmailLoginForm';

function VerificationMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  
  if (error === 'email_not_verified' && message) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">{message}</p>
      </div>
    );
  }
  
  return null;
}

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
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 left-0 right-0 py-4 px-4 bg-white/95 backdrop-blur-md border-b border-white/30 z-20 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <img 
                src="/cctlogo.png" 
                alt="Compassionate Care Transportation" 
                style={{ width: '140px', height: 'auto' }}
              />
            </Link>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/signup" className="bg-[#5fbfc0] text-white px-6 py-2 rounded-lg hover:bg-[#4aa5a6] transition-all duration-200 font-medium shadow-md">
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section with Parallax and Login Form */}
      <section className="hero-parallax login-form-container">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>
        
        {/* Login Form Content */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#5fbfc0]/20 p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-[#5fbfc0] mb-2">Welcome Back</h1>
              <p className="text-gray-600">
                Sign in to your account
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-[#5fbfc0] hover:text-[#4aa5a6] transition-colors">
                  Create one here
                </Link>
              </p>
            </div>
            <EmailLoginForm />
            <Suspense fallback={null}>
              <VerificationMessage />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#5fbfc0] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white mb-4 md:mb-0">&copy; 2025 Compassionate Care Transportation. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-white hover:text-white/80">
                Terms
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                Privacy
              </Link>
              <Link href="#" className="text-white hover:text-white/80">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
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