'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmailConfirmed() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Check if user is actually authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Start countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push('/dashboard');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        // If no session, redirect to login
        router.push('/login?error=Email confirmation failed');
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5fbfc0]/20 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-black mb-4">
          Welcome to CCT! 🎉
        </h1>
        
        <p className="text-black mb-6 leading-relaxed">
          Your email has been successfully verified and your account is now active. 
          You can now book rides, manage your profile, and access all our transportation services.
        </p>
        
        <div className="bg-[#5fbfc0]/10 border border-[#5fbfc0]/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-black">
            Redirecting to dashboard in <span className="font-bold text-[#5fbfc0]">{countdown}</span> seconds...
          </p>
        </div>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#5fbfc0] hover:bg-[#4aa5a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5fbfc0]"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}
