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
    <section
      className="relative w-full min-h-screen flex items-center justify-center bg-center bg-cover"
      style={{
        backgroundImage: "url('/login.webp')",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        marginTop: "-123px",
        padding: "167px 2px"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{background: "#00000052"}} />
      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-xl shadow-md" style={{ background: '#69c8cd' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Sign in to your account</h1>
          <p className="mt-2 text-sm" style={{ color: '#fff', fontWeight: 700 }}>
            Or{' '}
            <a href="/signup" className="font-extrabold uppercase" style={{ color: '#000', transition: 'color 0.2s' }}>
              create an account
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </section>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}